import { test } from "node:test";
import assert from "node:assert";
import {
  findParentHeading,
  findParentHeadingFromParent,
  isInListItem,
  getContextHeadingDepth,
} from "../src/detect-context";
import { HierarchyNode } from "../src/types";

// 辅助函数：创建简单的 hierarchy 节点
function createHeadingNode(
  depth: number,
  children?: HierarchyNode[]
): HierarchyNode {
  return {
    type: "heading",
    depth,
    children: children || [],
  };
}

function createParagraphNode(children?: HierarchyNode[]): HierarchyNode {
  return {
    type: "paragraph",
    children: children || [],
  };
}

function createListItemNode(children?: HierarchyNode[]): HierarchyNode {
  return {
    type: "listItem",
    children: children || [],
  };
}

function createTextNode(value: string): HierarchyNode {
  return {
    type: "text",
    value,
  };
}

test("getContextHeadingDepth - null 应该返回 0", () => {
  const result = getContextHeadingDepth(null);
  assert.strictEqual(result, 0);
});

test("getContextHeadingDepth - 非 heading 节点应该返回 0", () => {
  const node = createParagraphNode();
  const result = getContextHeadingDepth(node);
  assert.strictEqual(result, 0);
});

test("getContextHeadingDepth - heading 节点应该返回深度", () => {
  const node = createHeadingNode(2);
  const result = getContextHeadingDepth(node);
  assert.strictEqual(result, 2);
});

test("getContextHeadingDepth - heading 节点没有 depth 应该返回 0", () => {
  const node: HierarchyNode = {
    type: "heading",
    children: [],
  };
  const result = getContextHeadingDepth(node);
  assert.strictEqual(result, 0);
});

test("isInListItem - null 应该返回 false", () => {
  const result = isInListItem(null);
  assert.strictEqual(result, false);
});

test("isInListItem - listItem 节点应该返回 true", () => {
  const node = createListItemNode();
  const result = isInListItem(node);
  assert.strictEqual(result, true);
});

test("isInListItem - 非 listItem 节点应该返回 false", () => {
  const node = createParagraphNode();
  const result = isInListItem(node);
  assert.strictEqual(result, false);
});

test("findParentHeading - 简单层级结构", () => {
  // 创建结构: heading1 -> paragraph -> heading2
  const heading2 = createHeadingNode(2);
  const paragraph = createParagraphNode([heading2]);
  const heading1 = createHeadingNode(1, [paragraph]);

  const root = heading1;
  const result = findParentHeading(root, heading2);

  assert.notStrictEqual(result, null);
  assert.strictEqual(result?.type, "heading");
  assert.strictEqual(result?.depth, 1);
});

test("findParentHeading - 没有父级 heading 应该返回 null", () => {
  // 创建结构: paragraph -> heading
  const heading = createHeadingNode(1);
  const paragraph = createParagraphNode([heading]);
  const root = paragraph;

  const result = findParentHeading(root, heading);
  assert.strictEqual(result, null);
});

test("findParentHeading - 多层嵌套", () => {
  // 创建结构: h1 -> h2 -> h3
  const heading3 = createHeadingNode(3);
  const heading2 = createHeadingNode(2, [heading3]);
  const heading1 = createHeadingNode(1, [heading2]);

  const root = heading1;
  const result = findParentHeading(root, heading3);

  assert.notStrictEqual(result, null);
  assert.strictEqual(result?.type, "heading");
  assert.strictEqual(result?.depth, 2);
});

test("findParentHeading - 目标节点不在树中应该返回 null", () => {
  const heading1 = createHeadingNode(1);
  const heading2 = createHeadingNode(2);
  const root = heading1;

  const result = findParentHeading(root, heading2);
  assert.strictEqual(result, null);
});

test("findParentHeadingFromParent - null parent 应该返回 null", () => {
  const root = createHeadingNode(1);
  const result = findParentHeadingFromParent(null, root);
  assert.strictEqual(result, null);
});

test("findParentHeadingFromParent - 有父级 heading", () => {
  // 创建结构: heading1 -> paragraph -> heading2
  const heading2 = createHeadingNode(2);
  const paragraph = createParagraphNode([heading2]);
  const heading1 = createHeadingNode(1, [paragraph]);

  const root = heading1;
  const result = findParentHeadingFromParent(paragraph, root);

  assert.notStrictEqual(result, null);
  assert.strictEqual(result?.type, "heading");
  assert.strictEqual(result?.depth, 1);
});

test("findParentHeadingFromParent - parent 不在树中应该返回 null", () => {
  const root = createHeadingNode(1);
  const orphanNode = createParagraphNode();
  const result = findParentHeadingFromParent(orphanNode, root);
  assert.strictEqual(result, null);
});
