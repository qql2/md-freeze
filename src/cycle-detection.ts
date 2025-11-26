import { PathStack } from "./types";

/**
 * 检查路径栈中是否存在循环引用
 * @param pathStack 路径栈
 * @param filePath 要检查的文件路径
 * @returns 如果存在循环则返回 true
 */
export function hasCycle(pathStack: PathStack, filePath: string): boolean {
  return pathStack.includes(filePath);
}

/**
 * 将文件路径推入路径栈
 * @param pathStack 当前路径栈
 * @param filePath 文件路径
 * @returns 新的路径栈
 */
export function pushPath(pathStack: PathStack, filePath: string): PathStack {
  return [...pathStack, filePath];
}
