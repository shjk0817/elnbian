/**
 * LIMIS 客户端响应解析测试
 */

import { describe, expect, it } from 'vitest';
import { LimisSessionError, parseLimisResponseBody } from './client';
import { parseLimisMenuHtml } from './parse-menu-html';

describe('lims client', () => {
  it('识别 states=2 登录失效', () => {
    expect(() => parseLimisResponseBody('{"states":2,"msg":"登录信息已失效"}')).toThrow(LimisSessionError);
  });

  it('解析 JSON 数组', () => {
    const data = parseLimisResponseBody('[{"name":"待复核","num":1}]');
    expect(Array.isArray(data)).toBe(true);
  });

  it('json-or-empty 将空体视为空数组', () => {
    expect(parseLimisResponseBody('', 'json-or-empty')).toEqual([]);
    expect(parseLimisResponseBody('   ', 'json-or-empty')).toEqual([]);
  });

  it('text 模式原样返回 HTML', () => {
    const html = "<li><a class='J_menuItem' href='x'>菜单</a></li>";
    expect(parseLimisResponseBody(html, 'text')).toBe(html);
  });

  it('解析菜单 HTML 链接', () => {
    const html =
      "<a class='J_menuItem' href='../UserManage/PersonalCenter.html?menuId=210'>个人中心</a>";
    const items = parseLimisMenuHtml(html);
    expect(items).toEqual([
      { title: '个人中心', href: '../UserManage/PersonalCenter.html?menuId=210', menuId: '210' },
    ]);
  });
});
