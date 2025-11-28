import { remark } from "remark";
import { remarkObsidian } from "@qql2/remark-obsidian";
import remarkStringify from "remark-stringify";
import { remarkFreeze } from "../main.js";
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

/**
 * 带输出信息的断言辅助函数
 * 当断言失败时，会输出实际的输出内容到控制台
 */
function assertWithOutput(
  condition: boolean,
  message: string,
  output?: string
): void {
  if (!condition) {
    console.error(`\n❌ 断言失败: ${message}`);
    if (output !== undefined) {
      console.error("\n📄 实际输出内容:");
      console.error("─".repeat(50));
      console.error(output);
      console.error("─".repeat(50));
      console.error("\n📋 输出内容（格式化JSON）:");
      console.error(JSON.stringify(output, null, 2));
    }
    assert(condition, message);
  }
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

  assertWithOutput(output.includes("File 1"), "应该包含 File 1", output);
  assertWithOutput(
    output.includes("Content from file 1"),
    "应该包含 Content from file 1",
    output
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
  assertWithOutput(output.includes("Heading 1"), "应该包含 Heading 1", output);
  assertWithOutput(output.includes("Content"), "应该包含 Content", output);
  // 检查标题层级是否被调整了
  // "file1.md" 的 Heading 1 应该变成 Heading 2（因为外部有一个 # Main Heading）
  assertWithOutput(
    output.includes("## Heading 1"),
    "嵌入的一级标题应该变成二级标题",
    output
  );
  assertWithOutput(
    output.includes("### Heading 2"),
    "嵌入的二级标题应该变成三级标题",
    output
  );
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
  assertWithOutput(output.includes("Heading"), "应该包含 Heading", output);
  assertWithOutput(output.includes("Content"), "应该包含 Content", output);
  // 检查标题没有升级，heading 没有变成 ##/###
  assertWithOutput(
    !output.includes("## Heading"),
    "列表项嵌入时标题深度不应被修改",
    output
  );
  // 检查嵌入内容依然在列表项中
  // 有两种可能输出格式，根据 remark-stringify:
  // - "- List item\n  # Heading\n\n  Content\n"
  // - "- List item\n\n  # Heading\n\n  Content\n"
  // 检查缩进的 Content 存在
  assertWithOutput(
    /^[ ]{2}Content/m.test(output),
    "嵌入内容应在列表项缩进下",
    output
  );
});

test("列表项中的标题不调整层级 - 有上下文标题", async () => {
  const files: Record<string, string> = {
    "file1.md": "# Heading\n\n## Sub Heading\n\nContent",
  };

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);

  // 外部有一个二级标题作为上下文
  const markdown = "## Context Heading\n\n- List item\n  ![[file1.md]]";
  const result = await processor.process(markdown);

  const output = result.toString();

  // 验证标题没有被调整：
  // - 如果调整了，Heading 应该变成 ### Heading (1 + 2 = 3)
  // - 如果没调整，Heading 应该保持 # Heading
  assertWithOutput(
    output.includes("# Heading"),
    "列表项中的一级标题应该保持为一级标题",
    output
  );
  assertWithOutput(
    !output.includes("### Heading"),
    "列表项中的一级标题不应该被调整为三级标题",
    output
  );

  // 验证二级标题也没有被调整
  assertWithOutput(
    output.includes("## Sub Heading"),
    "列表项中的二级标题应该保持为二级标题",
    output
  );
  assertWithOutput(
    !output.includes("#### Sub Heading"),
    "列表项中的二级标题不应该被调整为四级标题",
    output
  );

  assertWithOutput(output.includes("Content"), "应该包含 Content", output);
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
  assertWithOutput(output.includes("File 1"), "应该包含 File 1", output);
  assertWithOutput(output.includes("File 2"), "应该包含 File 2", output);
  assertWithOutput(
    output.includes("Content from file 2"),
    "应该包含 Content from file 2",
    output
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
  assertWithOutput(output !== undefined, "应该有输出", output);
  // 检查输出中不应该有两个 "file1"
  const file1Matches = output.match(/file1\.md/g) || [];
  assertWithOutput(
    file1Matches.length <= 1,
    `循环嵌套时不应该有两个 File 1，实际找到 ${file1Matches.length} 个`,
    output
  );
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
  assertWithOutput(output.includes("Heading 6"), "应该包含 Heading 6", output);
  assertWithOutput(output.includes("Content"), "应该包含 Content", output);
  assertWithOutput(
    !output.includes("###### Heading 6"),
    "标题不应该超过6级",
    output
  );
});

test("空文件处理", async () => {
  const files: Record<string, string> = {
    "file1.md": "",
  };

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);

  const markdown = "![[file1.md]]";
  const result = await processor.process(markdown);
  const output = result.toString();

  // 空文件应该被移除，不留下任何内容
  assertWithOutput(
    !output.includes("file1.md"),
    "空文件嵌入应该被移除",
    output
  );
});

test("多个嵌入节点", async () => {
  const files: Record<string, string> = {
    "file1.md": "# File 1\n\nContent 1",
    "file2.md": "# File 2\n\nContent 2",
    "file3.md": "# File 3\n\nContent 3",
  };

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);

  const markdown = "![[file1.md]]\n\n![[file2.md]]\n\n![[file3.md]]";
  const result = await processor.process(markdown);
  const output = result.toString();

  assertWithOutput(output.includes("File 1"), "应该包含 File 1", output);
  assertWithOutput(output.includes("File 2"), "应该包含 File 2", output);
  assertWithOutput(output.includes("File 3"), "应该包含 File 3", output);
  assertWithOutput(output.includes("Content 1"), "应该包含 Content 1", output);
  assertWithOutput(output.includes("Content 2"), "应该包含 Content 2", output);
  assertWithOutput(output.includes("Content 3"), "应该包含 Content 3", output);
});

