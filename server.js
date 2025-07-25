// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Airtable = require('airtable');
const app = express();

// Configurações básicas
app.use(cors());
app.use(express.json());

// Conexão com Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

// Rota de teste
app.get('/', (req, res) => {
  res.send('Servidor KM Fácil está funcionando! 🚚');
});

// Rota de Login
app.post('/login', async (req, res) => {
  const { empresa, nome, cpf5 } = req.body;
  
  try {
    // Passo 1: Buscar empresa
    const empresas = await base('EMPRESAS').select({
      filterByFormula: `{Nome da Empresa} = '${empresa}'`
    }).firstPage();
    
    if (empresas.length === 0) {
      return res.status(401).json({ error: 'Empresa não encontrada' });
    }
    
    const empresaId = empresas[0].id;
    
    // Passo 2: Buscar motorista
    const motoristas = await base('MOTORISTAS').select({
      filterByFormula: `AND(
        {Primeiro Nome} = '${nome}',
        {CPF5} = '${cpf5}',
        {Empresas} = '${empresaId}'
      )`
    }).firstPage();
    
    if (motoristas.length === 0) {
      return res.status(401).json({ error: 'Motorista não encontrado' });
    }
    
    const motorista = motoristas[0].fields;
    
    // Resposta de sucesso
    res.json({
      id: motoristas[0].id,
      nome: motorista['Nome Completo'],
      isAdmin: motorista.Administrador || false
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}...`));
