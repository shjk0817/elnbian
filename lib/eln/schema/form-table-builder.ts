/**
 * 表单内 Table/TableRow/TableCell 矩阵布局构建器
 */

import { buildComponent } from './component-builder';

/** 构建 rows x cols 的空矩阵表格 */
export function buildFormTableShell(
  name: string,
  title: string,
  rows: number,
  cols: number
): Record<string, unknown> {
  const rowProps: Record<string, unknown> = {};
  for (let r = 0; r < rows; r++) {
    const cellProps: Record<string, unknown> = {};
    for (let c = 0; c < cols; c++) {
      cellProps[`cell_${r}_${c}`] = buildComponent({
        type: 'TableCell',
        name: `cell_${r}_${c}`,
        title: '',
      });
    }
    rowProps[`row_${r}`] = buildComponent({
      type: 'TableRow',
      name: `row_${r}`,
      title: '',
      children: cellProps,
    });
  }
  return buildComponent({
    type: 'Table',
    name,
    title,
    componentProps: { title },
    children: rowProps,
  });
}
