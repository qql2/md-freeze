import dts from "rollup-plugin-dts";

export default {
  input: "src/index.ts",
  output: {
    file: "main.d.ts",
    format: "es",
  },
  external: ["unified", "unist-util-visit", "unist", "remark"],
  plugins: [dts()],
};
