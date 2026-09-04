/**
 * LIMIS ASHX Referer 解析（缺/错 Referer 会触发服务端 500 NullReference）
 */

/** 按处理程序路径（及可选 method）解析 UI Referer 路径 */
export function resolveLimsRefererPath(handlerPath: string, method?: string): string {
  const normalized = handlerPath.replace(/^\//, '').toLowerCase();
  const m = method?.trim();

  if (normalized.startsWith('index/homeindex.ashx')) {
    return '/UI/Index/home.html';
  }
  if (normalized.startsWith('index/main.ashx')) {
    return '/UI/Index/Main.html';
  }
  if (normalized.startsWith('testingorders/')) {
    return '/UI/TestingOrder/TestingOrderBase.html?menuId=3';
  }
  if (normalized.startsWith('integratedquerymanage/')) {
    return '/UI/IntegratedQueryManage/IntegratedQuery.html?menuId=8';
  }
  if (normalized.startsWith('report/testingreportquery')) {
    return '/UI/report/testingReportWaitPrint.html?type=4';
  }
  if (normalized.startsWith('task/task.ashx')) {
    if (m === 'GetTaskManagementList' || m === 'GetTaskLogNum') {
      return '/UI/Task/TaskManagement.html?menuId=6';
    }
    return '/UI/Task/TaskOverview.aspx?menuId=6';
  }
  if (normalized.startsWith('basicinfo/taskservice_new.ashx')
    || normalized.startsWith('basicinfo/taskservice.ashx')) {
    return '/UI/oa/ToDoList.aspx';
  }
  if (normalized.startsWith('basicinfo/common.ashx')) {
    return '/UI/System/DictionaryItem.html';
  }
  if (normalized.startsWith('experiment/')) {
    return '/UI/Experiment/ExperimentApprovalList.html';
  }
  if (normalized.startsWith('task/taskpause.ashx')) {
    return '/UI/Task/TaskManagement.html?menuId=6';
  }
  return '/UI/Index/home.html';
}
