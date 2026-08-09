import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '../env';
import * as schema from './schema';

/**
 * Drizzle client over Neon's HTTP driver. One shared instance per server;
 * no websocket pool to manage on Vercel's serverless runtime.
 */
export const db = drizzle(neon(env.DATABASE_URL), { schema });
