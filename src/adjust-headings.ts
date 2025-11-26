import { HierarchyNode } from "./types";

/**
 * 调整 hierarchy 结构中所有 heading 节点的深度
 * @param hierarchyRoot hierarchy 根节点
 * @param contextDepth 上下文标题深度
 */
export function adjustHeadingDepths(
  hierarchyRoot: HierarchyNode,
  contextDepth: number
): void {
  // 在 hierarchy 结构上遍历所有 heading 节点
  function traverse(node: HierarchyNode): void {
    if (node.type === "heading") {
      const currentDepth = node.depth || 1;
      const newDepth = currentDepth + contextDepth + 1;

      if (newDepth > 6) {
        // 需要转换为列表
        convertHeadingToList(node);
      } else {
        node.depth = newDepth;
      }
    }

    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(hierarchyRoot);
}

/**
 * 将 heading 节点转换为 list 和 list-item
 * @param headingNode heading 节点
 */
function convertHeadingToList(headingNode: HierarchyNode): void {
  // 获取 heading 的文本内容
  const headingText = extractHeadingText(headingNode);

  // 保存 heading 的 children（这些是 heading 下的内容）
  const headingChildren = headingNode.children || [];

  // 创建 list-item，将标题文本作为第一个段落，后面跟着原 heading 的内容
  const listItem: HierarchyNode = {
    type: "listItem",
    spread: false,
    checked: null,
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
      ...headingChildren,
    ],
  };

  // 创建 list，包含这个 list-item
  const list: HierarchyNode = {
    type: "list",
    ordered: false,
    start: null,
    spread: false,
    children: [listItem],
  };

  // 替换原 heading 节点的所有属性
  Object.keys(headingNode).forEach((key) => {
    if (key !== "type" && key !== "children") {
      delete (headingNode as any)[key];
    }
  });

  // 设置新的类型和 children
  headingNode.type = "list";
  headingNode.children = list.children;
  Object.assign(headingNode, {
    ordered: false,
    start: null,
    spread: false,
  });
}

/**
 * 提取 heading 节点的文本内容
 * @param headingNode heading 节点
 * @returns 文本内容
 */
function extractHeadingText(headingNode: HierarchyNode): string {
  if (!headingNode.children) {
    return "";
  }

  const textParts: string[] = [];

  function extractText(node: HierarchyNode): void {
    if (node.type === "text") {
      textParts.push(node.value || "");
    } else if (node.children) {
      for (const child of node.children) {
        extractText(child);
      }
    }
  }

  for (const child of headingNode.children) {
    extractText(child);
  }

  return textParts.join("");
}

