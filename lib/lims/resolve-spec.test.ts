/**
 * LIMIS 解析规格单元测试（金样例与标识识别）
 */

import { describe, expect, it } from 'vitest';
import {
  LIMS_GOLDEN_FIXTURES,
  detectIdentifierType,
  parseOrderIdFromDetailUrl,
} from './resolve-spec';

describe('lims resolve-spec', () => {
  it('金样例 HY01 样品编号字段一致', () => {
    const f = LIMS_GOLDEN_FIXTURES.sampleHy01;
    expect(f.testingOrderNo).toBe('HY01-260007');
    expect(f.sampleNo).toBe('HY01-260007-01');
    expect(f.testingReportCode).toBe('HY011-260006');
    expect(f.reportUrl).toContain('2504341');
  });

  it('金样例 LJS4 委托编号字段一致', () => {
    const f = LIMS_GOLDEN_FIXTURES.orderLjs4;
    expect(f.testingOrderNo).toBe('LJS4-260012');
    expect(f.testingReportCode).toBe('LJS41-260010');
  });

  it('识别样品编号 HY01-260007-01', () => {
    expect(detectIdentifierType('HY01-260007-01')).toBe('sample_no');
  });

  it('识别委托编号 LJS4-260012', () => {
    expect(detectIdentifierType('LJS4-260012')).toBe('order_no');
  });

  it('从详情页 URL 解析 orderId', () => {
    const url =
      'http://10.1.228.239/UI/IntegratedQueryManage/IntegratedDetail.aspx?testingOrderId=1207645';
    expect(parseOrderIdFromDetailUrl(url)).toBe(1207645);
    expect(detectIdentifierType(url)).toBe('detail_url');
  });
});
