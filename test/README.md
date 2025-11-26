# 测试说明

## 运行测试

### 方式 1: 使用 npm 脚本（推荐）

```bash
npm run test:simple
```

或者：

```bash
npm test
```

### 方式 2: 直接运行测试脚本

```bash
npx tsx test/run-test.ts
```

### 方式 3: 使用 Node.js 内置测试（Node.js 18+）

```bash
node --test test/basic.test.ts
```

### 方式 4: 使用 tsx（需要先安装）

```bash
npm install -D tsx
npx tsx test/basic.test.ts
```

### 方式 5: 使用 ts-node（需要先安装）

```bash
npm install -D ts-node @types/node
npx ts-node test/basic.test.ts
```

## 测试文件说明

### run-test.ts

简单的测试运行脚本，可以直接执行并查看结果。包含以下测试用例：

1. **基本嵌入处理** - 测试基本的文件嵌入功能
2. **标题层级调整** - 测试标题深度的自动调整
3. **列表项中的嵌入** - 测试在列表项中嵌入时的特殊处理
4. **嵌套嵌入** - 测试递归处理嵌套嵌入
5. **循环嵌套检测** - 测试循环引用的检测和跳过
6. **标题超过6级转换为列表** - 测试标题深度超过6级时的列表转换

## 添加新测试

在 `test/` 目录下创建新的 `.test.ts` 文件，使用相同的测试框架格式。

