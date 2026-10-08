import { readFileSync } from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { ChatInput, ChatReply, ErrorSchema, defaultHook, json } from '../schemas';

const chat = new OpenAPIHono({ defaultHook });

const MODEL = 'claude-haiku-4-5';
// 시스템 프롬프트: 요청마다 파일을 다시 읽음(서버를 다시 켜지 않아도 고친 내용이 바로 반영). 비어 있으면 보내지 않음
const PROMPT_FILE = new URL('../system_prompt.txt', import.meta.url);
const systemPrompt = () => readFileSync(PROMPT_FILE, 'utf8').trim();
// API 키는 .env의 ANTHROPIC_API_KEY (db/index.ts의 loadEnvFile이 읽음). 처음 쓸 때 만듦
let client: Anthropic | undefined;
const anthropic = () => client ??= new Anthropic();

const chatRoute = createRoute({
  method: 'post', path: '/',
  request: { body: { content: { 'application/json': { schema: ChatInput } }, required: true } },
  responses: {
    200: json(ChatReply, '챗봇 답'),
    422: json(ErrorSchema, 'INVALID_INPUT · 메시지를 입력하세요 / 메시지는 2000자까지 보낼 수 있어요 / 대화가 너무 길어요. 새 대화로 시작하세요'),
    502: json(ErrorSchema, 'CHAT_FAILED · 챗봇이 답하지 못했어요. 잠시 뒤 다시 시도하세요')
  }
});

chat.openapi(chatRoute, async c => {
  const { messages } = c.req.valid('json');
  const system = systemPrompt();
  try {
    const res = await anthropic().messages.create({
      model: MODEL, max_tokens: 1024, messages, ...(system ? { system } : {})
    });
    const reply = res.content.filter(b => b.type === 'text').map(b => b.text).join('');
    return c.json({ reply }, 200);
  } catch(err) {
    console.error(err instanceof Anthropic.APIError ? `Anthropic ${err.status}: ${err.message}` : err);
    return c.json({ code: 'CHAT_FAILED' as const, message: '챗봇이 답하지 못했어요. 잠시 뒤 다시 시도하세요' }, 502);
  }
});

export default chat;
