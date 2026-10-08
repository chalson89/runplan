import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { findPlan, checkPrereq, routineStats, buildSchedule, mondayOf, beforeFrom, skipOf, afterToday,
  addDays, completedRuns, sumKm } from '../../lib/plans';
import { RoutineInput, CompletionInput, Routine, RoutineSummary, Progress, ErrorSchema, defaultHook, json,
  type RoutineData, type RoutineSummaryData } from '../schemas';
import type { Context } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index';
import { routines as routineTable, completions } from '../db/schema';
import { auth } from '../auth';

// 로그인 검사가 넘기는 user
type AppEnv = { Variables: { user: typeof auth.$Infer.Session.user } };
type C = Context<AppEnv>;
type Row = typeof routineTable.$inferSelect;

const routines = new OpenAPIHono<AppEnv>({ defaultHook });

// 로그인 검사 (입력 검사보다 먼저): 세션 없으면 401, 있으면 user를 넘김
routines.use('*', async (c, next) => {
  const s = await auth.api.getSession({ headers: c.req.raw.headers });
  if(!s) return c.json({ code: 'UNAUTHORIZED', message: '로그인이 필요함' }, 401);
  c.set('user', s.user);
  await next();
});

const pad = (n: number) => String(n).padStart(2, '0');
// toISOString은 하루 밀리므로 로컬 날짜로
const localYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
// from = 루틴을 만든 날(로컬). 그 전 날은 플랜에 없음
// created_at은 시간대 없는 UTC로 저장되는데 드라이버가 로컬 시각으로 읽으므로 시차만큼 되돌림
const fromOf = (r: Row) => localYmd(new Date(r.createdAt.getTime() - r.createdAt.getTimezoneOffset()*60000));
const skipOfRow = (r: Row) => skipOf(r.start, fromOf(r));
const progressOf = (r: Row, done: string[]) => routineStats({ plan: findPlan(r.planId)!, done: new Set(done), skip: skipOfRow(r) });
const toJson = (r: Row, done: string[]): RoutineData => ({ id: String(r.id), planId: r.planId, start: r.start, from: fromOf(r), form: r.form, done,
  progress: progressOf(r, done) });
// 목록 한 줄: 끝나는 날 · 상태(가장 최근이고 기간 안 = active, 기간 끝남 = done, 새 루틴으로 바뀜 = stopped) · 달린 km
const summaryOf = (r: Row, done: string[], latest: boolean): RoutineSummaryData => {
  const start = new Date(`${r.start}T00:00:00`), end = addDays(start, findPlan(r.planId)!.weeks*7-1);
  const today = new Date(); today.setHours(0,0,0,0);
  const status = end < today ? 'done' : latest ? 'active' : 'stopped';
  const km = sumKm(completedRuns({ plan: findPlan(r.planId)!, start, done }));
  return { ...toJson(r, done), end: localYmd(end), status, km };
};
const myRoutines = (c: C) => db.select().from(routineTable).where(eq(routineTable.userId, c.get('user').id)).orderBy(desc(routineTable.id));
// 숫자 1~9자리가 아니면 DB를 찾지 않음 (없는 루틴과 같게)
const findRoutine = async (id: string) => {
  if(!/^\d{1,9}$/.test(id)) return null;
  const [r] = await db.select().from(routineTable).where(eq(routineTable.id, Number(id)));
  return r ?? null;
};
const doneOf = async (routineId: number) =>
  (await db.select({ key: completions.key }).from(completions).where(eq(completions.routineId, routineId)))
    .map(x => x.key);
const findDone = (routineId: number, key: string) => and(eq(completions.routineId, routineId), eq(completions.key, key));
const notFound = (c: C) => c.json({ code: 'NOT_FOUND' as const, message: '루틴을 찾을 수 없음' }, 404);
const forbidden = (c: C) => c.json({ code: 'FORBIDDEN' as const, message: '내 루틴이 아님' }, 403);
const notMine = (c: C, r: Row) => r.userId !== c.get('user').id;
const E401 = json(ErrorSchema, 'UNAUTHORIZED · 로그인이 필요함');
const E403 = json(ErrorSchema, 'FORBIDDEN · 내 루틴이 아님');

const createRoutineRoute = createRoute({
  method: 'post', path: '/',
  request: { body: { content: { 'application/json': { schema: RoutineInput } }, required: true } },
  responses: {
    201: json(Routine, '루틴'),
    401: E401,
    422: {
      description: 'INVALID_INPUT · 입력 규칙 표 문구 (예: 목표 거리를 선택하세요) / LEVEL_TOO_LOW · 수준 부족 안내',
      content: { 'application/json': { schema: ErrorSchema,
        example: { code: 'LEVEL_TOO_LOW' as const, message: '풀코스는 연속 10km 이상 달릴 수 있어야 함 — 10K를 권장함', recPlanId: '10k-walkrun' } } }
    }
  }
});

const listRoute = createRoute({
  method: 'get', path: '/',
  responses: {
    200: json(z.array(RoutineSummary), '내 루틴 목록 (최신순)'),
    401: E401
  }
});

