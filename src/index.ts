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
  findParentHeadingFromParent,
  getContextHeadingDepth,
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
  let hasEmbedNodes = true;
  let iterations = 0;
  const maxIterations = 100; // 防止无限循环

  // 循环处理，直到没有 obsidianEmbed 节点
  while (hasEmbedNodes && iterations < maxIterations) {
    iterations++;

    // 1. 在 mdast 上直接查找所有 obsidianEmbed 节点（因为 toHierarchy 可能不支持 obsidianEmbed）
    const embedNodes: Array<{
      node: any;
      parent: any;
      index: number;
    }> = [];

    function collectEmbedNodes(node: any, parent: any, index: number): void {
      if (node.type === "obsidianEmbed") {
        embedNodes.push({ node, parent, index });
      }

      if (node.children) {
        node.children.forEach((child: any, idx: number) => {
          collectEmbedNodes(child, node, idx);
        });
      }
    }

    collectEmbedNodes(tree, null, -1);

    // 如果没有找到嵌入节点，退出循环
    if (embedNodes.length === 0) {
      hasEmbedNodes = false;
      break;
    }

    // 2. 转换为 hierarchy 结构以进行上下文检测
    const hierarchyTree = toHierarchy(JSON.parse(JSON.stringify(tree)));

    // 3. 处理每个嵌入节点（从后往前处理，避免索引变化问题）
    for (let i = embedNodes.length - 1; i >= 0; i--) {
      const { node, parent } = embedNodes[i];
      const processed = await processEmbedNode(
        node as ObsidianEmbedNode,
        parent,
        tree,
        hierarchyTree,
        options,
        pathStack
      );

      // 如果节点没有被处理（比如循环检测跳过），需要移除它
      if (!processed && parent) {
        const embedIndex = parent.children?.indexOf(node);
        if (embedIndex !== undefined && embedIndex !== -1 && parent.children) {
          parent.children.splice(embedIndex, 1);
        }
      } else if (!processed && !parent) {
        // 如果节点在根节点下且没有被处理，需要移除
        const embedIndex = tree.children?.indexOf(node);
        if (embedIndex !== undefined && embedIndex !== -1 && tree.children) {
          tree.children.splice(embedIndex, 1);
        }
      }
    }
  }

  if (iterations >= maxIterations) {
    console.warn("警告: 达到最大迭代次数，可能存在循环嵌套");
  }
}

/**
 * 处理单个嵌入节点
 * @param embedNode 嵌入节点
 * @param parent 父节点
 * @param hierarchyRoot hierarchy 根节点
 * @param options 插件选项
 * @param pathStack 路径栈
 * @returns 是否成功处理了节点
 */
