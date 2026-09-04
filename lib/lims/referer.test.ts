/**
 * LIMIS Referer 路径解析测试
 */

import { describe, expect, it } from 'vitest';
import { resolveLimsRefererPath } from './referer';

describe('resolveLimsRefererPath', () => {
  it('HomeIndex → home.html', () => {
    expect(resolveLimsRefererPath('Index/HomeIndex.ashx')).toBe('/UI/Index/home.html');
  });

  it('Main.ashx → Main.html', () => {
    expect(resolveLimsRefererPath('Index/Main.ashx', 'GetReportNum')).toBe('/UI/Index/Main.html');
  });

  it('GetTaskManagementList → TaskManagement', () => {
    expect(resolveLimsRefererPath('Task/Task.ashx', 'GetTaskManagementList'))
      .toBe('/UI/Task/TaskManagement.html?menuId=6');
  });

  it('待办 → ToDoList.aspx', () => {
    expect(resolveLimsRefererPath('basicInfo/TaskService_new.ashx', 'GetToDoList1'))
      .toBe('/UI/oa/ToDoList.aspx');
  });
});
