const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

const DATA_KEYS = new Set([
  'districtMedicineHospitals',
  'districtMedicineMedicines',
  'districtMedicineOutflows'
]);

const LEGACY_USERS_KEY = 'districtMedicineUsers';

function parseValue(value) {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 64);

  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;

  if (!stored.startsWith('scrypt$')) {
    return stored === password;
  }

  const parts = stored.split('$');
  if (parts.length !== 3) return false;

  try {
    const salt = Buffer.from(parts[1], 'hex');
    const expected = Buffer.from(parts[2], 'hex');
    const actual = await scrypt(password, salt, expected.length);

    return expected.length === actual.length &&
      crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  try {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return res.status(500).json({
        error: 'Server configuration is missing.'
      });
    }

    const supabase = createClient(url, serviceKey);
    const key = req.query.key;
    // Register a new account in Supabase.
    if (req.method === 'POST' && key === 'register') {
      const name = String(req.body?.name || '').trim();
      const cnic = String(req.body?.cnic || '').trim();
      const password = req.body?.password;

      if (
        !name ||
        !/^\d{13}$/.test(cnic) ||
        typeof password !== 'string' ||
        password.length < 6
      ) {
        return res.status(400).json({
          error: 'Enter a name, valid 13-digit CNIC, and password of at least 6 characters.'
        });
      }

      const { data: existing, error: checkError } = await supabase
        .from('app_users')
        .select('id')
        .eq('cnic', cnic)
        .limit(1);

      if (checkError) throw checkError;

      if (existing && existing.length) {
        return res.status(409).json({
          error: 'This CNIC is already registered.'
        });
      }

      const passwordHash = await hashPassword(password);

      const { data: created, error: createError } = await supabase
        .from('app_users')
        .insert({
          name,
          cnic,
          password_hash: passwordHash
        })
        .select('id,name,cnic')
        .single();

      if (createError) {
        if (createError.code === '23505') {
          return res.status(409).json({
            error: 'This CNIC is already registered.'
          });
        }
        throw createError;
      }

      return res.status(201).json({
        ok: true,
        user: {
          name: created.name,
          cnic: String(created.cnic).trim()
        }
      });
    }
    // Secure server-side login; never return the user list.
    if (req.method === 'POST' && key === 'login') {
      const cnic = String(req.body?.cnic || '').trim();
      const password = req.body?.password;

      if (!/^\d{13}$/.test(cnic) ||
          typeof password !== 'string' ||
          !password) {
        return res.status(400).json({
          error: 'Enter a valid CNIC and password.'
        });
      }

      // First check accounts already migrated to app_users.
      const { data: accounts, error: accountError } = await supabase
        .from('app_users')
        .select('id,name,cnic,password_hash')
        .eq('cnic', cnic)
        .limit(1);

      if (accountError) throw accountError;

      if (accounts && accounts.length) {
        const account = accounts[0];

        if (!await verifyPassword(password, account.password_hash)) {
          return res.status(401).json({
            error: 'Incorrect CNIC or password.'
          });
        }

        return res.status(200).json({
          ok: true,
          user: {
            name: account.name,
            cnic: String(account.cnic).trim()
          }
        });
      }

      // Look for the account in the old shared state.
      const { data: legacyRows, error: legacyError } = await supabase
        .from('medical_store_state')
        .select('state_value')
        .eq('state_key', LEGACY_USERS_KEY)
        .limit(1);

      if (legacyError) throw legacyError;

      if (!legacyRows || !legacyRows.length) {
        return res.status(401).json({
          error: 'Incorrect CNIC or password.'
        });
      }

      let users = parseValue(legacyRows[0].state_value);

      // Handle JSON encoded as a string inside JSONB.
      if (typeof users === 'string') {
        users = parseValue(users);
      }

      if (!Array.isArray(users)) {
        return res.status(500).json({
          error: 'Legacy account data has an unexpected format.'
        });
      }

      const index = users.findIndex(user =>
        String(user.cnic || '').trim() === cnic
      );

      if (index === -1) {
        return res.status(401).json({
          error: 'Incorrect CNIC or password.'
        });
      }

      const legacyUser = users[index];
      const oldPassword =
        legacyUser.password ?? legacyUser.password_hash;

      if (!await verifyPassword(password, oldPassword)) {
        return res.status(401).json({
          error: 'Incorrect CNIC or password.'
        });
      }

      // Migrate the account using a salted password hash.
      const passwordHash = await hashPassword(password);

      const { data: created, error: createError } = await supabase
        .from('app_users')
        .insert({
          name: String(legacyUser.name || 'Store User'),
          cnic,
          password_hash: passwordHash
        })
        .select('id,name,cnic')
        .single();

      if (createError) {
        // Another request may have migrated the same account.
        if (createError.code === '23505') {
          return res.status(409).json({
            error: 'Account migration conflict. Please try logging in again.'
          });
        }

        throw createError;
      }

      // Remove the plaintext legacy password from stored state.
      const remainingUsers = users.filter((_, i) => i !== index);

      const { error: cleanupError } = await supabase
        .from('medical_store_state')
        .update({ state_value: remainingUsers })
        .eq('state_key', LEGACY_USERS_KEY);

      if (cleanupError) {
        console.error('Legacy account cleanup failed:', cleanupError.message);
      }

      return res.status(200).json({
        ok: true,
        user: {
          name: created.name,
          cnic: String(created.cnic).trim()
        }
      });
    }

    // Public state contains operational data only, never user accounts.
    if (req.method === 'GET' && !key) {
      const { data, error } = await supabase
        .from('medical_store_state')
        .select('state_key,state_value');

      if (error) throw error;

      const state = {};

      for (const row of data || []) {
        if (!DATA_KEYS.has(row.state_key)) continue;

        state[row.state_key] =
          typeof row.state_value === 'string'
            ? row.state_value
            : JSON.stringify(row.state_value);
      }

      return res.status(200).json(state);
    }

    if (!DATA_KEYS.has(key)) {
      return res.status(400).json({
        error: 'Unsupported operation.'
      });
    }

    if (req.method === 'PUT') {
      if (typeof req.body?.value !== 'string') {
        return res.status(400).json({
          error: 'Invalid value.'
        });
      }

      let value;

      try {
        value = JSON.parse(req.body.value);
      } catch {
        return res.status(400).json({
          error: 'Invalid JSON.'
        });
      }

      const { data: existing, error: readError } = await supabase
        .from('medical_store_state')
        .select('state_key')
        .eq('state_key', key)
        .limit(1);

      if (readError) throw readError;

      let result;

      if (existing && existing.length) {
        result = await supabase
          .from('medical_store_state')
          .update({ state_value: value })
          .eq('state_key', key);
      } else {
        result = await supabase
          .from('medical_store_state')
          .insert({
            state_key: key,
            state_value: value
          });
      }

      if (result.error) throw result.error;

      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('medical_store_state')
        .delete()
        .eq('state_key', key);

      if (error) throw error;

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');

    return res.status(405).json({
      error: 'Method not allowed.'
    });
  } catch (error) {
    console.error('API error:', error.message);

    return res.status(500).json({
      error: 'The server could not complete the request.'
    });
  }
};
