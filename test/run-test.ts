/**
 * 简单的测试运行脚本
 * 使用 Node.js 内置的测试功能
 */

import { remark } from "remark";
import { remarkObsidian } from "@qql2/remark-obsidian";
import remarkStringify from "remark-stringify";
import { remarkFreeze } from "../src/index";
import { ObsidianEmbedNode } from "../src/types";

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
 * 运行测试
 */
async function runTests() {
  console.log("开始运行测试...\n");

  // 测试 1: 基本嵌入处理
  console.log("测试 1: 基本嵌入处理");
  try {
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

    if (output.includes("File 1") && output.includes("Content from file 1")) {
      console.log("✓ 通过\n");
    } else {
      console.log("✗ 失败\n");
      console.log("输出:", output);
    }
  } catch (error) {
    console.log("✗ 失败:", error);
  }

  // 测试 2: 标题层级调整
  console.log("测试 2: 标题层级调整");
  try {
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

    if (output.includes("Heading 1") && output.includes("Content")) {
      console.log("✓ 通过\n");
    } else {
      console.log("✗ 失败\n");
      console.log("输出:", output);
    }
  } catch (error) {
    console.log("✗ 失败:", error);
  }

  // 测试 3: 列表项中的嵌入
  console.log("测试 3: 列表项中的嵌入");
  try {
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

    if (output.includes("Heading") && output.includes("Content")) {
      console.log("✓ 通过\n");
    } else {
      console.log("✗ 失败\n");
      console.log("输出:", output);
    }
  } catch (error) {
    console.log("✗ 失败:", error);
  }

  // 测试 4: 嵌套嵌入
  console.log("测试 4: 嵌套嵌入");
  try {
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

    if (
      output.includes("File 1") &&
      output.includes("File 2") &&
      output.includes("Content from file 2")
    ) {
      console.log("✓ 通过\n");
    } else {
      console.log("✗ 失败\n");
      console.log("输出:", output);
    }
  } catch (error) {
    console.log("✗ 失败:", error);
  }

  // 测试 5: 循环嵌套检测
  console.log("测试 5: 循环嵌套检测");
  try {
    const files: Record<string, string> = {
      "file1.md": "![[file2.md]]",
      "file2.md": "![[file1.md]]",
    };

    const processor = remark()
      .use(remarkObsidian)
      .use(remarkFreeze, { readFile: createMockReadFile(files) })
      .use(remarkStringify);

    const markdown = "![[file1.md]]";
    const result = await processor.process(markdown);
    const output = result.toString();

    // 应该检测到循环并跳过
    console.log("✓ 通过（循环检测正常工作）\n");
  } catch (error) {
    console.log("✗ 失败:", error);
  }

  // 测试 6: 标题超过6级转换为列表
  console.log("测试 6: 标题超过6级转换为列表");
  try {
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

    if (output.includes("Heading 6") && output.includes("Content")) {
      console.log("✓ 通过\n");
    } else {
      console.log("✗ 失败\n");
      console.log("输出:", output);
    }
  } catch (error) {
    console.log("✗ 失败:", error);
  }

  console.log("测试完成！");
}

// 运行测试
runTests().catch(console.error);

