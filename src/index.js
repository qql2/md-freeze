"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
exports.remarkFreeze = remarkFreeze;
var remark_1 = require("remark");
var remark_obsidian_1 = require("@qql2/remark-obsidian");
var hierarchy_mdast_1 = require("hierarchy-mdast");
var cycle_detection_1 = require("./cycle-detection");
var detect_context_1 = require("./detect-context");
var adjust_headings_1 = require("./adjust-headings");
/**
 * Remark freeze 插件
 * 将 Obsidian 嵌入的文件内容"冻结"到当前文档中，并自动调整标题层级
 */
function remarkFreeze(options) {
    return function (tree) {
        return __awaiter(this, void 0, void 0, function () {
            var pathStack;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pathStack = [];
                        return [4 /*yield*/, processTree(tree, options, pathStack)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
}
/**
 * 处理 mdast 树
 * @param tree mdast 根节点
 * @param options 插件选项
 * @param pathStack 路径栈（用于循环检测）
 */
function processTree(tree, options, pathStack) {
    return __awaiter(this, void 0, void 0, function () {
        var hasEmbedNodes, iterations, maxIterations, _loop_1, state_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    hasEmbedNodes = true;
                    iterations = 0;
                    maxIterations = 100;
                    _loop_1 = function () {
                        function collectEmbedNodes(node, parent, index) {
                            if (node.type === "obsidianEmbed") {
                                embedNodes.push({ node: node, parent: parent, index: index });
                            }
                            if (node.children) {
                                node.children.forEach(function (child, idx) {
                                    collectEmbedNodes(child, node, idx);
                                });
                            }
                        }
                        var embedNodes, hierarchyTree, i, _d, node, parent_1, processed, embedIndex, embedIndex;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    iterations++;
                                    embedNodes = [];
                                    collectEmbedNodes(tree, null, -1);
                                    // 如果没有找到嵌入节点，退出循环
                                    if (embedNodes.length === 0) {
                                        hasEmbedNodes = false;
                                        return [2 /*return*/, "break"];
                                    }
                                    hierarchyTree = (0, hierarchy_mdast_1.toHierarchy)(JSON.parse(JSON.stringify(tree)));
                                    i = embedNodes.length - 1;
                                    _e.label = 1;
                                case 1:
                                    if (!(i >= 0)) return [3 /*break*/, 4];
                                    _d = embedNodes[i], node = _d.node, parent_1 = _d.parent;
                                    return [4 /*yield*/, processEmbedNode(node, parent_1, tree, hierarchyTree, options, pathStack)];
                                case 2:
                                    processed = _e.sent();
                                    // 如果节点没有被处理（比如循环检测跳过），需要移除它
                                    if (!processed && parent_1) {
                                        embedIndex = (_a = parent_1.children) === null || _a === void 0 ? void 0 : _a.indexOf(node);
                                        if (embedIndex !== undefined && embedIndex !== -1 && parent_1.children) {
                                            parent_1.children.splice(embedIndex, 1);
                                        }
                                    }
                                    else if (!processed && !parent_1) {
                                        embedIndex = (_b = tree.children) === null || _b === void 0 ? void 0 : _b.indexOf(node);
                                        if (embedIndex !== undefined && embedIndex !== -1 && tree.children) {
                                            tree.children.splice(embedIndex, 1);
                                        }
                                    }
                                    _e.label = 3;
                                case 3:
                                    i--;
                                    return [3 /*break*/, 1];
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    _c.label = 1;
                case 1:
                    if (!(hasEmbedNodes && iterations < maxIterations)) return [3 /*break*/, 3];
                    return [5 /*yield**/, _loop_1()];
                case 2:
                    state_1 = _c.sent();
                    if (state_1 === "break")
                        return [3 /*break*/, 3];
                    return [3 /*break*/, 1];
                case 3:
                    if (iterations >= maxIterations) {
                        console.warn("警告: 达到最大迭代次数，可能存在循环嵌套");
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * 处理单个嵌入节点
 * @param embedNode 嵌入节点
 * @param parent 父节点
 * @param hierarchyRoot hierarchy 根节点
 * @param options 插件选项
 * @param pathStack 路径栈
 * @returns 是否成功处理了节点
 */
function processEmbedNode(embedNode, // mdast 节点
parent, // mdast 父节点
tree, // 完整的 mdast 树
hierarchyTree, // hierarchy 结构（用于上下文检测）
options, pathStack) {
    return __awaiter(this, void 0, void 0, function () {
        // 向上查找 list-item 父节点
        function findListItemParent(node, target, path) {
            if (path === void 0) { path = []; }
            if (node === target) {
                // 在路径中查找 listItem
                for (var i = path.length - 1; i >= 0; i--) {
                    if (path[i].type === "listItem") {
                        return path[i];
                    }
                }
                return null;
            }
            if (node.children) {
                for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    var found = findListItemParent(child, target, __spreadArray(__spreadArray([], path, true), [node], false));
                    if (found)
                        return found;
                }
            }
            return null;
        }
        function findNodeToReplace(node, target) {
            if (node.children) {
                var index = node.children.indexOf(target);
                if (index !== -1) {
                    return { node: node, index: index };
                }
                for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    var found_1 = findNodeToReplace(child, target);
                    if (found_1)
                        return found_1;
                }
            }
            return null;
        }
        var filePath, newPathStack, markdownContent, processor, embeddedTree, hierarchyParent, inListItem, listItemParent, nodeToReplace, replaceIndex, found, paragraphIndex, parentHeading, contextDepth_1, embeddedHierarchy, adjustedTree, childrenToInsert, hasNonHeadingNodes, originalHasNonHeadingNodes, embedIndex, parentIndex, embedIndex, error_1;
        var _a, _b, _c, _d, _e;
        var _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    filePath = embedNode.data.target;
                    // 检查循环嵌套
                    if ((0, cycle_detection_1.hasCycle)(pathStack, filePath)) {
                        console.warn("\u68C0\u6D4B\u5230\u5FAA\u73AF\u5D4C\u5957\uFF0C\u8DF3\u8FC7\u6587\u4EF6: ".concat(filePath, "\uFF0C\u8DEF\u5F84\u6808: ").concat(pathStack.join(" -> ")));
                        return [2 /*return*/, false];
                    }
                    newPathStack = (0, cycle_detection_1.pushPath)(pathStack, filePath);
                    _k.label = 1;
                case 1:
                    _k.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, Promise.resolve(options.readFile(embedNode))];
                case 2:
                    markdownContent = _k.sent();
                    processor = (0, remark_1.remark)().use(remark_obsidian_1.remarkObsidian);
                    embeddedTree = processor.parse(markdownContent);
                    return [4 /*yield*/, processor.runSync(embeddedTree)];
                case 3:
                    _k.sent();
                    // 递归处理嵌套嵌入
                    return [4 /*yield*/, processTree(embeddedTree, options, newPathStack)];
                case 4:
                    // 递归处理嵌套嵌入
                    _k.sent();
                    hierarchyParent = null;
                    if (parent) {
                        // 查找 parent 在 hierarchy 中的位置
                        function findHierarchyNode(mdastNode, hierarchyNode) {
                            if (mdastNode === parent) {
                                return hierarchyNode;
                            }
                            if (mdastNode.children && hierarchyNode.children) {
                                for (var i = 0; i < mdastNode.children.length; i++) {
                                    var mdastChild = mdastNode.children[i];
                                    var hierarchyChild = hierarchyNode.children[i];
                                    if (hierarchyChild) {
                                        var found = findHierarchyNode(mdastChild, hierarchyChild);
                                        if (found)
                                            return found;
                                    }
                                }
                            }
                            return null;
                        }
                        hierarchyParent = findHierarchyNode(tree, hierarchyTree);
                    }
                    inListItem = false;
                    listItemParent = null;
                    listItemParent = findListItemParent(tree, embedNode);
                    inListItem = listItemParent !== null;
                    if (inListItem && listItemParent) {
                        // 如果嵌入在 list-item 中，直接添加到 list-item.children（不调整标题）
                        if (!listItemParent.children) {
                            listItemParent.children = [];
                        }
                        nodeToReplace = null;
                        replaceIndex = -1;
                        found = findNodeToReplace(listItemParent, embedNode);
                        if (found) {
                            nodeToReplace = found.node;
                            replaceIndex = found.index;
                        }
                        if (nodeToReplace && replaceIndex !== -1) {
                            // 如果找到的节点是 paragraph 且只包含 embedNode，替换整个 paragraph
                            if (nodeToReplace.type === "paragraph" &&
                                nodeToReplace.children.length === 1) {
                                paragraphIndex = listItemParent.children.indexOf(nodeToReplace);
                                if (paragraphIndex !== -1) {
                                    if (embeddedTree.children && embeddedTree.children.length > 0) {
                                        (_a = listItemParent.children).splice.apply(_a, __spreadArray([paragraphIndex,
                                            1], embeddedTree.children, false));
                                    }
                                    else {
                                        listItemParent.children.splice(paragraphIndex, 1);
                                    }
                                }
                            }
                            else {
                                // 其他情况，直接替换 embedNode
                                if (embeddedTree.children && embeddedTree.children.length > 0) {
                                    (_b = nodeToReplace.children).splice.apply(_b, __spreadArray([replaceIndex,
                                        1], embeddedTree.children, false));
                                }
                                else {
                                    nodeToReplace.children.splice(replaceIndex, 1);
                                }
                            }
                        }
                    }
                    else {
                        parentHeading = hierarchyParent
                            ? (0, detect_context_1.findParentHeadingFromParent)(hierarchyParent, hierarchyTree)
                            : null;
                        contextDepth_1 = (0, detect_context_1.getContextHeadingDepth)(parentHeading);
                        embeddedHierarchy = (0, hierarchy_mdast_1.toHierarchy)(JSON.parse(JSON.stringify(embeddedTree)));
                        // 调整标题深度
                        (0, adjust_headings_1.adjustHeadingDepths)(embeddedHierarchy, contextDepth_1);
                        adjustedTree = (0, hierarchy_mdast_1.unHierarchy)(embeddedHierarchy);
                        childrenToInsert = adjustedTree.children && adjustedTree.children.length > 0
                            ? adjustedTree.children
                            : [];
                        hasNonHeadingNodes = childrenToInsert.some(function (node) { return node.type !== "heading"; });
                        originalHasNonHeadingNodes = (_f = embeddedTree.children) === null || _f === void 0 ? void 0 : _f.some(function (node) { return node.type !== "heading"; });
                        // 如果原始树有非标题节点，但 adjustedTree 没有，使用原始树
                        if (originalHasNonHeadingNodes &&
                            !hasNonHeadingNodes &&
                            embeddedTree.children) {
                            // 直接调整 embeddedTree 中的标题深度
                            function adjustHeadingInMdast(nodes) {
                                for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                                    var node = nodes_1[_i];
                                    if (node.type === "heading") {
                                        var currentDepth = node.depth || 1;
                                        var newDepth = currentDepth + contextDepth_1 + 1;
                                        if (newDepth > 6) {
                                            // 转换为列表（简化处理，这里先跳过）
                                            node.depth = 6;
                                        }
                                        else {
                                            node.depth = newDepth;
                                        }
                                    }
                                    if (node.children) {
                                        adjustHeadingInMdast(node.children);
                                    }
                                }
                            }
                            adjustHeadingInMdast(embeddedTree.children);
                            childrenToInsert = embeddedTree.children;
                        }
                        else if (childrenToInsert.length === 0 && embeddedTree.children) {
                            // 直接调整 embeddedTree 中的标题深度
                            function adjustHeadingInMdast(nodes) {
                                for (var _i = 0, nodes_2 = nodes; _i < nodes_2.length; _i++) {
                                    var node = nodes_2[_i];
                                    if (node.type === "heading") {
                                        var currentDepth = node.depth || 1;
                                        var newDepth = currentDepth + contextDepth_1 + 1;
                                        if (newDepth > 6) {
                                            // 转换为列表（简化处理，这里先跳过）
                                            node.depth = 6;
                                        }
                                        else {
                                            node.depth = newDepth;
                                        }
                                    }
                                    if (node.children) {
                                        adjustHeadingInMdast(node.children);
                                    }
                                }
                            }
                            adjustHeadingInMdast(embeddedTree.children);
                            childrenToInsert = embeddedTree.children;
                        }
                        // 替换嵌入节点（直接在 mdast 上操作）
                        if (parent) {
                            embedIndex = (_g = parent.children) === null || _g === void 0 ? void 0 : _g.indexOf(embedNode);
                            if (embedIndex !== undefined && embedIndex !== -1 && parent.children) {
                                // 如果 parent 是 paragraph，需要替换整个 paragraph，而不是只替换 embedNode
                                if (parent.type === "paragraph") {
                                    parentIndex = (_h = tree.children) === null || _h === void 0 ? void 0 : _h.indexOf(parent);
                                    if (parentIndex !== undefined &&
                                        parentIndex !== -1 &&
                                        tree.children &&
                                        childrenToInsert.length > 0) {
                                        (_c = tree.children).splice.apply(_c, __spreadArray([parentIndex, 1], childrenToInsert, false));
                                    }
                                }
                                else {
                                    // 其他情况，直接替换 embedNode
                                    if (childrenToInsert.length > 0) {
                                        (_d = parent.children).splice.apply(_d, __spreadArray([embedIndex, 1], childrenToInsert, false));
                                    }
                                    else {
                                        parent.children.splice(embedIndex, 1);
                                    }
                                }
                            }
                        }
                        else {
                            embedIndex = (_j = tree.children) === null || _j === void 0 ? void 0 : _j.indexOf(embedNode);
                            if (embedIndex !== undefined && embedIndex !== -1 && tree.children) {
                                if (childrenToInsert.length > 0) {
                                    (_e = tree.children).splice.apply(_e, __spreadArray([embedIndex, 1], childrenToInsert, false));
                                }
                                else {
                                    tree.children.splice(embedIndex, 1);
                                }
                            }
                        }
                    }
                    return [2 /*return*/, true];
                case 5:
                    error_1 = _k.sent();
                    console.error("\u5904\u7406\u5D4C\u5165\u6587\u4EF6\u5931\u8D25: ".concat(filePath), error_1);
                    return [2 /*return*/, false];
                case 6: return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.default = remarkFreeze;
