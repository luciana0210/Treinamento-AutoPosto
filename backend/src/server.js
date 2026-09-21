import { app } from './app.js';
import { config } from './config.js';
import { db } from './db.js';
const server = app.listen(config.port, config.host, () => console.log(`Treinamento Rego & CIA: http://${config.host}:${config.port}/`));
server.on('error', error => { console.error('Não foi possível iniciar:', error.message); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => { db.close(); process.exit(0); }));
