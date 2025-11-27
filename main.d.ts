import { Plugin } from 'unified';
import { Root } from 'mdast';

/**
 * Obsidian 嵌入节点类型
 * 由 @qql2/remark-obsidian 解析生成
 */
interface ObsidianEmbedNode {
    type: "obsidianEmbed";
    value: string;
    data: {
        embedType: "wikilink" | "image";
        target: string;
        alt?: string;
    };
    position?: {
        start: {
            line: number;
            column: number;
            offset: number;
        };
        end: {
            line: number;
            column: number;
            offset: number;
        };
    };
}
/**
 * 文件读取函数类型
 * 接收嵌入节点，返回 markdown 文本内容
 */
type ReadFileFunction = (embedNode: ObsidianEmbedNode) => Promise<string> | string;
/**
 * 插件选项
 */
interface FreezeOptions {
    readFile: ReadFileFunction;
}

/**
 * Remark freeze 插件
 * 将 Obsidian 嵌入的文件内容"冻结"到当前文档中，并自动调整标题层级
 */
declare const remarkFreeze: Plugin<[FreezeOptions], Root, Root>;

export { remarkFreeze };
