import { remark } from "remark";
import { remarkObsidian } from "@qql2/remark-obsidian";
import remarkStringify from "remark-stringify";
import { remarkFreeze } from "../src/index";
import { ObsidianEmbedNode } from "../src/types";
import { toHierarchy } from "hierarchy-mdast";

const files: Record<string, string> = {
  "file1.md": "# File 1\n\nContent from file 1",
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

async function debug() {
  const markdown = "![[file1.md]]";
  
  // 测试 remarkObsidian 是否工作
  const processor1 = remark().use(remarkObsidian);
  const ast1 = processor1.parse(markdown);
  await processor1.runSync(ast1);
  console.log("经过 remarkObsidian 后的 AST:");
  console.log(JSON.stringify(ast1, null, 2));
  
  // 现在测试完整流程
  const processor2 = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);
  
  const result = await processor2.process(markdown);
  console.log("\n处理后的输出:");
  console.log(result.toString());
  
  // 检查处理后的 AST
  const ast2 = processor2.parse(markdown);
  await processor2.runSync(ast2);
  console.log("\n处理后的 AST:");
  console.log(JSON.stringify(ast2, null, 2));
}

debug().catch(console.error);

