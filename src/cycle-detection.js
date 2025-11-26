"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasCycle = hasCycle;
exports.pushPath = pushPath;
exports.popPath = popPath;
/**
 * 检查路径栈中是否存在循环嵌套
 * @param pathStack 当前路径栈
 * @param filePath 要检查的文件路径
 * @returns 如果存在循环返回 true，否则返回 false
 */
function hasCycle(pathStack, filePath) {
    return pathStack.includes(filePath);
}
/**
 * 将文件路径推入路径栈
 * @param pathStack 当前路径栈
 * @param filePath 文件路径
 * @returns 新的路径栈
 */
function pushPath(pathStack, filePath) {
    return __spreadArray(__spreadArray([], pathStack, true), [filePath], false);
}
/**
 * 从路径栈中弹出最后一个路径
 * @param pathStack 当前路径栈
 * @returns 新的路径栈
 */
function popPath(pathStack) {
    return pathStack.slice(0, -1);
}
