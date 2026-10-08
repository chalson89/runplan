import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import app from '../server/app';
import { db, client } from '../server/db/index';
import { user, routines } from '../server/db/schema';
import { addDays, buildSchedule, findPlan, mondayOf, routineStats } from '../lib/plans';

let cookie: string;
const send = (path: string, method = 'GET', body?: unknown, withCookie = true) => {
  const headers: Record<string, string> = withCookie ? { Cookie: cookie } : {};
  return app.request(path, body === undefined ? { method, headers } : {
    method,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
};

const AC01 = { planId: '10k-novice', ability: 3, age: 28, height: 170, weight: 65, time: '저녁' };
let id: string;
// 루틴은 오늘 만들어지므로 1주차에서 오늘 전 요일은 플랜에 없음 → 기대값을 오늘 요일로 계산
const skip = (new Date().getDay() + 6) % 7;
const TOTAL = routineStats({ plan: findPlan('10k-novice')!, done: new Set(), skip }).total;
// 완료 테스트는 요일과 상관없게: 만든 루틴을 "지난주 수요일에 만든 것"으로 옮김
// → 1주차 월 · 화는 플랜에 없음(화 이지런 1개 빠져 39), 1주차 목(1-3)은 지난 날, 8주차는 아직 안 온 날
const lastMon = addDays(mondayOf(new Date()), -7);
const pad = (n: number) => String(n).padStart(2, '0');
const lastMonYmd = `${lastMon.getFullYear()}-${pad(lastMon.getMonth() + 1)}-${pad(lastMon.getDate())}`;
const lastWedNoon = addDays(lastMon, 2); lastWedNoon.setHours(12);
const email = `test-${Date.now()}@runplan.test`;

// 가입 → 응답 set-cookie의 첫 ; 앞부분을 모든 요청의 Cookie로
beforeAll(async () => {
  const res = await send('/api/auth/sign-up/email', 'POST', { name: 'test', email, password: 'runplan-test-1234' }, false);
  cookie = res.headers.get('set-cookie')!.split(';')[0];
});

describe('runplan API', () => {
  test('플랜 목록 → 조회 → 배열', async () => {
    const res = await send('/api/plans');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  test('10K 입문 플랜 → 상세 조회 → 8주 일정', async () => {
    const res = await send('/api/plans/10k-novice');
    expect(res.status).toBe(200);
    expect((await res.json()).schedule).toHaveLength(8);
  });

  test('없는 플랜 → 상세 조회 → 404', async () => {
    const res = await send('/api/plans/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ code: 'NOT_FOUND', message: '플랜을 찾을 수 없음' });
  });

  test('없는 주소 → 요청 → 404', async () => {
    const res = await send('/api/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ code: 'NOT_FOUND', message: '없는 주소' });
  });

  test('AC-01 모든 칸 채움 → 루틴 만들기 → 201', async () => {
    const res = await send('/api/routines', 'POST', AC01);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.done).toEqual([]);
    expect(body.progress).toEqual({ done: 0, total: TOTAL, pct: 0 });
    id = body.id;
    await db.update(routines).set({ start: lastMonYmd, createdAt: lastWedNoon }).where(eq(routines.id, Number(id)));
  });

  test('AC-02 planId 빠짐 → 루틴 만들기 → 422', async () => {
    const { planId, ...rest } = AC01;
    const res = await send('/api/routines', 'POST', rest);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ code: 'INVALID_INPUT', message: '목표 거리를 선택하세요' });
  });

  test('AC-05 풀 · 연속 3km → 루틴 만들기 → 422', async () => {
    const res = await send('/api/routines', 'POST', { ...AC01, planId: 'full-novice' });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      code: 'LEVEL_TOO_LOW',
      message: '풀코스는 연속 10km 이상 달릴 수 있어야 함 — 10K를 권장함',
      recPlanId: '10k-walkrun'
    });
  });

  test('나이에 글자 → 루틴 만들기 → 422', async () => {
    const res = await send('/api/routines', 'POST', { ...AC01, age: '28' });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ code: 'INVALID_INPUT', message: '나이는 10~90 사이 숫자로 입력하세요' });
  });

  test('깨진 JSON → 루틴 만들기 → 422', async () => {
    const res = await send('/api/routines', 'POST', '{"planId":');
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ code: 'INVALID_INPUT', message: '본문이 JSON 형식이 아님' });
  });

  test('로그인 안 함 → 루틴 만들기 → 401', async () => {
    const res = await send('/api/routines', 'POST', AC01, false);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ code: 'UNAUTHORIZED', message: '로그인이 필요함' });
  });

  test('없는 루틴 999 → 조회 → 404', async () => {
    const res = await send('/api/routines/999');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ code: 'NOT_FOUND', message: '루틴을 찾을 수 없음' });
  });

  test('AC-04 지난주 수요일에 만든 루틴 0/39 → 완료 1-3 → 1/39 (3%)', async () => {
    const res = await send(`/api/routines/${id}/completions`, 'POST', { key: '1-3' });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ done: 1, total: 39, pct: 3 });
  });

  test('완료한 1-3 → 다시 완료 → 409', async () => {
    const res = await send(`/api/routines/${id}/completions`, 'POST', { key: '1-3' });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ code: 'ALREADY_DONE', message: '이미 완료한 훈련임' });
  });

  test('완료한 1-3 → 내 루틴 목록 → 진행 중 · 달린 거리', async () => {
    const res = await send('/api/routines');
    expect(res.status).toBe(200);
    const [first] = await res.json();
    expect(first.id).toBe(id);
    expect(first.status).toBe('active');
    expect(first.km).toBe(buildSchedule(findPlan('10k-novice')!)[0].days[3].km);
  });

  test('루틴 있음 → 내 최근 루틴 → 200', async () => {
    const res = await send('/api/routines/me');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(id);
    expect(body.done).toEqual(['1-3']);
  });

  test('로그인 안 함 → 내 최근 루틴 → 401', async () => {
    const res = await send('/api/routines/me', 'GET', undefined, false);
    expect(res.status).toBe(401);
  });

  test('휴식일 1-0 → 완료 → 422', async () => {
    const res = await send(`/api/routines/${id}/completions`, 'POST', { key: '1-0' });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ code: 'INVALID_INPUT', message: '휴식일은 완료 체크하지 않음' });
  });

  test('루틴 만들기 전 날 1-1 → 완료 → 422', async () => {
    const res = await send(`/api/routines/${id}/completions`, 'POST', { key: '1-1' });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ code: 'INVALID_INPUT', message: '루틴을 만들기 전 날짜는 완료 체크하지 않음' });
  });

  test('아직 안 온 날 8-1 → 완료 → 422', async () => {
    const res = await send(`/api/routines/${id}/completions`, 'POST', { key: '8-1' });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ code: 'INVALID_INPUT', message: '아직 오지 않은 날은 완료 체크하지 않음' });
  });

  test('key 형식 틀림 → 완료 → 422', async () => {
    for (const key of ['abc', '01-1', '0-1']) {
      const res = await send(`/api/routines/${id}/completions`, 'POST', { key });
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual({ code: 'INVALID_INPUT', message: 'key 형식이 아님 (예: 3-1)' });
    }
  });

  test('완료한 1-3 → 완료 취소 → 0/39', async () => {
    const res = await send(`/api/routines/${id}/completions/1-3`, 'DELETE');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ done: 0, total: 39, pct: 0 });
  });

  test('취소한 1-3 → 다시 취소 → 404', async () => {
    const res = await send(`/api/routines/${id}/completions/1-3`, 'DELETE');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ code: 'NOT_FOUND', message: '완료 기록이 없음' });
  });

  // Anthropic API를 부르지 않는 검사만 (입력 검사가 먼저라 키가 없어도 됨)
  test('빈 메시지 → 챗봇 → 422', async () => {
    const res = await send('/api/chat', 'POST', { messages: [{ role: 'user', content: '' }] });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ code: 'INVALID_INPUT', message: '메시지를 입력하세요' });
  });

  test('문서 → /doc 조회 → 계약 표와 같음', async () => {
    const res = await send('/doc');
    expect(res.status).toBe(200);
    const { paths }: { paths: Record<string, Record<string, { responses: object }>> } = await res.json();
    expect(Object.keys(paths)).toHaveLength(8);
    const codes: Record<string, string[]> = {};
    for (const [p, methods] of Object.entries(paths))
      for (const [m, op] of Object.entries(methods)) codes[`${m.toUpperCase()} ${p}`] = Object.keys(op.responses).sort();
    expect(codes).toEqual({
      'GET /api/plans': ['200'],
      'GET /api/plans/{planId}': ['200', '404'],
      'POST /api/routines': ['201', '401', '422'],
      'GET /api/routines': ['200', '401'],
      'GET /api/routines/me': ['200', '401', '404'],
      'GET /api/routines/{routineId}': ['200', '401', '403', '404'],
      'POST /api/routines/{routineId}/completions': ['201', '401', '403', '404', '409', '422'],
      'DELETE /api/routines/{routineId}/completions/{key}': ['200', '401', '403', '404'],
      'POST /api/chat': ['200', '422', '502']
    });
  });
});

// 이 파일이 가입한 user 한 행만 지움 (세션 · 계정 · 루틴 · 완료 기록은 cascade) → 연결 닫음
afterAll(async () => {
  await db.delete(user).where(eq(user.email, email));
  await client.end();
});
