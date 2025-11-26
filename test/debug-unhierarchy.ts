import { remark } from "remark";
import { toHierarchy, unHierarchy } from "hierarchy-mdast";

const markdown = "# Heading 1\n\n## Heading 2\n\nContent paragraph";

const processor = remark();
const ast = processor.parse(markdown);

console.log("原始 AST children:");
console.log(ast.children.map(c => c.type));

const hierarchy = toHierarchy(ast);
console.log("\nHierarchy children:");
console.log(hierarchy.children?.map(c => c.type));

const restored = unHierarchy(hierarchy);
console.log("\n还原后 AST children:");
console.log(restored.children?.map(c => c.type));

