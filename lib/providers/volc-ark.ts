/**
 * 火山方舟 Agent Plan / Coding Plan — OpenAI 兼容内置 provider
 */

import { complete } from '@earendil-works/pi-ai/compat';
import type { Api, Model } from '@earendil-works/pi-ai';

/** Agent Plan provider id */
export const VOLC_ARK_AGENT_PROVIDER = 'volcengine-ark-agent';

/** Coding Plan provider id */
export const VOLC_ARK_CODING_PROVIDER = 'volcengine-ark-coding';

const AGENT_BASE_URL = 'https://ark.cn-beijing.volces.com/api/plan/v3';
const CODING_BASE_URL = 'https://ark.cn-beijing.volces.com/api/coding/v3';

const SHARED_MODEL_IDS = [
  'ark-code-latest',
  'doubao-seed-2.0-code',
  'kimi-k2.5',
  'deepseek-v3.2',
  'glm-4.7',
] as const;

/** 支持图像输入（多模态）的模型 id */
const VISION_MODEL_IDS = new Set<string>([
  'ark-code-latest',
  'doubao-seed-2.0-code',
  'kimi-k2.5',
]);

/** 判断是否为火山方舟内置 provider */
export function isVolcArkProvider(provider: string): boolean {
  return provider === VOLC_ARK_AGENT_PROVIDER || provider === VOLC_ARK_CODING_PROVIDER;
}

/** 构建单个火山方舟模型 */
function buildModel(
  provider: string,
  baseUrl: string,
  modelId: string,
): Model<Api> {
  const vision = VISION_MODEL_IDS.has(modelId);
  return {
    id: modelId,
    name: modelId,
    api: 'openai-completions',
    provider,
    baseUrl,
    reasoning: false,
    input: vision ? ['text', 'image'] : ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 256000,
    maxTokens: 32768,
    compat: { supportsDeveloperRole: false, maxTokensField: 'max_tokens' },
  };
}

/** 返回火山方舟某 provider 的模型列表 */
export function getVolcArkModels(provider: string): Model<Api>[] {
  const baseUrl =
    provider === VOLC_ARK_AGENT_PROVIDER
      ? AGENT_BASE_URL
      : provider === VOLC_ARK_CODING_PROVIDER
        ? CODING_BASE_URL
        : null;
  if (!baseUrl) return [];
  return SHARED_MODEL_IDS.map((id) => buildModel(provider, baseUrl, id));
}

/** 校验火山方舟 API Key（chat/completions 往返成功即视为有效） */
export async function verifyVolcArkApiKey(provider: string, apiKey: string): Promise<void> {
  const models = getVolcArkModels(provider);
  const model = models.find((m) => m.id === 'deepseek-v3.2') ?? models[0];
  if (!model) throw new Error('无可用校验模型');

  const result = await complete(
    model,
    { messages: [{ role: 'user', content: 'Hi', timestamp: Date.now() }] },
    { apiKey: apiKey.trim(), maxTokens: 16 },
  );
  if (result instanceof Error) throw result;
  // Coding Plan 等场景可能返回空 text 或非 text 块；HTTP 200 即说明 Key/套餐可用
}
