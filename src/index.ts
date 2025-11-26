import { Plugin } from "unified";
import { Root } from "mdast";
import { remark } from "remark";
import { remarkObsidian } from "@qql2/remark-obsidian";
import { toHierarchy, unHierarchy } from "hierarchy-mdast";
import {
  FreezeOptions,
  ObsidianEmbedNode,
  HierarchyNode,
  PathStack,
} from "./types";
import { hasCycle, pushPath } from "./cycle-detection";
import {
  findNearestHeading,
  getContextHeadingDepth,
  isInListItem,
  getListItemParent,
} from "./detect-context";
import { adjustHeadingDepths } from "./adjust-headings";

/**
 * Remark freeze 插件
 * 将 Obsidian 嵌入的文件内容"冻结"到当前文档中，并自动调整标题层级
 */
export const remarkFreeze: Plugin<[FreezeOptions], Root, Root> = function (
  options: FreezeOptions
) {
  return async function (tree: Root) {
    const pathStack: PathStack = [];
    await processTree(tree, options, pathStack);
  };
};

/**
 * 处理 mdast 树
 * @param tree mdast 根节点
 * @param options 插件选项
 * @param pathStack 路径栈（用于循环检测）
 */
async function processTree(
  tree: Root,
  options: FreezeOptions,
  pathStack: PathStack
): Promise<void> {
  let currentTree = tree;
  let hasEmbedNodes = true;
  let iterations = 0;
  const maxIterations = 100; // 防止无限循环

  // 循环处理，直到没有 obsidianEmbed 节点
  while (hasEmbedNodes && iterations < maxIterations) {
    iterations++;
    hasEmbedNodes = false;

    // 1. 转换为 hierarchy 结构
    const hierarchyTree = toHierarchy(JSON.parse(JSON.stringify(currentTree)));

    // 2. 直接在 hierarchy 结构上遍历查找所有 obsidianEmbed 节点
    const embedNodes: Array<{
      node: HierarchyNode;
      path: HierarchyNode[];
      parent: HierarchyNode | null;
      parentArray: "children" | "content" | null;
      index: number;
    }> = [];

    function collectEmbedNodes(
      node: HierarchyNode,
      path: HierarchyNode[] = [],
      parentArray: "children" | "content" | null = null,
      index: number = -1
    ): void {
      if (node.type === "obsidianEmbed") {
        const parent = path.length > 0 ? path[path.length - 1] : null;
        embedNodes.push({ node, path, parent, parentArray, index });
      }

      // 遍历 children
      if (node.children) {
        node.children.forEach((child, idx) => {
          collectEmbedNodes(child, [...path, node], "children", idx);
        });
      }

      // 遍历 content（heading 节点的内容）
      if (node.content) {
        node.content.forEach((child, idx) => {
          collectEmbedNodes(child, [...path, node], "content", idx);
        });
      }
    }

    collectEmbedNodes(hierarchyTree, []);

    // 如果没有找到嵌入节点，退出循环
    if (embedNodes.length === 0) {
      break;
    }

    // 3. 处理每个嵌入节点（从后往前处理，避免索引变化问题）
    for (let i = embedNodes.length - 1; i >= 0; i--) {
      const {
        node: embedNode,
        path,
        parent,
        parentArray,
        index,
      } = embedNodes[i];
      const processed = await processEmbedNode(
        embedNode,
        path,
        parent,
        parentArray,
        index,
        hierarchyTree,
        options,
        pathStack
      );

      if (processed) {
        hasEmbedNodes = true; // 标记需要继续处理（可能有嵌套嵌入）
      }
    }

    // 4. 还原为 mdast
    currentTree = unHierarchy(hierarchyTree) as Root;
  }

  // 更新原始 tree
  tree.children = currentTree.children;
}

/**
 * 处理单个嵌入节点
 * @param embedNode hierarchy 中的嵌入节点
 * @param path 节点路径
 * @param parent 父节点
 * @param parentArray 父节点数组类型（children 或 content）
 * @param index 在父节点数组中的索引
 * @param hierarchyTree hierarchy 根节点
 * @param options 插件选项
 * @param pathStack 路径栈
 * @returns 是否成功处理
 */
