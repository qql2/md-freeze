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
exports.adjustHeadingDepths = adjustHeadingDepths;
/**
 * 调整 hierarchy 结构中所有 heading 节点的深度
 * @param hierarchyRoot hierarchy 根节点
 * @param contextDepth 上下文标题深度
 */
function adjustHeadingDepths(hierarchyRoot, contextDepth) {
    // 在 hierarchy 结构上遍历所有 heading 节点
    function traverse(node) {
        if (node.type === "heading") {
            var currentDepth = node.depth || 1;
            var newDepth = currentDepth + contextDepth + 1;
            if (newDepth > 6) {
                // 需要转换为列表
                convertHeadingToList(node);
            }
            else {
                node.depth = newDepth;
            }
        }
        if (node.children) {
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var child = _a[_i];
                traverse(child);
            }
        }
    }
    traverse(hierarchyRoot);
}
/**
 * 将 heading 节点转换为 list 和 list-item
 * @param headingNode heading 节点
 */
function convertHeadingToList(headingNode) {
    // 获取 heading 的文本内容
    var headingText = extractHeadingText(headingNode);
    // 保存 heading 的 children（这些是 heading 下的内容）
    var headingChildren = headingNode.children || [];
    // 创建 list-item，将标题文本作为第一个段落，后面跟着原 heading 的内容
    var listItem = {
        type: "listItem",
        spread: false,
        checked: null,
        children: __spreadArray([
            {
                type: "paragraph",
                children: [
                    {
                        type: "text",
                        value: headingText,
                    },
                ],
            }
        ], headingChildren, true),
    };
    // 创建 list，包含这个 list-item
    var list = {
        type: "list",
        ordered: false,
        start: null,
        spread: false,
        children: [listItem],
    };
    // 替换原 heading 节点的所有属性
    Object.keys(headingNode).forEach(function (key) {
        if (key !== "type" && key !== "children") {
            delete headingNode[key];
        }
    });
    // 设置新的类型和 children
    headingNode.type = "list";
    headingNode.children = list.children;
    Object.assign(headingNode, {
        ordered: false,
        start: null,
        spread: false,
    });
}
/**
 * 提取 heading 节点的文本内容
 * @param headingNode heading 节点
 * @returns 文本内容
 */
function extractHeadingText(headingNode) {
    if (!headingNode.children) {
        return "";
    }
    var textParts = [];
    function extractText(node) {
        if (node.type === "text") {
            textParts.push(node.value || "");
        }
        else if (node.children) {
            for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                var child = _a[_i];
                extractText(child);
            }
        }
    }
    for (var _i = 0, _a = headingNode.children; _i < _a.length; _i++) {
        var child = _a[_i];
        extractText(child);
    }
    return textParts.join("");
}
