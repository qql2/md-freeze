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
Object.defineProperty(exports, "__esModule", { value: true });
var remark_1 = require("remark");
var remark_obsidian_1 = require("@qql2/remark-obsidian");
var remark_stringify_1 = require("remark-stringify");
var index_1 = require("../src/index");
var node_test_1 = require("node:test");
var node_assert_1 = require("node:assert");
/**
 * 模拟文件读取函数
 */
function createMockReadFile(files) {
    return function (embedNode) {
        var filePath = embedNode.data.target;
        if (files[filePath]) {
            return files[filePath];
        }
        throw new Error("File not found: ".concat(filePath));
    };
}
(0, node_test_1.test)("基本嵌入处理", function () { return __awaiter(void 0, void 0, void 0, function () {
    var files, processor, markdown, result, output;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                files = {
                    "file1.md": "# File 1\n\nContent from file 1",
                };
                processor = (0, remark_1.remark)()
                    .use(remark_obsidian_1.remarkObsidian)
                    .use(index_1.remarkFreeze, { readFile: createMockReadFile(files) })
                    .use(remark_stringify_1.default);
                markdown = "![[file1.md]]";
                return [4 /*yield*/, processor.process(markdown)];
            case 1:
                result = _a.sent();
                output = result.toString();
                (0, node_assert_1.default)(output.includes("File 1"), "应该包含 File 1");
                (0, node_assert_1.default)(output.includes("Content from file 1"), "应该包含 Content from file 1");
                return [2 /*return*/];
        }
    });
}); });
(0, node_test_1.test)("标题层级调整", function () { return __awaiter(void 0, void 0, void 0, function () {
    var files, processor, markdown, result, output;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                files = {
                    "file1.md": "# Heading 1\n\n## Heading 2\n\nContent",
                };
                processor = (0, remark_1.remark)()
                    .use(remark_obsidian_1.remarkObsidian)
                    .use(index_1.remarkFreeze, { readFile: createMockReadFile(files) })
                    .use(remark_stringify_1.default);
                markdown = "# Main Heading\n\n![[file1.md]]";
                return [4 /*yield*/, processor.process(markdown)];
            case 1:
                result = _a.sent();
                output = result.toString();
                (0, node_assert_1.default)(output.includes("Heading 1"), "应该包含 Heading 1");
                (0, node_assert_1.default)(output.includes("Content"), "应该包含 Content");
                // 检查标题层级是否被调整了
                // "file1.md" 的 Heading 1 应该变成 Heading 2（因为外部有一个 # Main Heading）
                (0, node_assert_1.default)(output.includes("## Heading 1"), "嵌入的一级标题应该变成二级标题");
                (0, node_assert_1.default)(output.includes("### Heading 2"), "嵌入的二级标题应该变成三级标题");
                return [2 /*return*/];
        }
    });
}); });
(0, node_test_1.test)("列表项中的嵌入", function () { return __awaiter(void 0, void 0, void 0, function () {
    var files, processor, markdown, result, output;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                files = {
                    "file1.md": "# Heading\n\nContent",
                };
                processor = (0, remark_1.remark)()
                    .use(remark_obsidian_1.remarkObsidian)
                    .use(index_1.remarkFreeze, { readFile: createMockReadFile(files) })
                    .use(remark_stringify_1.default);
                markdown = "- List item\n  ![[file1.md]]";
                return [4 /*yield*/, processor.process(markdown)];
            case 1:
                result = _a.sent();
                output = result.toString();
                // 在列表项中，标题不应该调整，内容直接添加到 list-item
                (0, node_assert_1.default)(output.includes("Heading"), "应该包含 Heading");
                (0, node_assert_1.default)(output.includes("Content"), "应该包含 Content");
                // 检查标题没有升级，heading 没有变成 ##/###
                (0, node_assert_1.default)(!output.includes("## Heading"), "列表项嵌入时标题深度不应被修改");
                // 检查嵌入内容依然在列表项中
                // 有两种可能输出格式，根据 remark-stringify:
                // - "- List item\n  # Heading\n\n  Content\n"
                // - "- List item\n\n  # Heading\n\n  Content\n"
                // 检查缩进的 # Heading 存在
                (0, node_assert_1.default)(/-\s+List item[\s\S]*^[ ]{2}# Heading/m.test(output) ||
                    /-\s+List item\n\n[ ]{2}# Heading/m.test(output), "嵌入的内容应该处于 list-item 缩进之下");
                // 检查缩进的 Content 存在
                (0, node_assert_1.default)(/^[ ]{2}Content/m.test(output), "嵌入内容应在列表项缩进下");
                return [2 /*return*/];
        }
    });
}); });
(0, node_test_1.test)("嵌套嵌入", function () { return __awaiter(void 0, void 0, void 0, function () {
    var files, processor, markdown, result, output;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                files = {
                    "file1.md": "# File 1\n\n![[file2.md]]",
                    "file2.md": "# File 2\n\nContent from file 2",
                };
                processor = (0, remark_1.remark)()
                    .use(remark_obsidian_1.remarkObsidian)
                    .use(index_1.remarkFreeze, { readFile: createMockReadFile(files) })
                    .use(remark_stringify_1.default);
                markdown = "![[file1.md]]";
                return [4 /*yield*/, processor.process(markdown)];
            case 1:
                result = _a.sent();
                output = result.toString();
                (0, node_assert_1.default)(output.includes("File 1"), "应该包含 File 1");
                (0, node_assert_1.default)(output.includes("File 2"), "应该包含 File 2");
                (0, node_assert_1.default)(output.includes("Content from file 2"), "应该包含 Content from file 2");
                return [2 /*return*/];
        }
    });
}); });
(0, node_test_1.test)("循环嵌套检测", function () { return __awaiter(void 0, void 0, void 0, function () {
    var files, processor, markdown, result, output, file1Matches;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                files = {
                    "file1.md": "![[file2.md]]",
                    "file2.md": "![[file1.md]]",
                };
                processor = (0, remark_1.remark)()
                    .use(remark_obsidian_1.remarkObsidian)
                    .use(index_1.remarkFreeze, { readFile: createMockReadFile(files) })
                    .use(remark_stringify_1.default);
                markdown = "![[file1.md]]";
                return [4 /*yield*/, processor.process(markdown)];
            case 1:
                result = _a.sent();
                output = result.toString();
                // 应该只处理一层，第二层因为循环被跳过
                (0, node_assert_1.default)(output !== undefined, "应该有输出");
                file1Matches = output.match(/file1\.md/g) || [];
                (0, node_assert_1.default)(file1Matches.length <= 1, "循环嵌套时不应该有两个 File 1");
                return [2 /*return*/];
        }
    });
}); });
(0, node_test_1.test)("标题超过6级转换为列表", function () { return __awaiter(void 0, void 0, void 0, function () {
    var files, processor, markdown, result, output;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                files = {
                    "file1.md": "###### Heading 6\n\nContent",
                };
                processor = (0, remark_1.remark)()
                    .use(remark_obsidian_1.remarkObsidian)
                    .use(index_1.remarkFreeze, { readFile: createMockReadFile(files) })
                    .use(remark_stringify_1.default);
                markdown = "###### Context Heading\n\n![[file1.md]]";
                return [4 /*yield*/, processor.process(markdown)];
            case 1:
                result = _a.sent();
                output = result.toString();
                console.log(JSON.stringify(output, null, 2));
                // h6 + contextDepth(6) + 1 = 13 > 6，应该转换为列表
                (0, node_assert_1.default)(output.includes("Heading 6"), "应该包含 Heading 6");
                (0, node_assert_1.default)(output.includes("Content"), "应该包含 Content");
                (0, node_assert_1.default)(!output.includes("###### Heading 6"), "标题不应该超过6级");
                return [2 /*return*/];
        }
    });
}); });
