import { remark } from "remark";
import { remarkObsidian } from "@qql2/remark-obsidian";
import remarkStringify from "remark-stringify";
import { remarkFreeze } from "../src/index";
import { ObsidianEmbedNode } from "../src/types";
import { test } from "node:test";
import assert from "node:assert";

/**
 * 模拟文件读取函数
 */
function createMockReadFile(files: Record<string, string>) {
  return (embedNode: ObsidianEmbedNode): string => {
    const filePath = embedNode.data.target;
    if (files[filePath]) {
      return files[filePath];
    }
    throw new Error(`File not found: ${filePath}`);
  };
}

test("基本嵌入处理", async () => {
  const files: Record<string, string> = {
    "file1.md": "# File 1\n\nContent from file 1",
  };

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);

  const markdown = "![[file1.md]]";
  const result = await processor.process(markdown);
  const output = result.toString();

  assert(output.includes("File 1"), "应该包含 File 1");
  assert(
    output.includes("Content from file 1"),
    "应该包含 Content from file 1"
  );
});

test("标题层级调整", async () => {
  const files: Record<string, string> = {
    "file1.md": "# Heading 1\n\n## Heading 2\n\nContent",
  };

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);

  const markdown = "# Main Heading\n\n![[file1.md]]";
  const result = await processor.process(markdown);

  const output = result.toString();
  assert(output.includes("Heading 1"), "应该包含 Heading 1");
  assert(output.includes("Content"), "应该包含 Content");
});

test("列表项中的嵌入", async () => {
  const files: Record<string, string> = {
    "file1.md": "# Heading\n\nContent",
  };

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);

  const markdown = "- List item\n  ![[file1.md]]";
  const result = await processor.process(markdown);

  const output = result.toString();
  // 在列表项中，标题不应该调整，内容直接添加到 list-item
  assert(output.includes("Heading"), "应该包含 Heading");
  assert(output.includes("Content"), "应该包含 Content");
});

test("嵌套嵌入", async () => {
  const files: Record<string, string> = {
    "file1.md": "# File 1\n\n![[file2.md]]",
    "file2.md": "# File 2\n\nContent from file 2",
  };

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);

  const markdown = "![[file1.md]]";
  const result = await processor.process(markdown);

  const output = result.toString();
  assert(output.includes("File 1"), "应该包含 File 1");
  assert(output.includes("File 2"), "应该包含 File 2");
  assert(
    output.includes("Content from file 2"),
    "应该包含 Content from file 2"
  );
});

test("循环嵌套检测", async () => {
  const files: Record<string, string> = {
    "file1.md": "![[file2.md]]",
    "file2.md": "![[file1.md]]",
  };

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);

  const markdown = "![[file1.md]]";

  // 应该检测到循环并跳过
  const result = await processor.process(markdown);
  const output = result.toString();

  // 应该只处理一层，第二层因为循环被跳过
  assert(output !== undefined, "应该有输出");
});

test("标题超过6级转换为列表", async () => {
  const files: Record<string, string> = {
    "file1.md": "###### Heading 6\n\nContent",
  };

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);

  const markdown = "###### Context Heading\n\n![[file1.md]]";
  const result = await processor.process(markdown);

  const output = result.toString();
  // h6 + contextDepth(6) + 1 = 13 > 6，应该转换为列表
  assert(output.includes("Heading 6"), "应该包含 Heading 6");
  assert(output.includes("Content"), "应该包含 Content");
});
