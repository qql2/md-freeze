import { remark } from "remark";
import { remarkObsidian } from "@qql2/remark-obsidian";
import remarkStringify from "remark-stringify";
import { remarkFreeze } from "../src/index";
import { ObsidianEmbedNode } from "../src/types";

async function test() {
  // 测试空文件
  console.log("=== 测试空文件 ===");
  const files: Record<string, string> = {
    "file1.md": "",
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

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);

  const markdown = "![[file1.md]]";

  try {
    const result = await processor.process(markdown);
    const output = result.toString();
    console.log("输出:", JSON.stringify(output));
    console.log("是否包含 file1.md:", output.includes("file1.md"));
    console.log("输出长度:", output.length);
  } catch (error) {
    console.error("错误:", error);
  }

  // 测试文件不存在
  console.log("\n=== 测试文件不存在 ===");
  const files2: Record<string, string> = {};

  const processor2 = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files2) })
    .use(remarkStringify);

  const markdown2 = "![[file1.md]]";

  try {
    const result2 = await processor2.process(markdown2);
    const output2 = result2.toString();
    console.log("输出:", JSON.stringify(output2));
    console.log("是否包含 file1.md:", output2.includes("file1.md"));
    console.log("输出长度:", output2.length);
  } catch (error) {
    console.error("错误:", error);
  }
}

test().catch(console.error);
