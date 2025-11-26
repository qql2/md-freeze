import { remark } from "remark";
import { remarkObsidian } from "@qql2/remark-obsidian";
import { toHierarchy } from "hierarchy-mdast";

/**
 * 测试 hierarchy-mdast 是否支持 obsidianEmbed 节点
 */

// 真正的 markdown 文本，包含嵌入语法
const testMarkdown = `# Main Title

Some text with an ![[embedded-file.md]] embedded file.

## Subsection

More content here.`;

// 使用 remark 和 remarkObsidian 解析 markdown
async function parseMarkdown() {
  const processor = remark().use(remarkObsidian);
  const parsedTree = processor.parse(testMarkdown);
  await processor.run(parsedTree);

  console.log("原始 Markdown 文本:");
  console.log(testMarkdown);
  console.log("\n解析后的 mdast 树:");
  console.log(JSON.stringify(parsedTree, null, 2));

  try {
    console.log("\n尝试转换为 hierarchy 结构...");
    const hierarchyResult = toHierarchy(parsedTree);
    console.log("转换成功!");
    console.log("Hierarchy 结果:");
    console.log(JSON.stringify(hierarchyResult, null, 2));
  } catch (error) {
    console.log("转换失败:");
    console.log(error);
  }
}

parseMarkdown();
