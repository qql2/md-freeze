import { remark } from "remark";
import { remarkObsidian } from "@qql2/remark-obsidian";
import { toHierarchy } from "hierarchy-mdast";

async function test() {
  const processor = remark().use(remarkObsidian);
  const markdown = "# Main Heading\n\n![[file1.md]]";
  const ast = processor.parse(markdown);
  await processor.runSync(ast);
  
  console.log("原始 AST:");
  console.log(JSON.stringify(ast, null, 2));
  
  const hierarchy = toHierarchy(ast);
  console.log("\nHierarchy 结构:");
  console.log(JSON.stringify(hierarchy, null, 2));
  
  // 查找 obsidianEmbed 节点
  function findEmbedNodes(node: any, path: string[] = []): void {
    if (node.type === "obsidianEmbed") {
      console.log(`找到 obsidianEmbed 节点，路径: ${path.join(" -> ")}`);
    }
    if (node.children) {
      node.children.forEach((child: any, idx: number) => {
        findEmbedNodes(child, [...path, `${node.type}[${idx}]`]);
      });
    }
  }
  
  console.log("\n查找 obsidianEmbed 节点:");
  findEmbedNodes(hierarchy);
}

test().catch(console.error);

