import { remark } from "remark";
import { remarkObsidian } from "@qql2/remark-obsidian";

const markdown = "# File 1\n\nContent from file 1";

async function test() {
  const processor = remark().use(remarkObsidian);
  const ast = processor.parse(markdown);
  await processor.runSync(ast);

  console.log("解析后的 AST:");
  console.log(JSON.stringify(ast, null, 2));
  console.log("\nchildren 数量:", ast.children?.length);
  if (ast.children) {
    console.log("children 类型:", ast.children.map(c => c.type));
  }
}

test().catch(console.error);

