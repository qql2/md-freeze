# remark-freeze

一个 remark 插件，用于将 Obsidian 嵌入的 markdown 文件内容"冻结"到当前文档中，并自动调整标题层级，确保嵌入内容的标题层级低于嵌入位置的上下文标题层级。

## 功能特性

- ✅ 将 `![[file.md]]` 嵌入语法替换为实际文件内容
- ✅ 自动调整嵌入文件的标题层级，保证层级关系正确
- ✅ 支持嵌套嵌入（文件 A 嵌入文件 B，文件 B 嵌入文件 C）
- ✅ 循环引用检测，避免无限递归
- ✅ 列表项中的嵌入内容不调整标题层级
- ✅ 超过 6 级的标题自动转换为列表

## 安装

```bash
npm install remark-freeze
```

## 使用方法

### 基本用法

```typescript
import { remark } from "remark";
import { remarkObsidian } from "@qql2/remark-obsidian";
import { remarkFreeze } from "remark-freeze";
import remarkStringify from "remark-stringify";

// 定义文件读取函数
const readFile = (embedNode) => {
  const filePath = embedNode.data.target;
  // 返回文件内容（可以是同步或异步）
  return fs.readFileSync(filePath, "utf-8");
};

// 创建处理器
const processor = remark()
  .use(remarkObsidian) // 必须先使用 remarkObsidian 解析嵌入语法
  .use(remarkFreeze, { readFile })
  .use(remarkStringify);

// 处理 markdown
const markdown = `# Main Heading

![[file1.md]]`;

const result = await processor.process(markdown);
console.log(result.toString());
```

### 配置选项

```typescript
interface FreezeOptions {
  readFile: (embedNode: ObsidianEmbedNode) => Promise<string> | string;
}
```

- `readFile`: 文件读取函数，接收嵌入节点，返回文件内容（支持同步或异步）

### 使用示例

#### 示例 1: 基本嵌入

**输入:**
```markdown
# Main Heading

![[file1.md]]
```

**file1.md:**
```markdown
# File 1

Content from file 1
```

**输出:**
```markdown
# Main Heading

## File 1

Content from file 1
```

嵌入文件的一级标题自动调整为二级标题（比上下文标题 `# Main Heading` 低一级）。

#### 示例 2: 嵌套嵌入

**输入:**
```markdown
![[file1.md]]
```

**file1.md:**
```markdown
# File 1

![[file2.md]]
```

**file2.md:**
```markdown
# File 2

Content from file 2
```

**输出:**
```markdown
# File 1

## File 2

Content from file 2
```

支持多层嵌套，每一层都会自动调整标题层级。

#### 示例 3: 列表项中的嵌入

**输入:**
```markdown
## Context Heading

- List item
  ![[file1.md]]
```

**file1.md:**
```markdown
# Heading

Content
```

**输出:**
```markdown
## Context Heading

- List item

  # Heading

  Content
```

列表项中的嵌入内容**不会**调整标题层级，保持原始标题深度。

#### 示例 4: 异步文件读取

```typescript
const readFile = async (embedNode) => {
  const filePath = embedNode.data.target;
  const content = await fetch(`https://example.com/${filePath}`);
  return content.text();
};

const processor = remark()
  .use(remarkObsidian)
  .use(remarkFreeze, { readFile })
  .use(remarkStringify);
```

## 注意事项

1. **必须先使用 `remarkObsidian`**: 在 `remarkFreeze` 之前必须使用 `@qql2/remark-obsidian` 来解析 Obsidian 嵌入语法
2. **循环引用**: 插件会自动检测并跳过循环引用，避免无限递归
3. **文件读取失败**: 如果文件读取失败，嵌入节点会被移除
4. **标题层级调整规则**: 
   - 嵌入文件的标题层级 = 原始层级 + 上下文标题深度
   - 如果计算结果超过 6 级，会转换为列表
   - 如果嵌入文件的标题层级已经高于上下文，则不调整
5. **列表项中的嵌入**: 列表项中的嵌入内容不会调整标题层级

## License

MIT

