import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import plans from './routes/plans';
import routines from './routes/routines';
import chat from './routes/chat';
import { auth } from './auth';

const app = new OpenAPIHono();
app.use(logger());
app.on(['GET', 'POST'], '/api/auth/*', c => auth.handler(c.req.raw));
app.route('/api/plans', plans);
app.route('/api/routines', routines);
app.route('/api/chat', chat);
app.doc('/doc', { openapi: '3.0.0', info: { title: 'runplan API', version: '0.1.0' } });
app.get('/ui', swaggerUI({ url: '/doc' }));
app.notFound(c => c.json({ code: 'NOT_FOUND', message: '없는 주소' }, 404));
app.onError((err, c) => {
  // 깨진 JSON 본문: 검사기가 HTTPException(400)을 던짐 → 422
  if(err instanceof HTTPException) return c.json({ code: 'INVALID_INPUT', message: '본문이 JSON 형식이 아님' }, 422);
  console.error(err);
  return c.json({ code: 'SERVER_ERROR', message: '서버 오류' }, 500);
});

export default app;
