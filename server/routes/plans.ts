import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { PLANS, findPlan, buildSchedule } from '../../lib/plans';
import { Plan, PlanDetail, ErrorSchema, defaultHook, json } from '../schemas';

const plans = new OpenAPIHono({ defaultHook });

const listRoute = createRoute({
  method: 'get', path: '/',
  responses: { 200: json(z.array(Plan), '플랜 목록') }
});

const detailRoute = createRoute({
  method: 'get', path: '/{planId}',
  request: { params: z.object({ planId: z.string() }) },
  responses: {
    200: json(PlanDetail, '플랜 상세 + 주차별 일정'),
    404: json(ErrorSchema, 'NOT_FOUND · 플랜을 찾을 수 없음')
  }
});

plans.openapi(listRoute, c => c.json(PLANS));

plans.openapi(detailRoute, c => {
  const p = findPlan(c.req.param('planId'));
  if(!p) return c.json({ code: 'NOT_FOUND' as const, message: '플랜을 찾을 수 없음' }, 404);
  return c.json({ ...p, schedule: buildSchedule(p) }, 200);
});

export default plans;
