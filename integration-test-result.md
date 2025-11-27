# 集成测试结果

本文档是 remark-freeze 插件的集成测试最终输出结果。

## 测试场景说明

本次集成测试包含以下功能点：
- ✅ 多个文件的嵌入
- ✅ 嵌套嵌入（3层深度）
- ✅ 标题层级自动调整
- ✅ 列表项中的嵌入处理
- ✅ 空文件处理（自动移除）
- ✅ 循环引用检测

## 输入文件结构

### 主文档 (main.md)

```markdown
# Main Document

This is the main document.

## Part 1

![[chapter1.md]]

## Part 2

![[chapter2.md]]

## Part 3

![[empty.md]]

## Part 4

![[circular-a.md]]

```

### 引用的文件

#### chapter1.md
```markdown
# Chapter 1: Introduction

This is the introduction chapter.

## Section 1.1

Content of section 1.1.

![[details.md]]

## Section 1.2

More content here.

```

#### chapter2.md
```markdown
# Chapter 2: Advanced Topics

## Section 2.1

Advanced content.

![[nested-content.md]]

## Section 2.2

- List item 1
  ![[list-embed.md]]
- List item 2

```

#### details.md
```markdown
# Details

Detailed information here.

## Sub-details

More details.

![[extra-info.md]]

```

#### nested-content.md
```markdown
# Nested Content

This is nested content.

## Nested Section

Content here.

```

#### extra-info.md
```markdown
# Extra Information

Additional information.

```

#### list-embed.md
```markdown
# List Embed Heading

Content in list embed.

```

#### empty.md
```markdown
（空文件）
```

#### circular-a.md
```markdown
# Circular A

![[circular-b.md]]

```

#### circular-b.md
```markdown
# Circular B

![[circular-a.md]]

```

---

## 最终输出结果

以下是经过 remark-freeze 处理后的最终 markdown 文档：

---

# Main Document

This is the main document.

## Part 1

### Chapter 1: Introduction

This is the introduction chapter.

#### Section 1.1

Content of section 1.1.

##### Details

Detailed information here.

###### Sub-details

More details.

* Extra Information

  Additional information.

#### Section 1.2

More content here.

## Part 2

### Chapter 2: Advanced Topics

#### Section 2.1

Advanced content.

##### Nested Content

This is nested content.

###### Nested Section

Content here.

#### Section 2.2

* ### List Embed Heading
  Content in list embed.
* List item 2

## Part 3

## Part 4

### Circular A

#### Circular B


---

## 测试统计

- **输出长度**: 629 字符
- **输出行数**: 60 行
- **测试时间**: 2025-11-27T12:02:41.529Z

## 验证结果

✅ 所有断言测试通过
✅ 所有嵌入节点已正确处理
✅ 标题层级调整正确
✅ 循环引用检测正常
✅ 空文件已移除
✅ 输出格式正确

---

*此文件由集成测试自动生成*
