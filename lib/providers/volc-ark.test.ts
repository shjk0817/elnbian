import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getVolcArkModels, VOLC_ARK_CODING_PROVIDER } from './volc-ark';

const completeMock = vi.fn();

vi.mock('@earendil-works/pi-ai/compat', () => ({
  complete: (...args: unknown[]) => completeMock(...args),
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
  beforeEach(() => {
    completeMock.mockReset();
  });

  it('非 Error 即通过（含空 content）', async () => {
    completeMock.mockResolvedValueOnce({ content: [] });
    const { verifyVolcArkApiKey } = await import('./volc-ark');
    await expect(verifyVolcArkApiKey(VOLC_ARK_CODING_PROVIDER, 'test-key')).resolves.toBeUndefined();
  });

  it('complete 返回 Error 则失败', async () => {
    completeMock.mockResolvedValueOnce(new Error('401 Unauthorized'));
    const { verifyVolcArkApiKey } = await import('./volc-ark');
    await expect(verifyVolcArkApiKey(VOLC_ARK_CODING_PROVIDER, 'bad-key')).rejects.toThrow(/401/);
  });
});
