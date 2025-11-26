import { remark } from "remark";
import { remarkObsidian } from "@qql2/remark-obsidian";
import { remarkFreeze } from "../src/index";
import { ObsidianEmbedNode } from "../src/types";
import { visit } from "unist-util-visit";

const files: Record<string, string> = {
  "file1.md": "# Heading 1\n\n## Heading 2\n\nContent",
};

function createMockReadFile(files: Record<string, string>) {
  return (embedNode: ObsidianEmbedNode): string => {
    const filePath = embedNode.data.target;
    if (files[filePath]) {
      return files[filePath];
    }
    throw new Error(`File not found: ${filePath}`);
  };
}

async function test() {
  const processor = remark().use(remarkObsidian);
  const markdown = "# Main Heading\n\n![[file1.md]]";
  const ast = processor.parse(markdown);
  await processor.runSync(ast);
  
  console.log("处理前 AST:");
  console.log(JSON.stringify(ast, null, 2));
  
  // 检查是否有 obsidianEmbed 节点
  let embedCount = 0;
  visit(ast, 'obsidianEmbed', () => {
    embedCount++;
  });
  console.log(`处理前 obsidianEmbed 节点数量: ${embedCount}`);
  
  // 应用 freeze 插件
  const freezeProcessor = remark().use(remarkFreeze, { readFile: createMockReadFile(files) });
  await freezeProcessor.run(ast);
  
  console.log("\n处理后 AST:");
  console.log(JSON.stringify(ast, null, 2));
  
  // 检查是否还有 obsidianEmbed 节点
  embedCount = 0;
  visit(ast, 'obsidianEmbed', () => {
    embedCount++;
  });
  console.log(`处理后 obsidianEmbed 节点数量: ${embedCount}`);
}

test().catch(console.error);

