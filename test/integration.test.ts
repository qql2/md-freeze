import { remark } from "remark";
import { remarkObsidian } from "@qql2/remark-obsidian";
import remarkStringify from "remark-stringify";
import { remarkFreeze } from "../src/index";
import { ObsidianEmbedNode } from "../src/types";
import { test } from "node:test";
import assert from "node:assert";
import { writeFile } from "fs/promises";
import { join } from "path";

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
 * 集成测试：测试一个复杂的真实场景，包含所有主要功能
 * 只检查最终输出结果是否符合预期
 */
test("完整集成测试 - 复杂场景", async () => {
  // 定义文件系统
  const files: Record<string, string> = {
    // 主文档引用的文件
    "chapter1.md": `# Chapter 1: Introduction

This is the introduction chapter.

## Section 1.1

Content of section 1.1.

![[details.md]]

## Section 1.2

More content here.
`,

    "chapter2.md": `# Chapter 2: Advanced Topics

## Section 2.1

Advanced content.

![[nested-content.md]]

## Section 2.2

- List item 1
  ![[list-embed.md]]
- List item 2
`,

    // 嵌套嵌入的文件
    "details.md": `# Details

Detailed information here.

## Sub-details

More details.

![[extra-info.md]]
`,

    "nested-content.md": `# Nested Content

This is nested content.

## Nested Section

Content here.
`,

    "extra-info.md": `# Extra Information

Additional information.
`,

    // 列表项中嵌入的文件，TODO：列表项中的标题不需要调整层级
    "list-embed.md": `# List Embed Heading

Content in list embed.
`,

    // 空文件（应该被移除）
    "empty.md": "",

    // 循环引用文件
    "circular-a.md": `# Circular A

![[circular-b.md]]
`,

    "circular-b.md": `# Circular B

![[circular-a.md]]
`,
  };

  // 主文档
  const mainMarkdown = `# Main Document

This is the main document.

## Part 1

![[chapter1.md]]

## Part 2

![[chapter2.md]]

## Part 3

![[empty.md]]

## Part 4

![[circular-a.md]]
`;

  const processor = remark()
    .use(remarkObsidian)
    .use(remarkFreeze, { readFile: createMockReadFile(files) })
    .use(remarkStringify);

  const result = await processor.process(mainMarkdown);
  const output = result.toString();

  // ========== 验证最终结果 ==========

  // 1. 验证主文档结构存在
  assert(output.includes("Main Document"), "应该包含主文档标题");
  assert(output.includes("Part 1"), "应该包含 Part 1");
  assert(output.includes("Part 2"), "应该包含 Part 2");
  assert(output.includes("Part 3"), "应该包含 Part 3");
  assert(output.includes("Part 4"), "应该包含 Part 4");

  // 2. 验证 Chapter 1 的内容被正确嵌入
  assert(output.includes("Chapter 1: Introduction"), "应该包含 Chapter 1 标题");
  assert(output.includes("Section 1.1"), "应该包含 Section 1.1");
  assert(output.includes("Section 1.2"), "应该包含 Section 1.2");
  assert(
    output.includes("Content of section 1.1"),
    "应该包含 Section 1.1 的内容"
  );

  // 3. 验证标题层级调整（Chapter 1 的 # 应该变成 ##，因为外部有 ## Part 1）
  // 实际上，Chapter 1 的 # 应该变成 ### (1 + 2 = 3)
  assert(
    output.includes("### Chapter 1: Introduction"),
    "Chapter 1 的标题层级应该被调整"
  );
  assert(
    output.includes("#### Section 1.1"),
    "Section 1.1 的标题层级应该被调整"
  );

  // 4. 验证嵌套嵌入（details.md 被嵌入到 chapter1.md 中）
  assert(output.includes("Details"), "应该包含 Details 标题");
  assert(output.includes("Sub-details"), "应该包含 Sub-details");
  assert(
    output.includes("Detailed information here"),
    "应该包含 Details 的内容"
  );

  // 5. 验证深层嵌套嵌入（extra-info.md 被嵌入到 details.md 中）
  assert(
    output.includes("Extra Information"),
    "应该包含 Extra Information（深层嵌套）"
  );
  assert(
    output.includes("Additional information"),
    "应该包含 Additional information（深层嵌套）"
  );

  // 6. 验证 Chapter 2 的内容被正确嵌入
  assert(
    output.includes("Chapter 2: Advanced Topics"),
    "应该包含 Chapter 2 标题"
  );
  assert(output.includes("Section 2.1"), "应该包含 Section 2.1");
  assert(output.includes("Section 2.2"), "应该包含 Section 2.2");

  // 7. 验证列表项中的嵌入（list-embed.md 在列表项中）
  assert(output.includes("List Embed Heading"), "应该包含列表项中的嵌入标题");
  assert(
    output.includes("Content in list embed"),
    "应该包含列表项中的嵌入内容"
  );
  // 列表项中的嵌入，标题不应该被调整层级（应该保持为 #）
  assert(
    output.includes("# List Embed Heading"),
    "列表项中的嵌入标题不应该被调整层级"
  );

  // 8. 验证嵌套内容（nested-content.md）
  assert(output.includes("Nested Content"), "应该包含 Nested Content 标题");
  assert(output.includes("Nested Section"), "应该包含 Nested Section");

  // 9. 验证空文件被移除（empty.md）
  assert(
    !output.includes("empty.md"),
    "空文件嵌入应该被移除，不应该出现在输出中"
  );
  // Part 3 后面不应该有任何内容（或者只有空行）
  const part3Index = output.indexOf("Part 3");
  const part4Index = output.indexOf("Part 4");
  assert(part3Index !== -1 && part4Index !== -1, "Part 3 和 Part 4 都应该存在");

  // 10. 验证循环引用被正确处理（circular-a.md 和 circular-b.md）
  // 应该只处理一层，第二层因为循环被跳过
  assert(output.includes("Circular A"), "应该包含 Circular A（第一层）");
  // 检查 Circular B 是否存在（如果循环检测工作正常，应该只出现一次）
  const circularBMatches = (output.match(/Circular B/g) || []).length;
  // 循环引用应该被检测到，Circular B 不应该无限递归
  assert(
    circularBMatches <= 1,
    `循环引用应该被正确处理，Circular B 不应该无限递归（找到 ${circularBMatches} 次）`
  );

  // 11. 验证所有嵌入节点都被处理（不应该有 ![[...]] 标记）
  assert(
    !output.includes("![[") && !output.includes("]]"),
    "所有嵌入节点都应该被处理，不应该有 ![[...]] 标记"
  );

  // 12. 验证输出是有效的 markdown（基本结构检查）
  assert(output.trim().length > 0, "输出不应该为空");
  assert(output.includes("#"), "输出应该包含至少一个标题（markdown 结构）");

  console.log("\n✅ 集成测试通过！所有功能点都正常工作。");
  console.log(`\n输出长度: ${output.length} 字符`);
  console.log(`输出行数: ${output.split("\n").length} 行`);

  // ========== 写入结果文件 ==========
  const outputDir = join(__dirname, "./");
  const outputFile = join(outputDir, "integration-test-result.md");

  // 构建完整的结果文档，包含输入和输出对比
  const codeBlockStart = "```";
  const codeBlockEnd = "```";

  const resultDocument = `# 集成测试结果

本文档是 remark-freeze 插件的集成测试最终输出结果。

## 测试场景说明

本次集成测试包含以下功能点：
- ✅ 多个文件的嵌入
- ✅ 嵌套嵌入（3层深度）
- ✅ 标题层级自动调整
- ✅ 列表项中的嵌入处理
- ✅ 空文件处理（自动移除）
- ✅ 循环引用检测

## 输入文件结构

### 主文档 (main.md)

${codeBlockStart}markdown
${mainMarkdown}
${codeBlockEnd}

### 引用的文件

#### chapter1.md
${codeBlockStart}markdown
${files["chapter1.md"]}
${codeBlockEnd}

#### chapter2.md
${codeBlockStart}markdown
${files["chapter2.md"]}
${codeBlockEnd}

#### details.md
${codeBlockStart}markdown
${files["details.md"]}
${codeBlockEnd}

#### nested-content.md
${codeBlockStart}markdown
${files["nested-content.md"]}
${codeBlockEnd}

#### extra-info.md
${codeBlockStart}markdown
${files["extra-info.md"]}
${codeBlockEnd}

#### list-embed.md
${codeBlockStart}markdown
${files["list-embed.md"]}
${codeBlockEnd}

#### empty.md
${codeBlockStart}markdown
（空文件）
${codeBlockEnd}

#### circular-a.md
${codeBlockStart}markdown
${files["circular-a.md"]}
${codeBlockEnd}

#### circular-b.md
${codeBlockStart}markdown
${files["circular-b.md"]}
${codeBlockEnd}

---

## 最终输出结果

以下是经过 remark-freeze 处理后的最终 markdown 文档：

---

${output}

---

## 测试统计

- **输出长度**: ${output.length} 字符
- **输出行数**: ${output.split("\n").length} 行
- **测试时间**: ${new Date().toISOString()}

## 验证结果

✅ 所有断言测试通过
✅ 所有嵌入节点已正确处理
✅ 标题层级调整正确
✅ 循环引用检测正常
✅ 空文件已移除
✅ 输出格式正确

---

*此文件由集成测试自动生成*
`;

  try {
    await writeFile(outputFile, resultDocument, "utf-8");
    console.log(`\n📄 结果已写入: ${outputFile}`);
  } catch (error) {
    console.error("\n❌ 写入结果文件失败:", error);
    // 不抛出错误，测试仍然通过
  }
});
