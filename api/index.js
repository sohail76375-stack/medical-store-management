const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED_KEYS = new Set([
  'districtMedicineUsers',
  'districtLoggedInUser',
  'districtMedicineHospitals',
  'districtMedicineMedicines',
  'districtMedicineOutflows'
]);

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (!process.env.SUPABASE_URL ||
        !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Server configuration missing.' });
    }

    const key = req.query.key;

    if (req.method === 'GET' && !key) {
      const { data, error } = await supabase
        .from('medical_store_state')
        .select('key,value');

      if (error) throw error;

      const state = {};
      for (const row of data) {
        if (ALLOWED_KEYS.has(row.key)) state[row.key] = JSON.stringify(row.value);
      }

      return res.status(200).json(state);
    }

    if (!ALLOWED_KEYS.has(key)) {
      return res.status(400).json({ error: 'Unsupported data key.' });
    }

    if (req.method === 'PUT') {
      const value = req.body?.value;

      if (typeof value !== 'string') {
        return res.status(400).json({ error: 'Invalid value.' });
      }

      let parsed;
      try {
        parsed = JSON.parse(value);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON.' });
      }

      const { error } = await supabase
        .from('medical_store_state')
        .upsert({
          key,
          value: parsed,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;

      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('medical_store_state')
        .delete()
        .eq('key', key);

      if (error) throw error;

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed.' });

  } catch (error) {
    console.error('Supabase API error:', error.message);
    return res.status(500).json({ error: 'Database operation failed.' });
  }
};
