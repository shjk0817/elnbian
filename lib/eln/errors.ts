/**
 * ELN API 客户端错误类型
 */

/** 网络不可达或 fetch 失败 */
export class ElnNetworkError extends Error {
  readonly kind = 'network' as const;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ElnNetworkError';
    if (cause instanceof Error) this.cause = cause;
  }
}

/** Token 无效或 API 返回认证失败 */
export class ElnAuthError extends Error {
  readonly kind = 'auth' as const;

  constructor(message: string) {
    super(message);
    this.name = 'ElnAuthError';
  }
}

/** API 业务错误或 HTTP 非 2xx */
export class ElnApiError extends Error {
  readonly kind = 'api' as const;

  constructor(
    message: string,
    readonly status?: number,
    readonly errorCode?: number,
  ) {
    super(message);
    this.name = 'ElnApiError';
  }
}

/** 判断是否为网络类错误 */
export function isNetworkError(err: unknown): boolean {
  if (err instanceof ElnNetworkError) return true;
  if (err instanceof TypeError && String(err.message).includes('fetch')) return true;
  return false;
}
