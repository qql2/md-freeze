import { test } from "node:test";
import assert from "node:assert";
import { adjustHeadingDepths } from "../src/adjust-headings";
import { HierarchyNode } from "../src/types";

// 辅助函数：创建简单的节点
function createHeadingNode(
  depth: number,
  text: string,
  children?: HierarchyNode[]
): HierarchyNode {
  return {
    type: "heading",
    depth,
    children: [
      {
        type: "text",
        value: text,
      },
      ...(children || []),
    ],
  };
}

function createParagraphNode(text: string): HierarchyNode {
  return {
    type: "paragraph",
    children: [
      {
        type: "text",
        value: text,
      },
    ],
  };
}

test("adjustHeadingDepths - 基本调整", () => {
  const heading = createHeadingNode(1, "Heading 1");
  const root: HierarchyNode = {
    type: "root",
    children: [heading],
  };

  adjustHeadingDepths(root, 0);

  assert.strictEqual(heading.depth, 2); // 1 + 0 + 1 = 2
});

test("adjustHeadingDepths - 带上下文深度", () => {
  const heading = createHeadingNode(1, "Heading 1");
  const root: HierarchyNode = {
    type: "root",
    children: [heading],
  };

  adjustHeadingDepths(root, 2);

  assert.strictEqual(heading.depth, 4); // 1 + 2 + 1 = 4
});

test("adjustHeadingDepths - 多层嵌套", () => {
  const heading2 = createHeadingNode(2, "Heading 2");
  const heading1 = createHeadingNode(1, "Heading 1", [heading2]);
  const root: HierarchyNode = {
    type: "root",
    children: [heading1],
  };

  adjustHeadingDepths(root, 1);

  assert.strictEqual(heading1.depth, 3); // 1 + 1 + 1 = 3
  assert.strictEqual(heading2.depth, 4); // 2 + 1 + 1 = 4
});

test("adjustHeadingDepths - 超过6级应该转换为列表", () => {
  const heading = createHeadingNode(6, "Heading 6");
  const root: HierarchyNode = {
    type: "root",
    children: [heading],
  };

  adjustHeadingDepths(root, 0);

  // 6 + 0 + 1 = 7 > 6，应该转换为列表
  assert.strictEqual(heading.type, "list");
  assert.notStrictEqual(heading.children, undefined);
  assert.strictEqual(heading.children?.length, 1);
  assert.strictEqual(heading.children?.[0].type, "listItem");
});

test("adjustHeadingDepths - 深度刚好6级不应该转换", () => {
  const heading = createHeadingNode(5, "Heading 5");
  const root: HierarchyNode = {
    type: "root",
    children: [heading],
  };

  adjustHeadingDepths(root, 0);

  // 5 + 0 + 1 = 6，不应该转换
  assert.strictEqual(heading.type, "heading");
  assert.strictEqual(heading.depth, 6);
});

test("adjustHeadingDepths - 转换后的列表应该包含原标题文本", () => {
  const heading = createHeadingNode(6, "Heading 6");
  const root: HierarchyNode = {
    type: "root",
    children: [heading],
  };

  adjustHeadingDepths(root, 0);

  assert.strictEqual(heading.type, "list");
  const listItem = heading.children?.[0];
  assert.notStrictEqual(listItem, undefined);
  assert.strictEqual(listItem?.type, "listItem");

  // 检查列表项的第一个子节点是段落，包含原标题文本
  const paragraph = listItem?.children?.[0];
  assert.strictEqual(paragraph?.type, "paragraph");
  const textNode = paragraph?.children?.[0];
  assert.strictEqual(textNode?.type, "text");
  assert.strictEqual(textNode?.value, "Heading 6");
});

test("adjustHeadingDepths - 转换后的列表应该保留原内容", () => {
  const content = createParagraphNode("Content");
  const heading = createHeadingNode(6, "Heading 6", [content]);
  const root: HierarchyNode = {
    type: "root",
    children: [heading],
  };

  adjustHeadingDepths(root, 0);

  assert.strictEqual(heading.type, "list");
  const listItem = heading.children?.[0];
  assert.notStrictEqual(listItem, undefined);

  // 应该包含：标题文本的段落、原标题的文本节点、原段落节点
  // 注意：convertHeadingToList 会保留所有 headingChildren，包括文本节点
  assert.strictEqual(listItem?.children?.length, 3);
  assert.strictEqual(listItem?.children?.[0].type, "paragraph");
  assert.strictEqual(listItem?.children?.[1].type, "text"); // 原标题的文本节点
  assert.strictEqual(listItem?.children?.[2].type, "paragraph"); // 原段落节点

  // 验证第一个段落包含标题文本
  const titleParagraph = listItem?.children?.[0];
  assert.strictEqual(titleParagraph?.children?.[0]?.type, "text");
  assert.strictEqual(titleParagraph?.children?.[0]?.value, "Heading 6");

  // 验证原段落内容被保留
  const contentParagraph = listItem?.children?.[2];
  assert.strictEqual(contentParagraph?.children?.[0]?.type, "text");
  assert.strictEqual(contentParagraph?.children?.[0]?.value, "Content");
});

test("adjustHeadingDepths - 非标题节点不应该被修改", () => {
  const paragraph = createParagraphNode("Content");
  const root: HierarchyNode = {
    type: "root",
    children: [paragraph],
  };

  const originalType = paragraph.type;
  adjustHeadingDepths(root, 2);

  assert.strictEqual(paragraph.type, originalType);
  assert.strictEqual(paragraph.type, "paragraph");
});

test("adjustHeadingDepths - 空节点应该正常处理", () => {
  const root: HierarchyNode = {
    type: "root",
    children: [],
  };

  // 不应该抛出错误
  adjustHeadingDepths(root, 0);
  assert.deepStrictEqual(root.children, []);
});
