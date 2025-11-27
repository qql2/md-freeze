import { remark } from "remark";
import { remarkObsidian } from "@qql2/remark-obsidian";
import remarkStringify from "remark-stringify";

async function test() {
  // 测试列表项中的内容格式
  const markdown = "- List item\n  # Heading\n\n  Content";

  const processor = remark().use(remarkObsidian).use(remarkStringify);

  const tree = processor.parse(markdown);
  console.log("=== 解析后的 AST ===");
  console.log(JSON.stringify(tree, null, 2));

  const output = processor.stringify(tree);
  console.log("\n=== 输出 ===");
  console.log(JSON.stringify(output));
  console.log("\n=== 格式化输出 ===");
  console.log(output);

  // 测试我们生成的格式
  console.log("\n=== 测试我们生成的格式 ===");
  const ourMarkdown = "* # Heading\n  Content";
  const tree2 = processor.parse(ourMarkdown);
  console.log("AST:", JSON.stringify(tree2, null, 2));
  const output2 = processor.stringify(tree2);
  console.log("输出:", JSON.stringify(output2));
  console.log("格式化输出:");
  console.log(output2);
}

test().catch(console.error);
