import { pgTable, serial, text, date, jsonb, timestamp, integer, unique } from 'drizzle-orm/pg-core';
import { user } from './auth-schema';
import type { RoutineInputData } from '../schemas';

export * from './auth-schema';

export const routines = pgTable('routines', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  planId: text('plan_id').notNull(),
  start: date('start', { mode: 'string' }).notNull(),
  form: jsonb('form').$type<RoutineInputData>().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
}).enableRLS();

export const completions = pgTable('completions', {
  id: serial('id').primaryKey(),
  routineId: integer('routine_id').notNull().references(() => routines.id, { onDelete: 'cascade' }),
  key: text('key').notNull()
}, t => [unique().on(t.routineId, t.key)]).enableRLS();