async function processEmbedNode(
  embedNode: HierarchyNode,
  path: HierarchyNode[],
  parent: HierarchyNode | null,
  parentArray: "children" | "content" | null,
  index: number,
  hierarchyTree: HierarchyNode,
  options: FreezeOptions,
  pathStack: PathStack
): Promise<boolean> {
  // 获取文件路径
  const filePath = embedNode.data?.target;
  if (!filePath) {
    console.warn("obsidianEmbed node missing target");
    return false;
  }

  // 检查循环引用
  if (hasCycle(pathStack, filePath)) {
    console.warn(`Circular reference detected: ${filePath}`);
    return false;
  }

  // 推入路径栈
  const newPathStack = pushPath(pathStack, filePath);

  try {
    // 读取嵌入文件内容
    const embedNodeMdast = embedNode as unknown as ObsidianEmbedNode;
    const markdownContent = await Promise.resolve(
      options.readFile(embedNodeMdast)
    );

    // 解析嵌入内容
    const processor = remark().use(remarkObsidian);
    const embeddedTree = processor.parse(markdownContent) as Root;
    await processor.runSync(embeddedTree);

    // 递归处理嵌套嵌入
    await processTree(embeddedTree, options, newPathStack);

    // 转换为 hierarchy 结构以调整标题层级
    const embeddedHierarchy = toHierarchy(embeddedTree);

    // 查找上下文 heading
    const parentHeading = findNearestHeading(path);
    const contextDepth = getContextHeadingDepth(parentHeading);

    // 检查是否在 list-item 中
    const inListItem = isInListItem(path);
    const listItemParent = getListItemParent(path);

    if (!inListItem) {
      // 调整标题层级（列表项中的嵌入不调整标题）
      adjustHeadingDepths(embeddedHierarchy, contextDepth);
    }

    // 获取要插入的内容（hierarchy 结构）
    // hierarchy-mdast 的结构：root.children 包含 heading 节点，heading.content 包含该 heading 下的内容
    const contentToInsert: HierarchyNode[] = [];

    if (embeddedHierarchy.children) {
      contentToInsert.push(...embeddedHierarchy.children);
    }

    // 替换嵌入节点
    if (parent && parentArray && index !== -1) {
      const targetArray =
        parentArray === "children" ? parent.children : parent.content;
      if (targetArray) {
        // 检查父节点是否是 paragraph，如果是，需要替换整个 paragraph
        const isInParagraph = parent.type === "paragraph";

        if (isInParagraph && contentToInsert.length > 0) {
          // 如果嵌入在 paragraph 中，且要插入的是 block 节点（如 heading），
          // 需要替换整个 paragraph，而不是只替换 obsidianEmbed
          const paragraphIndex = path.findIndex((n) => n === parent);
          if (paragraphIndex !== -1 && paragraphIndex > 0) {
            const paragraphParent = path[paragraphIndex - 1];
            const paragraphParentArray = paragraphParent.children?.includes(
              parent
            )
              ? "children"
              : paragraphParent.content?.includes(parent)
              ? "content"
              : null;
            const paragraphParentArrayValue =
              paragraphParentArray === "children"
                ? paragraphParent.children
                : paragraphParent.content;
            if (paragraphParentArrayValue) {
              const paragraphIdx = paragraphParentArrayValue.indexOf(parent);
              if (paragraphIdx !== -1) {
                // 替换整个 paragraph 为新的内容
                paragraphParentArrayValue.splice(
                  paragraphIdx,
                  1,
                  ...contentToInsert
                );
                return true;
              }
            }
          }
        }

        if (inListItem && listItemParent) {
          // 在列表项中，将内容添加到 list-item.children
          if (!listItemParent.children) {
            listItemParent.children = [];
          }
          // 将 hierarchy 节点添加到 list-item 的 children
          listItemParent.children.push(...contentToInsert);
          // 移除嵌入节点
          targetArray.splice(index, 1);
        } else {
          // 正常情况：替换嵌入节点为调整后的内容
          if (contentToInsert.length > 0) {
            targetArray.splice(index, 1, ...contentToInsert);
          } else {
            targetArray.splice(index, 1);
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`Error processing embed ${filePath}:`, error);
    return false;
  }
}
