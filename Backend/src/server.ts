import { createApp } from './app.js';
const app = createApp();
import { db } from './db.js';
const port = Number(process.env.PORT ?? 3000);
const server = app.listen(port, () => console.log(`HospedaYa API en http://localhost:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => void db.$disconnect().then(() => process.exit(0))));