async function processEmbedNode(
  embedNode: any, // mdast 节点
  parent: any, // mdast 父节点
  tree: Root, // 完整的 mdast 树
  hierarchyTree: HierarchyNode, // hierarchy 结构（用于上下文检测）
  options: FreezeOptions,
  pathStack: PathStack
): Promise<boolean> {
  const filePath = embedNode.data.target;

  // 检查循环嵌套
  if (hasCycle(pathStack, filePath)) {
    console.warn(
      `检测到循环嵌套，跳过文件: ${filePath}，路径栈: ${pathStack.join(" -> ")}`
    );
    return false;
  }

  // 推入路径栈
  const newPathStack = pushPath(pathStack, filePath);

  try {
    // 读取嵌入文件内容
    const markdownContent = await Promise.resolve(options.readFile(embedNode));

    // 解析嵌入内容
    const processor = remark().use(remarkObsidian);
    const embeddedTree = processor.parse(markdownContent) as Root;
    await processor.runSync(embeddedTree);

    // 递归处理嵌套嵌入
    await processTree(embeddedTree, options, newPathStack);

    // 查找父节点在 hierarchy 中的对应节点（用于上下文检测）
    let hierarchyParent: HierarchyNode | null = null;
    if (parent) {
      // 查找 parent 在 hierarchy 中的位置
      function findHierarchyNode(
        mdastNode: any,
        hierarchyNode: HierarchyNode
      ): HierarchyNode | null {
        if (mdastNode === parent) {
          return hierarchyNode;
        }
        if (mdastNode.children && hierarchyNode.children) {
          for (let i = 0; i < mdastNode.children.length; i++) {
            const mdastChild = mdastNode.children[i];
            const hierarchyChild = hierarchyNode.children[i];
            if (hierarchyChild) {
              const found = findHierarchyNode(mdastChild, hierarchyChild);
              if (found) return found;
            }
          }
        }
        return null;
      }
      hierarchyParent = findHierarchyNode(tree, hierarchyTree);
    }

    // 检查是否在 list-item 中（需要向上查找）
    let inListItem = false;
    let listItemParent: any = null;

    // 向上查找 list-item 父节点
    function findListItemParent(node: any, target: any, path: any[] = []): any {
      if (node === target) {
        // 在路径中查找 listItem
        for (let i = path.length - 1; i >= 0; i--) {
          if (path[i].type === "listItem") {
            return path[i];
          }
        }
        return null;
      }
      if (node.children) {
        for (const child of node.children) {
          const found = findListItemParent(child, target, [...path, node]);
          if (found) return found;
        }
      }
      return null;
    }

    listItemParent = findListItemParent(tree, embedNode);
    inListItem = listItemParent !== null;

    if (inListItem && listItemParent) {
      // 如果嵌入在 list-item 中，直接添加到 list-item.children（不调整标题）
      if (!listItemParent.children) {
        listItemParent.children = [];
      }

      // 找到包含 embedNode 的节点（可能是 paragraph 或其他）
      let nodeToReplace: any = null;
      let replaceIndex = -1;

      function findNodeToReplace(
        node: any,
        target: any
      ): { node: any; index: number } | null {
        if (node.children) {
          const index = node.children.indexOf(target);
          if (index !== -1) {
            return { node, index };
          }
          for (const child of node.children) {
            const found = findNodeToReplace(child, target);
            if (found) return found;
          }
        }
        return null;
      }

      const found = findNodeToReplace(listItemParent, embedNode);
      if (found) {
        nodeToReplace = found.node;
        replaceIndex = found.index;
      }

      if (nodeToReplace && replaceIndex !== -1) {
        // 如果找到的节点是 paragraph 且只包含 embedNode，替换整个 paragraph
        if (
          nodeToReplace.type === "paragraph" &&
          nodeToReplace.children.length === 1
        ) {
          const paragraphIndex = listItemParent.children.indexOf(nodeToReplace);
          if (paragraphIndex !== -1) {
            if (embeddedTree.children && embeddedTree.children.length > 0) {
              listItemParent.children.splice(
                paragraphIndex,
                1,
                ...embeddedTree.children
              );
            } else {
              listItemParent.children.splice(paragraphIndex, 1);
            }
          }
        } else {
          // 其他情况，直接替换 embedNode
          if (embeddedTree.children && embeddedTree.children.length > 0) {
            nodeToReplace.children.splice(
              replaceIndex,
              1,
              ...embeddedTree.children
            );
          } else {
            nodeToReplace.children.splice(replaceIndex, 1);
          }
        }
      }
    } else {
      // 不在 list-item 中，需要调整标题层级
      const parentHeading = hierarchyParent
        ? findParentHeadingFromParent(hierarchyParent, hierarchyTree)
        : null;
      const contextDepth = getContextHeadingDepth(parentHeading);

      // 转换为 hierarchy 结构以进行调整标题层级
      const embeddedHierarchy = toHierarchy(
        JSON.parse(JSON.stringify(embeddedTree))
      );

      // 调整标题深度
      adjustHeadingDepths(embeddedHierarchy, contextDepth);

      // 还原为 mdast 以获取所有节点（包括非标题节点）
      const adjustedTree = unHierarchy(embeddedHierarchy) as Root;

      // 使用调整后的树，如果为空则使用原始树
      // 注意：需要手动调整 embeddedTree 中的标题深度，因为 unHierarchy 可能丢失非标题节点
      let childrenToInsert =
        adjustedTree.children && adjustedTree.children.length > 0
          ? adjustedTree.children
          : [];

      // 检查 adjustedTree 是否包含所有节点（包括非标题节点）
      // 如果 adjustedTree.children 为空或只包含标题节点，使用原始树并手动调整标题
      const hasNonHeadingNodes = childrenToInsert.some(
        (node: any) => node.type !== "heading"
      );
      const originalHasNonHeadingNodes = embeddedTree.children?.some(
        (node: any) => node.type !== "heading"
      );

      // 如果原始树有非标题节点，但 adjustedTree 没有，使用原始树
      if (
        originalHasNonHeadingNodes &&
        !hasNonHeadingNodes &&
        embeddedTree.children
      ) {
        // 直接调整 embeddedTree 中的标题深度
        function adjustHeadingInMdast(nodes: any[]): void {
          for (const node of nodes) {
            if (node.type === "heading") {
              const currentDepth = node.depth || 1;
              const newDepth = currentDepth + contextDepth + 1;
              if (newDepth > 6) {
                // 转换为列表（简化处理，这里先跳过）
                node.depth = 6;
              } else {
                node.depth = newDepth;
              }
            }
            if (node.children) {
              adjustHeadingInMdast(node.children);
            }
          }
        }
        adjustHeadingInMdast(embeddedTree.children);
        childrenToInsert = embeddedTree.children;
      } else if (childrenToInsert.length === 0 && embeddedTree.children) {
        // 直接调整 embeddedTree 中的标题深度
        function adjustHeadingInMdast(nodes: any[]): void {
          for (const node of nodes) {
            if (node.type === "heading") {
              const currentDepth = node.depth || 1;
              const newDepth = currentDepth + contextDepth + 1;
              if (newDepth > 6) {
                // 转换为列表（简化处理，这里先跳过）
                node.depth = 6;
              } else {
                node.depth = newDepth;
              }
            }
            if (node.children) {
              adjustHeadingInMdast(node.children);
            }
          }
        }
        adjustHeadingInMdast(embeddedTree.children);
        childrenToInsert = embeddedTree.children;
      }

      // 替换嵌入节点（直接在 mdast 上操作）
      if (parent) {
        const embedIndex = parent.children?.indexOf(embedNode);
        if (embedIndex !== undefined && embedIndex !== -1 && parent.children) {
          // 如果 parent 是 paragraph，需要替换整个 paragraph，而不是只替换 embedNode
          if (parent.type === "paragraph") {
            // paragraph 包含 embedNode，替换整个 paragraph
            const parentIndex = tree.children?.indexOf(parent);
            if (
              parentIndex !== undefined &&
              parentIndex !== -1 &&
              tree.children &&
              childrenToInsert.length > 0
            ) {
              tree.children.splice(parentIndex, 1, ...childrenToInsert);
            }
          } else {
            // 其他情况，直接替换 embedNode
            if (childrenToInsert.length > 0) {
              parent.children.splice(embedIndex, 1, ...childrenToInsert);
            } else {
              parent.children.splice(embedIndex, 1);
            }
          }
        }
      } else {
        // 如果没有 parent，说明节点在根节点下
        const embedIndex = tree.children?.indexOf(embedNode);
        if (embedIndex !== undefined && embedIndex !== -1 && tree.children) {
          if (childrenToInsert.length > 0) {
            tree.children.splice(embedIndex, 1, ...childrenToInsert);
          } else {
            tree.children.splice(embedIndex, 1);
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`处理嵌入文件失败: ${filePath}`, error);
    return false;
  } finally {
    // 弹出路径栈（虽然这里 newPathStack 是新数组，但为了完整性还是处理）
    // 实际上由于我们使用的是新数组，这里不需要手动弹出
  }
}

export default remarkFreeze;
