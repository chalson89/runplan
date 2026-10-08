import { serve } from '@hono/node-server';
import app from './app';

serve({ fetch: app.fetch, port: 8787 }, info => console.log(`Hono API http://localhost:${info.port}`));
