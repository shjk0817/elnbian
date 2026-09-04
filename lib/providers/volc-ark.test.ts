import { describe, expect, it, vi } from 'vitest';
import { getVolcArkModels, VOLC_ARK_CODING_PROVIDER } from './volc-ark';

vi.mock('@earendil-works/pi-ai/compat', () => ({
  complete: vi.fn(async () => ({
    content: [{ type: 'text', text: '你好' }],
  })),
}));

describe('getVolcArkModels', () => {
  it('多模态模型含 image 输入', () => {
    const models = getVolcArkModels(VOLC_ARK_CODING_PROVIDER);
    const vision = models.filter((m) => m.input.includes('image'));
    expect(vision.map((m) => m.id)).toEqual(
      expect.arrayContaining(['ark-code-latest', 'doubao-seed-2.0-code', 'kimi-k2.5']),
    );
  });

  it('纯文本模型不含 image', () => {
    const models = getVolcArkModels(VOLC_ARK_CODING_PROVIDER);
    const deepseek = models.find((m) => m.id === 'deepseek-v3.2');
    expect(deepseek?.input).toEqual(['text']);
  });
});

describe('verifyVolcArkApiKey', () => {
  it('非空回复即通过', async () => {
    const { verifyVolcArkApiKey } = await import('./volc-ark');
    await expect(verifyVolcArkApiKey(VOLC_ARK_CODING_PROVIDER, 'test-key')).resolves.toBeUndefined();
  });
});
