import 'dotenv/config';
import path from 'node:path';
export const config = {
  port: Number(process.env.PORT || 3000), host: process.env.HOST || '127.0.0.1',
  database: path.resolve(process.env.DATABASE_PATH || './data/treinamento.sqlite'),
  secret: process.env.JWT_SECRET || '', expires: process.env.JWT_EXPIRES_IN || '2h',
  production: process.env.NODE_ENV === 'production',
  origins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map(s => s.trim())
};
export function checkSecret() {
  if (config.secret.length < 32 || config.secret.startsWith('SUBSTITUA')) throw new Error('Configure JWT_SECRET com pelo menos 32 caracteres. Execute npm run setup.');
}
