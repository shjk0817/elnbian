/**
 * Formily Schema 树导航（支持 properties 与 array items.properties）
 */

type SchemaNode = Record<string, unknown>;

/** 按 name 键获取子节点 */
export function getSchemaChild(node: SchemaNode, key: string): SchemaNode | null {
  const props = node.properties as Record<string, SchemaNode> | undefined;
  if (props?.[key]) return props[key];
  const items = node.items as SchemaNode | undefined;
  const itemProps = items?.properties as Record<string, SchemaNode> | undefined;
  if (itemProps?.[key]) return itemProps[key];
  return null;
}

/** 写入子节点到 properties 或 items.properties */
export function setSchemaChild(parent: SchemaNode, key: string, child: SchemaNode): void {
  const items = parent.items as SchemaNode | undefined;
  if (items && (parent.type === 'array' || parent['x-component'] === 'ArrayTable')) {
    const itemProps = (items.properties ?? {}) as Record<string, SchemaNode>;
    itemProps[key] = child;
    items.properties = itemProps;
    parent.items = items;
    return;
  }
  const props = (parent.properties ?? {}) as Record<string, SchemaNode>;
  props[key] = child;
  parent.properties = props;
}

/** 删除子节点 */
export function deleteSchemaChild(parent: SchemaNode, key: string): boolean {
  const props = parent.properties as Record<string, SchemaNode> | undefined;
  if (props?.[key]) {
    delete props[key];
    return true;
  }
  const items = parent.items as SchemaNode | undefined;
  const itemProps = items?.properties as Record<string, SchemaNode> | undefined;
  if (itemProps?.[key]) {
    delete itemProps[key];
    return true;
  }
  return false;
}

/** 遍历直接子节点 */
export function listSchemaChildren(
  node: SchemaNode,
  onChild: (key: string, child: SchemaNode) => void
): void {
  const props = node.properties as Record<string, SchemaNode> | undefined;
  if (props) {
    for (const [k, v] of Object.entries(props)) onChild(k, v);
  }
  const items = node.items as SchemaNode | undefined;
  const itemProps = items?.properties as Record<string, SchemaNode> | undefined;
  if (itemProps) {
    for (const [k, v] of Object.entries(itemProps)) onChild(k, v);
  }
}
