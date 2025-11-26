import { HierarchyNode } from "./types";
import { toHierarchy } from "hierarchy-mdast";

/**
 * 在 hierarchy 结构中查找节点的父级 heading 节点
 * @param hierarchyRoot hierarchy 根节点
 * @param targetNode 目标节点
 * @returns 最近的祖先 heading 节点，如果没有则返回 null
 */
export function findParentHeading(
  hierarchyRoot: HierarchyNode,
  targetNode: HierarchyNode
): HierarchyNode | null {
  // 递归查找目标节点的路径
  function findPath(
    node: HierarchyNode,
    target: HierarchyNode,
    path: HierarchyNode[]
  ): HierarchyNode[] | null {
    if (node === target) {
      return path;
    }

    if (node.children) {
      for (const child of node.children) {
        const result = findPath(child, target, [...path, node]);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  const path = findPath(hierarchyRoot, targetNode, []);
  if (!path) {
    return null;
  }

  // 从路径中反向查找第一个 heading 节点（不包括目标节点本身）
  for (let i = path.length - 1; i >= 0; i--) {
    if (path[i].type === "heading") {
      return path[i];
    }
  }

  return null;
}

/**
 * 从父节点链中查找最近的 heading 节点
 * @param parent 父节点
 * @param hierarchyRoot hierarchy 根节点
 * @returns 最近的祖先 heading 节点，如果没有则返回 null
 */
export function findParentHeadingFromParent(
  parent: HierarchyNode | null,
  hierarchyRoot: HierarchyNode
): HierarchyNode | null {
  if (!parent) {
    return null;
  }

  return findParentHeading(hierarchyRoot, parent);
}

/**
 * 检查节点的父节点是否是 list-item
 * @param parent 父节点
 * @returns 如果父节点是 list-item 返回 true，否则返回 false
 */
export function isInListItem(parent: HierarchyNode | null): boolean {
  return parent !== null && parent.type === "listItem";
}

/**
 * 获取上下文标题的深度
 * @param parentHeading 父级 heading 节点
 * @returns heading 的深度，如果没有则返回 0
 */
export function getContextHeadingDepth(
  parentHeading: HierarchyNode | null
): number {
  if (!parentHeading || parentHeading.type !== "heading") {
    return 0;
  }
  return parentHeading.depth || 0;
}

