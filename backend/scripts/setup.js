import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
if (!existsSync('.env')) {
  writeFileSync('.env', readFileSync('.env.example', 'utf8').replace('SUBSTITUA_POR_UMA_CHAVE_ALEATORIA_COM_64_CARACTERES', randomBytes(48).toString('hex')));
  console.log('.env criado com chave JWT aleatória.');
}
await import('../src/seed.js');
