import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { pool } from './config/db';
import type { Server } from 'http';
import { fetchAndSaveLatestEmails } from './services/emailReceiver';

const PORT     = Number(process.env.PORT     || 5000);
const NODE_ENV =        process.env.NODE_ENV || 'development';

let server: Server;

(async function bootstrap() {
  try {
    // ── Database check ──────────────────────────────────────────────────────
    await pool.query('SELECT 1');
    console.log('MySQL connection OK');

    // ── Initial email sync ──────────────────────────────────────────────────
    try {
      await fetchAndSaveLatestEmails();
      console.log('Initial email sync completed');
    } catch (err) {
      console.error('Initial email sync failed:', err);
    }

    // ── Recurring email sync (every 60 seconds) ─────────────────────────────
    setInterval(async () => {
      try {
        await fetchAndSaveLatestEmails();
        console.log('Email sync completed');
      } catch (err) {
        console.error('Email sync failed:', err);
      }
    }, 60_000);

    // ── Start server ────────────────────────────────────────────────────────
    server = app.listen(PORT, () => {
      console.log(`${NODE_ENV} server listening on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('Unable to connect to MySQL on startup:', err);
  }
})();