const meRoute = createRoute({
  method: 'get', path: '/me',
  responses: {
    200: json(Routine, '가장 최근에 만든 내 루틴'),
    401: E401,
    404: json(ErrorSchema, 'NOT_FOUND · 루틴을 찾을 수 없음')
  }
});

const getRoutineRoute = createRoute({
  method: 'get', path: '/{routineId}',
  request: { params: z.object({ routineId: z.string() }) },
  responses: {
    200: json(Routine, '루틴'),
    401: E401,
    403: E403,
    404: json(ErrorSchema, 'NOT_FOUND · 루틴을 찾을 수 없음')
  }
});

const completeRoute = createRoute({
  method: 'post', path: '/{routineId}/completions',
  request: {
    params: z.object({ routineId: z.string() }),
    body: { content: { 'application/json': { schema: CompletionInput } }, required: true }
  },
  responses: {
    201: json(Progress, '진행률'),
    401: E401,
    403: E403,
    404: json(ErrorSchema, 'NOT_FOUND · 루틴을 찾을 수 없음'),
    409: json(ErrorSchema, 'ALREADY_DONE · 이미 완료한 훈련임'),
    422: json(ErrorSchema, 'INVALID_INPUT · key 형식이 아님 (예: 3-1) / 휴식일은 완료 체크하지 않음 / 루틴을 만들기 전 날짜는 완료 체크하지 않음 / 아직 오지 않은 날은 완료 체크하지 않음')
  }
});

const uncompleteRoute = createRoute({
  method: 'delete', path: '/{routineId}/completions/{key}',
  request: { params: z.object({ routineId: z.string(), key: z.string() }) },
  responses: {
    200: json(Progress, '진행률'),
    401: E401,
    403: E403,
    404: json(ErrorSchema, 'NOT_FOUND · 루틴을 찾을 수 없음 / 완료 기록이 없음')
  }
});

routines.openapi(createRoutineRoute, async c => {
  const form = c.req.valid('json');
  const p = findPlan(form.planId)!;

  const w = checkPrereq(p, form.ability);
  if(w) return c.json({ code: 'LEVEL_TOO_LOW' as const, message: w.msg, recPlanId: w.recId }, 422);

  const [r] = await db.insert(routineTable)
    .values({ userId: c.get('user').id, planId: form.planId, start: localYmd(mondayOf(new Date())), form }).returning();
  return c.json(toJson(r, []), 201);
});

// /me는 /{routineId}보다 먼저 등록
routines.openapi(listRoute, async c => {
  const rows = await myRoutines(c);
  return c.json(await Promise.all(rows.map(async (r, k) => summaryOf(r, await doneOf(r.id), k === 0))), 200);
});

routines.openapi(meRoute, async c => {
  const [r] = await myRoutines(c);
  if(!r) return notFound(c);
  return c.json(toJson(r, await doneOf(r.id)), 200);
});

routines.openapi(getRoutineRoute, async c => {
  const r = await findRoutine(c.req.param('routineId'));
  if(!r) return notFound(c);
  if(notMine(c, r)) return forbidden(c);
  return c.json(toJson(r, await doneOf(r.id)), 200);
});

routines.openapi(completeRoute, async c => {
  const r = await findRoutine(c.req.param('routineId'));
  if(!r) return notFound(c);
  if(notMine(c, r)) return forbidden(c);
  const { key } = c.req.valid('json');
  const [wn, di] = key.split('-').map(Number);
  const day = buildSchedule(findPlan(r.planId)!)[wn-1]?.days[di];
  if(!day || day.type === 'rest') return c.json({ code: 'INVALID_INPUT' as const, message: '휴식일은 완료 체크하지 않음' }, 422);
  if(beforeFrom({ skip: skipOfRow(r) }, wn, di)) return c.json({ code: 'INVALID_INPUT' as const, message: '루틴을 만들기 전 날짜는 완료 체크하지 않음' }, 422);
  if(afterToday(new Date(`${r.start}T00:00:00`), wn, di)) return c.json({ code: 'INVALID_INPUT' as const, message: '아직 오지 않은 날은 완료 체크하지 않음' }, 422);
  const [dup] = await db.select().from(completions).where(findDone(r.id, key));
  if(dup) return c.json({ code: 'ALREADY_DONE' as const, message: '이미 완료한 훈련임' }, 409);
  await db.insert(completions).values({ routineId: r.id, key });
  return c.json(progressOf(r, await doneOf(r.id)), 201);
});

routines.openapi(uncompleteRoute, async c => {
  const r = await findRoutine(c.req.param('routineId'));
  if(!r) return notFound(c);
  if(notMine(c, r)) return forbidden(c);
  const key = c.req.param('key');
  const gone = await db.delete(completions).where(findDone(r.id, key)).returning();
  if(!gone.length) return c.json({ code: 'NOT_FOUND' as const, message: '완료 기록이 없음' }, 404);
  return c.json(progressOf(r, await doneOf(r.id)), 200);
});

export default routines;
