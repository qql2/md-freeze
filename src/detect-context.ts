import { HierarchyNode } from "./types";

/**
 * 从路径中查找最近的 heading 节点
 * @param path 节点路径（从根到当前节点）
 * @returns 最近的 heading 节点，如果没有则返回 null
 */
export function findNearestHeading(path: HierarchyNode[]): HierarchyNode | null {
  // 从路径末尾向前查找（排除当前节点）
  for (let i = path.length - 2; i >= 0; i--) {
    if (path[i].type === "heading") {
      return path[i];
    }
  }
  return null;
}

/**
 * 获取上下文 heading 的深度
 * @param headingNode heading 节点
 * @returns heading 的深度，如果没有则返回 0
 */
export function getContextHeadingDepth(
  headingNode: HierarchyNode | null
): number {
  if (!headingNode || headingNode.type !== "heading") {
    return 0;
  }
  return headingNode.depth || 0;
}

/**
 * 检查节点是否在 list-item 中
 * @param path 节点路径
 * @returns 如果在 list-item 中则返回 true
 */
export function isInListItem(path: HierarchyNode[]): boolean {
  // 检查路径中是否有 listItem
  for (let i = path.length - 2; i >= 0; i--) {
    if (path[i].type === "listItem") {
      return true;
    }
  }
  return false;
}

/**
 * 获取 list-item 父节点
 * @param path 节点路径
 * @returns list-item 节点，如果没有则返回 null
 */
export function getListItemParent(path: HierarchyNode[]): HierarchyNode | null {
  for (let i = path.length - 2; i >= 0; i--) {
    if (path[i].type === "listItem") {
      return path[i];
    }
  }
  return null;
}
