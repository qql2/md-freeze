import { PathStack } from "./types";

/**
 * 检查路径栈中是否存在循环嵌套
 * @param pathStack 当前路径栈
 * @param filePath 要检查的文件路径
 * @returns 如果存在循环返回 true，否则返回 false
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

/**
 * 从路径栈中弹出最后一个路径
 * @param pathStack 当前路径栈
 * @returns 新的路径栈
 */
export function popPath(pathStack: PathStack): PathStack {
  return pathStack.slice(0, -1);
}

