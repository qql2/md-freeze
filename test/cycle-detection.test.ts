import { test } from "node:test";
import assert from "node:assert";
import { hasCycle, pushPath, popPath } from "../src/cycle-detection";

test("hasCycle - 空路径栈应该返回 false", () => {
  const pathStack: string[] = [];
  const result = hasCycle(pathStack, "file1.md");
  assert.strictEqual(result, false);
});

test("hasCycle - 路径栈中不存在文件应该返回 false", () => {
  const pathStack = ["file1.md", "file2.md"];
  const result = hasCycle(pathStack, "file3.md");
  assert.strictEqual(result, false);
});

test("hasCycle - 路径栈中存在文件应该返回 true", () => {
  const pathStack = ["file1.md", "file2.md"];
  const result = hasCycle(pathStack, "file1.md");
  assert.strictEqual(result, true);
});

test("hasCycle - 路径栈中最后一个文件应该返回 true", () => {
  const pathStack = ["file1.md", "file2.md"];
  const result = hasCycle(pathStack, "file2.md");
  assert.strictEqual(result, true);
});

test("pushPath - 应该将路径添加到路径栈末尾", () => {
  const pathStack = ["file1.md", "file2.md"];
  const newPathStack = pushPath(pathStack, "file3.md");
  assert.deepStrictEqual(newPathStack, ["file1.md", "file2.md", "file3.md"]);
});

test("pushPath - 空路径栈应该创建新数组", () => {
  const pathStack: string[] = [];
  const newPathStack = pushPath(pathStack, "file1.md");
  assert.deepStrictEqual(newPathStack, ["file1.md"]);
});

test("pushPath - 不应该修改原数组", () => {
  const pathStack = ["file1.md", "file2.md"];
  const originalLength = pathStack.length;
  pushPath(pathStack, "file3.md");
  assert.strictEqual(pathStack.length, originalLength);
  assert.deepStrictEqual(pathStack, ["file1.md", "file2.md"]);
});

test("popPath - 应该移除路径栈最后一个元素", () => {
  const pathStack = ["file1.md", "file2.md", "file3.md"];
  const newPathStack = popPath(pathStack);
  assert.deepStrictEqual(newPathStack, ["file1.md", "file2.md"]);
});

test("popPath - 单个元素的路径栈应该返回空数组", () => {
  const pathStack = ["file1.md"];
  const newPathStack = popPath(pathStack);
  assert.deepStrictEqual(newPathStack, []);
});

test("popPath - 空路径栈应该返回空数组", () => {
  const pathStack: string[] = [];
  const newPathStack = popPath(pathStack);
  assert.deepStrictEqual(newPathStack, []);
});

test("popPath - 不应该修改原数组", () => {
  const pathStack = ["file1.md", "file2.md"];
  const originalLength = pathStack.length;
  popPath(pathStack);
  assert.strictEqual(pathStack.length, originalLength);
  assert.deepStrictEqual(pathStack, ["file1.md", "file2.md"]);
});

