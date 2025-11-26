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
  // 检查标题层级是否被调整了
  // "file1.md" 的 Heading 1 应该变成 Heading 2（因为外部有一个 # Main Heading）
  assert(output.includes("## Heading 1"), "嵌入的一级标题应该变成二级标题");
  assert(output.includes("### Heading 2"), "嵌入的二级标题应该变成三级标题");
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
  // 检查标题没有升级，heading 没有变成 ##/###
  assert(!output.includes("## Heading"), "列表项嵌入时标题深度不应被修改");
  // 检查嵌入内容依然在列表项中
  // 有两种可能输出格式，根据 remark-stringify:
  // - "- List item\n  # Heading\n\n  Content\n"
  // - "- List item\n\n  # Heading\n\n  Content\n"
  // 检查缩进的 # Heading 存在
  assert(
    /-\s+List item[\s\S]*^[ ]{2}# Heading/m.test(output) ||
      /-\s+List item\n\n[ ]{2}# Heading/m.test(output),
    "嵌入的内容应该处于 list-item 缩进之下"
  );
  // 检查缩进的 Content 存在
  assert(/^[ ]{2}Content/m.test(output), "嵌入内容应在列表项缩进下");
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
  // 检查输出中不应该有两个 "file1"
  const file1Matches = output.match(/file1\.md/g) || [];
  assert(file1Matches.length <= 1, "循环嵌套时不应该有两个 File 1");
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
  console.log(JSON.stringify(output, null, 2));
  // h6 + contextDepth(6) + 1 = 13 > 6，应该转换为列表
  assert(output.includes("Heading 6"), "应该包含 Heading 6");
  assert(output.includes("Content"), "应该包含 Content");
  assert(!output.includes("###### Heading 6"), "标题不应该超过6级");
});