test("嵌入节点在段落中", async () => {
  const files: Record<string, string> = {
    "file1.md": "# Heading\n\nContent",
  };

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);

  const markdown = "Some text ![[file1.md]] more text";
  const result = await processor.process(markdown);
  const output = result.toString();

  // 段落中的嵌入应该替换整个段落
  assertWithOutput(output.includes("Heading"), "应该包含 Heading", output);
  assertWithOutput(output.includes("Content"), "应该包含 Content", output);
});

test("嵌入节点在根节点下", async () => {
  const files: Record<string, string> = {
    "file1.md": "# Heading\n\nContent",
  };

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);

  const markdown = "![[file1.md]]";
  const result = await processor.process(markdown);
  const output = result.toString();

  assertWithOutput(output.includes("Heading"), "应该包含 Heading", output);
  assertWithOutput(output.includes("Content"), "应该包含 Content", output);
});

test("文件读取失败处理", async () => {
  const files: Record<string, string> = {
    // file1.md 不存在
  };

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);

  const markdown = "![[file1.md]]";

  // 应该抛出错误或跳过
  try {
    const result = await processor.process(markdown);
    const output = result.toString();
    // 如果处理成功，嵌入节点应该被移除
    assertWithOutput(
      !output.includes("file1.md") || output.trim() === "",
      "文件读取失败时嵌入节点应该被移除",
      output
    );
  } catch (error) {
    // 如果抛出错误也是可以接受的
    assert(error instanceof Error, "应该抛出错误");
  }
});

test("深层嵌套嵌入", async () => {
  const files: Record<string, string> = {
    "file1.md": "# File 1\n\n![[file2.md]]",
    "file2.md": "# File 2\n\n![[file3.md]]",
    "file3.md": "# File 3\n\nContent",
  };

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);

  const markdown = "![[file1.md]]";
  const result = await processor.process(markdown);
  const output = result.toString();

  assertWithOutput(output.includes("File 1"), "应该包含 File 1", output);
  assertWithOutput(output.includes("File 2"), "应该包含 File 2", output);
  assertWithOutput(output.includes("File 3"), "应该包含 File 3", output);
  assertWithOutput(output.includes("Content"), "应该包含 Content", output);
});

test("列表项中多个嵌入", async () => {
  const files: Record<string, string> = {
    "file1.md": "# Heading 1\n\nContent 1",
    "file2.md": "# Heading 2\n\nContent 2",
  };

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);

  const markdown = "- List item\n  ![[file1.md]]\n  ![[file2.md]]";
  const result = await processor.process(markdown);
  const output = result.toString();

  assertWithOutput(output.includes("Heading 1"), "应该包含 Heading 1", output);
  assertWithOutput(output.includes("Heading 2"), "应该包含 Heading 2", output);
  assertWithOutput(output.includes("Content 1"), "应该包含 Content 1", output);
  assertWithOutput(output.includes("Content 2"), "应该包含 Content 2", output);
});

test("异步文件读取", async () => {
  const files: Record<string, string> = {
    "file1.md": "# File 1\n\nContent",
  };

  // 创建异步读取函数
  const asyncReadFile = async (
    embedNode: ObsidianEmbedNode
  ): Promise<string> => {
    const filePath = embedNode.data.target;
    await new Promise((resolve) => setTimeout(resolve, 10)); // 模拟异步延迟
    if (files[filePath]) {
      return files[filePath];
    }
    throw new Error(`File not found: ${filePath}`);
  };

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: asyncReadFile })
    .use(remarkStringify);

  const markdown = "![[file1.md]]";
  const result = await processor.process(markdown);
  const output = result.toString();

  assertWithOutput(output.includes("File 1"), "应该包含 File 1", output);
  assertWithOutput(output.includes("Content"), "应该包含 Content", output);
});

test("复杂标题层级调整", async () => {
  const files: Record<string, string> = {
    "file1.md": "# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6",
  };

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);

  const markdown = "## Context H2\n\n![[file1.md]]";
  const result = await processor.process(markdown);
  const output = result.toString();

  // H1 应该变成 H3 (1 + 2 = 3)
  assertWithOutput(output.includes("### H1"), "H1 应该变成 H3", output);
  // H2 应该变成 H4 (2 + 2 = 4)
  assertWithOutput(output.includes("#### H2"), "H2 应该变成 H4", output);
  // H3 应该变成 H5 (3 + 2 = 5)
  assertWithOutput(output.includes("##### H3"), "H3 应该变成 H5", output);
});

test("嵌入标题层级高于上下文时不调整", async () => {
  const files: Record<string, string> = {
    "file1.md":
      "#### Heading 4\n\n##### Heading 5\n\n###### Heading 6\n\nContent",
  };

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);

  // 上下文是三级标题（深度3）
  const markdown = "### Context H3\n\n![[file1.md]]";
  const result = await processor.process(markdown);
  const output = result.toString();

  // 嵌入文件的标题层级（4, 5, 6）都大于上下文层级（3），所以不应该调整
  assertWithOutput(
    output.includes("#### Heading 4"),
    "四级标题应该保持为四级标题（4 > 3，不调整）",
    output
  );
  assertWithOutput(
    output.includes("##### Heading 5"),
    "五级标题应该保持为五级标题（5 > 3，不调整）",
    output
  );
  assertWithOutput(
    output.includes("###### Heading 6"),
    "六级标题应该保持为六级标题（6 > 3，不调整）",
    output
  );
  // 验证没有被调整成更高的层级
  assertWithOutput(
    !output.includes("####### Heading 4"),
    "不应该出现七级标题",
    output
  );
  assertWithOutput(output.includes("Content"), "应该包含 Content", output);
});
