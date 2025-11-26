<!-- 0dc38f54-842b-4d60-9f2a-ab3dbee5e4f7 f1ea6ec4-a1d7-4739-b7bb-2a19df9afd81 -->
# 实现 remark-freeze 插件

## 概述

创建一个 remark transform 插件 `remark-freeze`，用于处理 Obsidian 嵌入语法，将被嵌入的文件内容"冻结"到当前文档中，并自动调整标题层级。

## 技术方案

### 1. 插件架构

- **类型**：remark transform 插件（处理 mdast）
- **依赖**：配合 `@qql2/remark-obsidian`（parse 阶段）和 `remark-stringify`（stringify 阶段）
- **入口**：`src/index.ts` 导出插件函数

### 2. 核心功能实现

#### 2.1 插件接口设计

```typescript
interface FreezeOptions {
  readFile: (embedNode: ObsidianEmbedNode) => Promise<string> | string;
}
```

#### 2.2 主要处理流程

1. **转换为 hierarchy 结构**：使用 `hierarchy-mdast.toHierarchy()` 将 mdast 转换为 hierarchy 结构
2. **遍历 hierarchy**：在 hierarchy 结构上查找所有 `obsidianEmbed` 节点
3. **读取嵌入文件**：调用外部 `readFile` 函数获取 markdown 内容
4. **解析嵌入内容**：使用 `remark().use(remarkObsidian).parse()` 解析
5. **递归处理嵌套**：对解析后的 mdast 递归调用 freeze 逻辑（同样先 toHierarchy）
6. **调整标题层级**：根据上下文调整标题深度（在 hierarchy 结构上操作）
7. **替换嵌入节点**：将处理后的内容替换原嵌入节点
8. **还原为 mdast**：使用 `hierarchy-mdast.unHierarchy()` 将 hierarchy 结构还原为 mdast

#### 2.3 标题层级调整逻辑

- 使用 `hierarchy-mdast` 的 `toHierarchy` 获取当前嵌入节点的上下文
- 查找最近的祖先 heading 节点，获取其 depth
- 调整规则：
  - 如果嵌入在 list-item 中：直接添加到 list-item.children，不调整标题
  - 否则：增加标题深度（depth + contextDepth + 1）
  - 如果调整后 depth > 6：将 heading 转换为 list，内容作为 list-item

#### 2.4 循环检测

- 维护一个路径栈（数组），记录当前处理链中的文件路径
- 每次处理嵌入前检查路径栈中是否已存在该文件路径
- 如果存在则跳过并警告，否则推入路径栈，处理完成后弹出

### 3. 文件结构

- `src/index.ts` - 主插件实现
- `src/adjust-headings.ts` - 标题层级调整逻辑
- `src/detect-context.ts` - 上下文检测（使用 hierarchy-mdast）
- `src/cycle-detection.ts` - 循环检测逻辑
- `src/types.ts` - TypeScript 类型定义

### 4. 关键实现细节

#### 4.1 上下文检测和处理流程

- **入口**：接收 mdast，先使用 `toHierarchy()` 转换为 hierarchy 结构
- **处理**：在 hierarchy 结构上进行所有操作（查找嵌入节点、调整标题等）
- **上下文检测**：通过 hierarchy 结构的父子关系查找嵌入节点的父级 heading
- **出口**：处理完成后使用 `unHierarchy()` 还原为 mdast

#### 4.2 标题转列表

- 当 heading depth 需要超过 6 时
- 创建 list 和 list-item 节点
- 将 heading 的文本作为 list-item 的第一个子节点（paragraph）
- 将 heading 下的内容（通过 hierarchy-mdast 识别）作为 list-item 的后续子节点

#### 4.3 列表项中的嵌入

- 检测父节点是否为 `listItem`
- 如果是，直接将嵌入内容的 children 添加到 listItem.children

## 实现步骤

1. 设置项目基础结构（类型定义、入口文件）
2. 实现循环检测机制
3. 实现上下文检测（使用 hierarchy-mdast）
4. 实现标题层级调整逻辑
5. 实现主插件逻辑（遍历、读取、解析、递归、替换）
6. 更新构建配置和导出

## 注意事项

- **关键流程**：必须遵循 `mdast -> toHierarchy -> 处理 -> unHierarchy -> mdast` 的流程
- 需要处理异步文件读取（readFile 可能是 async）
- hierarchy-mdast 的 API 需要实际测试确认（特别是 hierarchy 结构的节点类型和访问方式）
- 标题转列表的逻辑需要仔细处理内容边界
- 确保路径栈的正确维护（push/pop 配对）
- 递归处理嵌套嵌入时，也需要对嵌入内容的 mdast 先 toHierarchy 再处理

### To-dos

- [ ] 查看 @qql2/remark-obsidian 源码或测试，确定嵌入节点的类型和结构
- [ ] 创建插件基础框架和类型定义（fileReader 函数签名、插件选项类型）
- [ ] 实现嵌入节点查找逻辑（在 hierarchy 结构上遍历，而非直接使用 unist-util-visit）
- [ ] 实现上下文标题层级检测（使用 hierarchy-mdast 的 parse 和 getBelowHeading）
- [ ] 实现标题深度调整逻辑（增加 depth，处理 h6→list-item 转换）
- [ ] 实现列表项中的嵌入处理（检测 list-item 上下文，直接添加 children）
- [ ] 实现嵌套嵌入的递归处理
- [ ] 实现循环检测（文件路径栈检测）
- [ ] 更新 package.json 和构建配置（修复入口文件名）