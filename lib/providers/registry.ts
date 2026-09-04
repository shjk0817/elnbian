// ─── Provider registry ───

import { t } from '@/lib/i18n';
import { VOLC_ARK_AGENT_PROVIDER, VOLC_ARK_CODING_PROVIDER } from './volc-ark';

export const OAUTH_PROVIDERS = [
  { provider: 'github-copilot', label: 'GitHub Copilot', getDescription: () => t('provider.oauth.descriptions.githubCopilot'), flow: 'device-code' as const },
  { provider: 'openai-codex', label: 'OpenAI Codex', getDescription: () => t('provider.oauth.descriptions.openaiCodex'), flow: 'auth-code' as const },
] as const satisfies readonly {
  provider: string;
  label: string;
  getDescription: () => string;
  flow: 'device-code' | 'auth-code';
}[];

export const APIKEY_PROVIDERS = [
  { provider: 'anthropic', label: 'Anthropic', pinned: true },
  { provider: 'deepseek', label: 'DeepSeek', pinned: true },
  { provider: 'google', label: 'Google Gemini', pinned: true },
  { provider: 'kimi-coding', label: 'Kimi Coding Plan' },
  { provider: 'minimax', label: 'MiniMax' },
  { provider: 'minimax-cn', label: 'MiniMax (CN)' },
  { provider: 'moonshotai', label: 'Moonshot' },
  { provider: 'moonshotai-cn', label: 'Moonshot (CN)' },
  { provider: 'openai', label: 'OpenAI', pinned: true },
  { provider: 'openrouter', label: 'OpenRouter', pinned: true },
  { provider: VOLC_ARK_AGENT_PROVIDER, label: '火山方舟 Agent Plan', pinned: true },
  { provider: VOLC_ARK_CODING_PROVIDER, label: '火山方舟 Coding Plan', pinned: true },
  { provider: 'xai', label: 'xAI' },
  { provider: 'xiaomi', label: 'Xiaomi MiMo' },
  { provider: 'xiaomi-token-plan-cn', label: 'Xiaomi MiMo Plan (CN)' },
  { provider: 'zai', label: 'zAI' },
] as const;
