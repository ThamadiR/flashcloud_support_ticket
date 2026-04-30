// Re-parsing file
import express from 'express';
import cors from 'cors';
import path from 'path';
import ticketsRoutes   from './routes/ticketsRoutes';
import contactRoutes   from './routes/contactRoutes';
import companiesRoutes from './routes/companiesRoutes';
import authRoutes      from './routes/authRoutes';
import roleRoutes      from './routes/roleRoutes';
import emailRoutes     from './routes/emailRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import userRoutes      from './routes/userRoutes';

const app = express();



// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin:      ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));

app.use(express.json());

// ── Static Files ──────────────────────────────────────────────────────────────

app.use('/uploads', express.static(path.resolve('uploads'), {
  maxAge:     '7d',
  extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
}));

// ── Routes ────────────────────────────────────────────────────────────────────

// Routes are now partially managed centrally in src/routes/routes.ts
app.use('/api/tickets',   ticketsRoutes);
app.use('/api/contacts',  contactRoutes);
// Companies, Auth, Users are registered via registerRoutes in server.ts
// app.use('/api/companies', companiesRoutes);
// app.use('/api/auth',      authRoutes);
app.use('/api/roles',     roleRoutes);
app.use('/api/emails',    emailRoutes);
app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/users',     userRoutes);

export default app;