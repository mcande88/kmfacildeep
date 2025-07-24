require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Airtable = require('airtable');
const app = express();

// Configurações essenciais
app.use(cors());
app.use(express.json());

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

// Rota de teste
app.get('/', (req, res) => {
  res.send('KM Fácil API - Funcionando! ✅');
});

// Rota de Login
app.post('/login', async (req, res) => {
  try {
    console.log("Tentativa de login:", req.body);
    
    const { empresa, nome, cpf5 } = req.body;
    
    if (!empresa || !nome || !cpf5) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }
    
    const empresas = await base('EMPRESAS').select({
      filterByFormula: `{Nome da Empresa} = '${empresa}'`
    }).firstPage();
    
    if (empresas.length === 0) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    
    const empresaId = empresas[0].id;
    const motoristas = await base('MOTORISTAS').select({
      filterByFormula: `AND(
        {Primeiro Nome} = '${nome}',
        {CPF5} = '${cpf5}',
        {Empresas} = '${empresaId}'
      )`
    }).firstPage();
    
    if (motoristas.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const motorista = motoristas[0].fields;
    res.json({
      id: motoristas[0].id,
      nome: motorista['Nome Completo'],
      isAdmin: motorista.Administrador || false
    });
    
  } catch (error) {
    console.error("ERRO:", error);
    res.status(500).json({ 
      error: 'Erro no servidor',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}...`));
