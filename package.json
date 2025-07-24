const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

module.exports = async (req, res) => {
  try {
    // Apenas busca a primeira empresa, sem filtro
    const empresas = await base('EMPRESAS').select({ maxRecords: 1 }).firstPage();
    res.status(200).json({ teste: 'ok', empresa: empresas[0] });
  } catch (err) {
    res.status(500).json({ error: err.message, detalhes: err });
  }
};
