const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

module.exports = async (req, res) => {
  // --- CABEÇALHO CORS UNIVERSAL ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight request (CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- Seu código original abaixo ---
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { empresa, nome_motorista, cpf5 } = req.body;
  if (!empresa || !nome_motorista || !cpf5) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  try {
    const empresas = await base('EMPRESAS').select({
      filterByFormula: `{Nome da Empresa} = '${empresa}'`
    }).firstPage();

    if (empresas.length === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    const empresaObj = empresas[0];
    const empresaId = empresaObj.id;

    const motoristas = await base('MOTORISTAS').select({
      filterByFormula: `AND({Primeiro Nome} = '${nome_motorista}', {CPF5} = '${cpf5}', {Empresas} = '${empresaId}')`
    }).firstPage();

    if (motoristas.length === 0) {
      return res.status(404).json({ error: 'Motorista não encontrado' });
    }
    const motorista = motoristas[0];
    const isADM = motorista.fields['Administrador'] === true;

    const token = Buffer.from(`${empresaId}:${motorista.id}:${Date.now()}`).toString('base64');

    return res.status(200).json({
      sucesso: true,
      usuario: {
        id: motorista.id,
        nome: motorista.fields['Nome Completo'],
        tipo: isADM ? 'ADM' : 'Motorista',
        empresa_id: empresaId,
        empresa_nome: empresaObj.fields['Nome da Empresa'],
      },
      token,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
};
