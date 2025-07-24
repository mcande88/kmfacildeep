const Airtable = require('airtable');
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

module.exports = async (req, res) => {
  // --- CABEÇALHO CORS UNIVERSAL ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight request (CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas aceita POST!
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Suporte a JSON no body do request
  let empresa, nome_motorista, cpf5;
  try {
    if (req.body && typeof req.body === 'object') {
      ({ empresa, nome_motorista, cpf5 } = req.body);
    } else {
      // Caso venha string (às vezes Vercel não faz parse automático)
      const parsed = JSON.parse(req.body);
      empresa = parsed.empresa;
      nome_motorista = parsed.nome_motorista;
      cpf5 = parsed.cpf5;
    }
  } catch {
    return res.status(400).json({ error: 'Body inválido' });
  }

  if (!empresa || !nome_motorista || !cpf5) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  try {
    // 1. Buscar empresa pelo nome exato
    const empresas = await base('EMPRESAS').select({
      filterByFormula: `{Nome da Empresa} = '${empresa}'`
    }).firstPage();

    if (!empresas.length) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    const empresaObj = empresas[0];
    const empresaId = empresaObj.id;

    // 2. Buscar motorista pelo nome e cpf5, vinculado à empresa
    const motoristas = await base('MOTORISTAS').select({
      filterByFormula: `AND({Primeiro Nome} = '${nome_motorista}', {CPF5} = '${cpf5}', {Empresas} = '${empresaId}')`
    }).firstPage();

    if (!motoristas.length) {
      return res.status(404).json({ error: 'Motorista não encontrado' });
    }
    const motorista = motoristas[0];
    const isADM = motorista.fields['Administrador'] === true;

    // 3. Gerar token de sessão simples (simulação)
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
    console.error('[API ERROR]', err);
    return res.status(500).json({ error: 'Erro interno', details: String(err) });
  }
};
