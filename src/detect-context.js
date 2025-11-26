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
exports.findParentHeading = findParentHeading;
exports.findParentHeadingFromParent = findParentHeadingFromParent;
exports.isInListItem = isInListItem;
exports.getContextHeadingDepth = getContextHeadingDepth;
/**
 * 在 hierarchy 结构中查找节点的父级 heading 节点
 * @param hierarchyRoot hierarchy 根节点
 * @param targetNode 目标节点
 * @returns 最近的祖先 heading 节点，如果没有则返回 null
 */
function findParentHeading(hierarchyRoot, targetNode) {
    // 递归查找目标节点的路径
    function findPath(node, target, path) {
        if (node === target) {
            return path;
        }
        if (node.children) {
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var child = _a[_i];
                var result = findPath(child, target, __spreadArray(__spreadArray([], path, true), [node], false));
                if (result) {
                    return result;
                }
            }
        }
        return null;
    }
    var path = findPath(hierarchyRoot, targetNode, []);
    if (!path) {
        return null;
    }
    // 从路径中反向查找第一个 heading 节点（不包括目标节点本身）
    for (var i = path.length - 1; i >= 0; i--) {
        if (path[i].type === "heading") {
            return path[i];
        }
    }
    return null;
}
/**
 * 从父节点链中查找最近的 heading 节点
 * @param parent 父节点
 * @param hierarchyRoot hierarchy 根节点
 * @returns 最近的祖先 heading 节点，如果没有则返回 null
 */
function findParentHeadingFromParent(parent, hierarchyRoot) {
    if (!parent) {
        return null;
    }
    return findParentHeading(hierarchyRoot, parent);
}
/**
 * 检查节点的父节点是否是 list-item
 * @param parent 父节点
 * @returns 如果父节点是 list-item 返回 true，否则返回 false
 */
function isInListItem(parent) {
    return parent !== null && parent.type === "listItem";
}
/**
 * 获取上下文标题的深度
 * @param parentHeading 父级 heading 节点
 * @returns heading 的深度，如果没有则返回 0
 */
function getContextHeadingDepth(parentHeading) {
    if (!parentHeading || parentHeading.type !== "heading") {
        return 0;
    }
    return parentHeading.depth || 0;
}
