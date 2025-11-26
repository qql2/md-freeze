import { Plugin } from "unified";
import { Root } from "mdast";

/**
 * Obsidian 嵌入节点类型
 * 由 @qql2/remark-obsidian 解析生成
 */
export interface ObsidianEmbedNode {
  type: "obsidianEmbed";
  value: string;
  data: {
    embedType: "wikilink" | "image";
    target: string;
    alt?: string;
  };
  position?: {
    start: { line: number; column: number; offset: number };
    end: { line: number; column: number; offset: number };
  };
}

/**
 * 文件读取函数类型
 * 接收嵌入节点，返回 markdown 文本内容
 */
export type ReadFileFunction = (
  embedNode: ObsidianEmbedNode
) => Promise<string> | string;

/**
 * 插件选项
 */
export interface FreezeOptions {
  readFile: ReadFileFunction;
}

/**
 * Hierarchy 节点类型（由 hierarchy-mdast 生成）
 */
export interface HierarchyNode {
  type: string;
  children?: HierarchyNode[];
  [key: string]: any;
}

/**
 * 路径栈，用于循环检测
 */
export type PathStack = string[];

