import { defineConfig } from '@playwright/test';
if (!process.env.DATABASE_URL || new URL(process.env.DATABASE_URL).pathname !== '/hospedaya_test') throw new Error('E2E requiere hospedaya_test aislada.');
export default defineConfig({
  testDir: './tests/e2e', workers: 1, timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:5173', channel: 'chrome', headless: true },
  webServer: [
    { command: 'node dist/src/server.js', url: 'http://127.0.0.1:3000/api/health', reuseExistingServer: false, env: { PORT: '3000', FRONTEND_URL: 'http://127.0.0.1:5173' } },
    { command: 'npm --prefix ../Frontend run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:5173', reuseExistingServer: false, env: { VITE_API_URL: 'http://127.0.0.1:3000/api' } },
  ],
});
