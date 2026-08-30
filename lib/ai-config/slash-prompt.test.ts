import { describe, it, expect } from 'vitest';
import { buildSlashPromptBlock, isSlashQuery, splitSlashToken } from '@/lib/ai-config/slash-prompt';

describe('buildSlashPromptBlock', () => {
  it('名字进属性，正文原样放进块里（首尾空白去掉）', () => {
    expect(buildSlashPromptBlock({ name: 'summarize', body: '\n  总结这个页面。\n' })).toBe(
      '<slash-prompt name="summarize">\n总结这个页面。\n</slash-prompt>',
    );
  });

  it('名字按属性规则转义，不破坏标签结构', () => {
    const block = buildSlashPromptBlock({ name: 'a"b&c<d', body: 'x' });
    expect(block.startsWith('<slash-prompt name="a&quot;b&amp;c&lt;d">')).toBe(true);
  });

  // 提示词里出现 XML / HTML 片段是家常便饭，转义会篡改用户本意——与 <user-request>
  // 对用户文本的处理保持一致（都视为可信内容）。
  it('正文不转义：提示词里的尖括号原样保留', () => {
    const body = 'Wrap the answer in <result> tags & keep "quotes".';
    expect(buildSlashPromptBlock({ name: 'x', body })).toContain(body);
  });

  // 正文里页面可控的部分已在 replaceTemplateVars 转义过；这里不再做任何剥离，否则会把
  // 用户模板里的 React / TS 代码一起删掉，静默改写他自己写的提示词。
  it('正文里的代码写法原样保留，不做剥离', () => {
    const body = '照 <Context.Provider> 与 Array<Context> 的写法改。';
    expect(buildSlashPromptBlock({ name: 'x', body })).toContain(body);
  });

  it('正文为空 → 仍产出结构完整的块', () => {
    expect(buildSlashPromptBlock({ name: 'x', body: '   ' })).toBe(
      '<slash-prompt name="x">\n\n</slash-prompt>',
    );
  });
});

describe('splitSlashToken', () => {
  const prompt = { name: 'summarize', body: '总结这个页面。' };

  it('token 独占整段文本 → 正文为空，提示词生效', () => {
    expect(splitSlashToken('/summarize', prompt)).toEqual({ body: '', active: prompt, end: 10 });
  });

  it('token 后跟正文 → 只剥掉 token，正文原样（含分隔空白）', () => {
    expect(splitSlashToken('/summarize 顺便列个提纲', prompt)).toEqual({
      body: ' 顺便列个提纲',
      active: prompt,
      end: 10,
    });
  });

  it('token 后面是换行也算分隔', () => {
    expect(splitSlashToken('/summarize\n第二行', prompt).active).toBe(prompt);
  });

  // 用户啃掉几个字母 / 接着往后打字母，那就是另一个词了，挂载必须解除，
  // 否则会「看不见却偷偷带着一段提示词」。
  it('token 被改动 → 挂载解除，文本原样返回', () => {
    expect(splitSlashToken('/summariz', prompt)).toEqual({ body: '/summariz', active: undefined, end: 0 });
    expect(splitSlashToken('/summarizes', prompt)).toEqual({ body: '/summarizes', active: undefined, end: 0 });
  });

  it('token 不在最开头 → 不算挂载', () => {
    expect(splitSlashToken('先看看 /summarize', prompt).active).toBeUndefined();
  });

  it('没挂提示词 → 文本原样返回，字面量斜杠不被吃掉', () => {
    expect(splitSlashToken('/summarize', null)).toEqual({ body: '/summarize', active: undefined, end: 0 });
  });
});

describe('isSlashQuery', () => {
  const prompt = { name: 'summarize', body: '总结这个页面。' };

  it('`/` 开头、还没挂上提示词 → 是筛选词', () => {
    expect(isSlashQuery('/', null)).toBe(true);
    expect(isSlashQuery('/sum', null)).toBe(true);
  });

  // 筛选词也匹配 description，而 description 本来就是多个词。
  it('筛选词里带空格照样算筛选词', () => {
    expect(isSlashQuery('/当前 页面', null)).toBe(true);
  });

  it('不以 `/` 开头 → 不是筛选词', () => {
    expect(isSlashQuery('总结一下', null)).toBe(false);
    expect(isSlashQuery('', null)).toBe(false);
  });

  // 挂上之后开头同样是 `/`，但那一轮用户在写正文，菜单不该再弹出来挡着。
  it('开头那截已经是挂上的 token → 不是筛选词', () => {
    expect(isSlashQuery('/summarize', prompt)).toBe(false);
    expect(isSlashQuery('/summarize 顺便列个提纲', prompt)).toBe(false);
  });

  it('token 被改动后又变回筛选词', () => {
    expect(isSlashQuery('/summariz', prompt)).toBe(true);
  });
});
