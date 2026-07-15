const { defineConfig } = require('@prisma/config');
require('dotenv').config();

// Usamos process.env diretamente em vez do helper env() para evitar que o build do Docker 
// falhe quando a variável DATABASE_URL não estiver definida (durante a fase de build).
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/match_motoboys?schema=public';

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
});
