import { z } from '@hono/zod-openapi';
import type { Context, Env } from 'hono';
import { PLANS, ABILITY, TIMES } from '../lib/plans';

// 빠진 칸 = undefined · null · '' 뿐 (ability 0은 값)
const missing = (v: unknown) => v === undefined || v === null || v === '';
const BODY_MISS = '나이 · 키 · 몸무게를 모두 입력하세요';
const num = (min: number, max: number, msg: string) =>
  z.number({ error: iss => missing(iss.input) ? BODY_MISS : msg })
    .min(min, { error: msg }).max(max, { error: msg });

/* ---------- 입력 규칙 표 (칸 순서 = 폼 순서) ---------- */
export const RoutineInput = z.object({
  planId: z.enum(PLANS.map(p => p.id), { error: '목표 거리를 선택하세요' }),
  ability: z.literal(ABILITY.map(([v]) => v), { error: '현재 수준을 선택하세요' }),
  age: num(10, 90, '나이는 10~90 사이 숫자로 입력하세요'),
  height: num(100, 230, '키는 100~230 사이 숫자로 입력하세요'),
  weight: num(30, 200, '몸무게는 30~200 사이 숫자로 입력하세요'),
  time: z.enum(TIMES.map(([t]) => t), { error: '운동 시간대를 선택하세요' })
}).openapi('RoutineInput');

const KEY_MSG = 'key 형식이 아님 (예: 3-1)';
export const CompletionInput = z.object({
  key: z.string({ error: KEY_MSG }).regex(/^[1-9][0-9]*-[0-6]$/, { error: KEY_MSG })
}).openapi('CompletionInput');

/* ---------- 응답 양식 (문서용, 응답은 검사하지 않음) ---------- */
export const ErrorSchema = z.object({
  code: z.enum(['NOT_FOUND', 'INVALID_INPUT', 'LEVEL_TOO_LOW', 'ALREADY_DONE', 'SERVER_ERROR', 'UNAUTHORIZED', 'FORBIDDEN', 'CHAT_FAILED']),
  message: z.string(),
  recPlanId: z.string().optional()
}).openapi('Error');

export const Progress = z.object({
  done: z.number(),
  total: z.number(),
  pct: z.number()
}).openapi('Progress');

export const Routine = z.object({
  id: z.string(),
  planId: z.string(),
  start: z.string(),
  from: z.string(),
  form: RoutineInput,
  done: z.array(z.string()),
  progress: Progress
}).openapi('Routine');

// 내 루틴 목록 한 줄: 루틴 + 끝나는 날 · 상태 · 달린 거리
export const RoutineSummary = Routine.extend({
  end: z.string(),
  status: z.enum(['active', 'done', 'stopped']),
  km: z.number()
}).openapi('RoutineSummary');

export const Plan = z.looseObject({}).openapi('Plan');
export const PlanDetail = z.looseObject({}).openapi('PlanDetail');

/* ---------- 검사 실패 훅 ---------- */
// 라우터마다 Env(로그인 user 등)가 달라서 E로 받음
export const defaultHook = <E extends Env>(result: { success: true } | { success: false; error: z.ZodError }, c: Context<E>) => {
  if(!result.success) return c.json({ code: 'INVALID_INPUT', message: result.error.issues[0].message }, 422);
};

/* ---------- 챗봇 ---------- */
// 대화 전체(처음은 user, user · assistant 번갈아)를 보냄. 서버는 대화를 저장하지 않음
export const ChatInput = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1, { error: '메시지를 입력하세요' }).max(2000, { error: '메시지는 2000자까지 보낼 수 있어요' })
  })).min(1, { error: '메시지를 입력하세요' }).max(40, { error: '대화가 너무 길어요. 새 대화로 시작하세요' })
}).openapi('ChatInput');

export const ChatReply = z.object({ reply: z.string() }).openapi('ChatReply');

// 응답 칸 줄여 쓰기
export const json = <T extends z.ZodType>(schema: T, description: string) => ({ content: { 'application/json': { schema } }, description });

/* ---------- 스키마에서 뽑은 타입 ---------- */
export type RoutineInputData = z.infer<typeof RoutineInput>;
export type RoutineData = z.infer<typeof Routine>;
export type RoutineSummaryData = z.infer<typeof RoutineSummary>;
export type ProgressData = z.infer<typeof Progress>;
export type ErrorData = z.infer<typeof ErrorSchema>;
