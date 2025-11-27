import { remark } from "remark";
import { remarkObsidian } from "@qql2/remark-obsidian";
import remarkStringify from "remark-stringify";
import { toHierarchy, unHierarchy } from "hierarchy-mdast";
import { HierarchyNode } from "../src/types";

async function test() {
  // 模拟嵌入文件内容
  const embedContent = "# Heading\n\nContent";

  // 解析嵌入内容
  const processor = remark().use(remarkObsidian);
  const embeddedTree = processor.parse(embedContent);
  await processor.runSync(embeddedTree);

  console.log("=== 原始 mdast ===");
  console.log(JSON.stringify(embeddedTree, null, 2));

  // 转换为 hierarchy
  const embeddedHierarchy = toHierarchy(embeddedTree);

  console.log("\n=== Hierarchy 结构 ===");
  console.log(JSON.stringify(embeddedHierarchy, null, 2));

  // 查看 heading.content
  if (embeddedHierarchy.children && embeddedHierarchy.children[0]) {
    const heading = embeddedHierarchy.children[0];
    console.log("\n=== Heading 节点 ===");
    console.log("Type:", heading.type);
    console.log("Depth:", heading.depth);
    console.log("Children:", heading.children);
    console.log("Content:", heading.content);
    console.log("Content length:", heading.content?.length);

    if (heading.content) {
      console.log("\n=== Content 中的节点 ===");
      heading.content.forEach((node: HierarchyNode, idx: number) => {
        console.log(`Content[${idx}]:`, node.type, node);
      });
    }
  }

  // 模拟列表项结构
  const listItem: HierarchyNode = {
    type: "listItem",
    children: [],
  };

  console.log("\n=== 当前实现：只 push heading 节点 ===");
  if (embeddedHierarchy.children) {
    listItem.children = [...embeddedHierarchy.children];
  }
  console.log("List item children:", listItem.children);
  console.log("List item children length:", listItem.children?.length || 0);

  // 转换回 mdast
  const resultTree = unHierarchy({
    type: "root",
    children: [listItem],
  });

  console.log("\n=== 转换回 mdast ===");
  console.log(JSON.stringify(resultTree, null, 2));

  // 转换为 markdown
  const stringify = remark().use(remarkStringify);
  const output = stringify.stringify(resultTree);
  console.log("\n=== 最终输出 ===");
  console.log(output);

  console.log("\n=== 问题分析 ===");
  console.log("是否包含 'Content':", output.includes("Content"));
  console.log("是否包含 'Heading':", output.includes("Heading"));
}

test().catch(console.error);
