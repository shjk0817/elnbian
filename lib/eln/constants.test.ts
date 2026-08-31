/**
 * ELN 常量单元测试
 */

import { describe, expect, it } from 'vitest';
import {
  ELN_API_BASE_URL,
  ELN_LOGIN_URL,
  ELN_TAB_URL_PATTERN,
  ELN_WEB_ORIGIN,
} from './constants';

describe('ELN 固定连接参数', () => {
  it('API 与 Web origin 指向同一内网主机', () => {
    expect(ELN_WEB_ORIGIN).toBe('http://10.1.228.52');
    expect(ELN_API_BASE_URL).toBe('http://10.1.228.52:13002/api/v1');
    expect(ELN_LOGIN_URL).toBe(`${ELN_WEB_ORIGIN}/design/user/login`);
    expect(ELN_TAB_URL_PATTERN).toBe(`${ELN_WEB_ORIGIN}/*`);
  });
});
