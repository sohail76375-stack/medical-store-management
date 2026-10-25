const { createClient } = require('@supabase/supabase-js');

const ALLOWED_KEYS = new Set([
  'districtMedicineUsers',
  'districtLoggedInUser',
  'districtMedicineHospitals',
  'districtMedicineMedicines',
  'districtMedicineOutflows'
]);

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  try {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return res.status(500).json({
        error: 'Supabase environment variables are missing.'
      });
    }

    const supabase = createClient(url, serviceKey);
    const key = req.query.key;

    if (req.method === 'GET' && !key) {
      const { data, error } = await supabase
        .from('medical_store_state')
        .select('state_key,state_value');

      if (error) throw error;

      const state = {};

      for (const row of data || []) {
        if (!ALLOWED_KEYS.has(row.state_key)) continue;

        const value = row.state_value;

        // Existing records may contain JSON stored as a string.
        state[row.state_key] =
          typeof value === 'string' ? value : JSON.stringify(value);
      }

      return res.status(200).json(state);
    }

    if (!ALLOWED_KEYS.has(key)) {
      return res.status(400).json({
        error: 'Unsupported data key.'
      });
    }

    if (req.method === 'PUT') {
      const value = req.body?.value;

      if (typeof value !== 'string') {
        return res.status(400).json({
          error: 'Invalid value.'
        });
      }

      let parsed;

      try {
        parsed = JSON.parse(value);
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

      if (existing && existing.length > 0) {
        result = await supabase
          .from('medical_store_state')
          .update({
            state_value: parsed,
            updated_at: new Date().toISOString()
          })
          .eq('state_key', key);
      } else {
        result = await supabase
          .from('medical_store_state')
          .insert({
            state_key: key,
            state_value: parsed,
            updated_at: new Date().toISOString()
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

    res.setHeader('Allow', 'GET, PUT, DELETE');

    return res.status(405).json({
      error: 'Method not allowed.'
    });

  } catch (error) {
    console.error('Supabase API error:', error.message);

    return res.status(500).json({
      error: 'Database operation failed.'
    });
  }
};
