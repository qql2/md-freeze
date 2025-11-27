import { HierarchyNode } from "./types";

/**
 * 调整 hierarchy 结构中所有 heading 节点的深度
 * @param hierarchyRoot hierarchy 根节点
 * @param contextDepth 上下文 heading 的深度
 */
export function adjustHeadingDepths(
  hierarchyRoot: HierarchyNode,
  contextDepth: number
): void {
  function traverse(node: HierarchyNode, top = false): void {
    if (node.type === "heading") {
      const plusDepth = contextDepth;
      const currentDepth = node.depth || 1;
      if (top && currentDepth > plusDepth) {
        return;
      }
      const newDepth = currentDepth + plusDepth;
      if (newDepth > 6) {
        // 将 heading 转换为 list
        convertHeadingToList(node);
      } else {
        node.depth = newDepth;
      }
    }

    // 递归处理 children
    if (node.children) {
      node.children.forEach((child) => traverse(child, node.type === "root"));
    }

    // 递归处理 content（heading 节点的内容）
    if (node.content) {
      node.content.forEach((child) => traverse(child, node.type === "root"));
    }
  }

  traverse(hierarchyRoot, true);
}

/**
 * 将 heading 节点转换为 list 和 list-item
 * @param headingNode heading 节点
 */
function convertHeadingToList(headingNode: HierarchyNode): void {
  if (headingNode.type !== "heading") {
    return;
  }

  // 提取 heading 文本
  const headingText = extractHeadingText(headingNode);

  // 创建 list-item
  const listItem: HierarchyNode = {
    type: "listItem",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            value: headingText,
          },
        ],
      },
    ],
  };

  // 将 heading 的 content 添加到 list-item 的 children
  if (headingNode.content) {
    const content = headingNode.content;
    if (Array.isArray(content)) {
      listItem.children = [...(listItem.children || []), ...content];
    }
  }

  // 创建 list
  const list: HierarchyNode = {
    type: "list",
    ordered: false,
    start: null,
    spread: false,
    children: [listItem],
  };

  // 替换 heading 节点为 list
  Object.keys(headingNode).forEach((key) => {
    if (key !== "type") {
      delete headingNode[key];
    }
  });
  Object.assign(headingNode, list);
}

/**
 * 从 heading 节点提取文本内容
 * @param headingNode heading 节点
 * @returns heading 的文本内容
 */
function extractHeadingText(headingNode: HierarchyNode): string {
  let text = "";

  function extractText(node: HierarchyNode): void {
    if (node.type === "text" && node.value) {
      text += node.value;
    }
    if (node.children) {
      node.children.forEach(extractText);
    }
  }

  if (headingNode.children) {
    headingNode.children.forEach(extractText);
  }

  return text || "Untitled";
}
