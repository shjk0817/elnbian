/**
 * 经 declarativeNetRequest 为 LIMIS AjaxRequest 注入 Referer
 * Service Worker fetch 无法自行设置 Referer（浏览器禁止），会导致 ASHX 500
 */

const RULE_ID = 92001;

let installPromise: Promise<void> | null = null;
let activeReferer = '';

/** 确保动态规则已就绪 */
async function ensureInstalled(): Promise<void> {
  if (!installPromise) {
    installPromise = chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [RULE_ID],
      addRules: [
        {
          id: RULE_ID,
          priority: 1,
          action: {
            type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
            requestHeaders: [
              { header: 'Referer', operation: 'set', value: 'http://127.0.0.1/' },
            ],
          },
          condition: {
            regexFilter: '^https?://[^/]+/AjaxRequest/',
            resourceTypes: [
              chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
              chrome.declarativeNetRequest.ResourceType.OTHER,
            ],
          },
        },
      ],
    }).then(() => undefined);
  }
  await installPromise;
}

/** 为下一次 LIMIS API 请求设置 Referer */
export async function applyLimsRefererHeader(referer: string): Promise<void> {
  await ensureInstalled();
  if (referer === activeReferer) return;
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID],
    addRules: [
      {
        id: RULE_ID,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
          requestHeaders: [
            { header: 'Referer', operation: 'set', value: referer },
          ],
        },
        condition: {
          regexFilter: '^https?://[^/]+/AjaxRequest/',
          resourceTypes: [
            chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
            chrome.declarativeNetRequest.ResourceType.OTHER,
          ],
        },
      },
    ],
  });
  activeReferer = referer;
}

/** 串行化 API 调用，避免并发改写 Referer 规则 */
let callChain: Promise<unknown> = Promise.resolve();

/** 在 Referer 规则保护下执行 LIMIS fetch */
export function withLimsReferer<T>(referer: string, fn: () => Promise<T>): Promise<T> {
  const run = async () => {
    await applyLimsRefererHeader(referer);
    return fn();
  };
  const next = callChain.then(run, run);
  callChain = next.catch(() => undefined);
  return next;
}
