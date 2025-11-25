import esbuild from "esbuild";
import process from "process";
  
const prod = (process.argv[2] === "production");
  
const context = await esbuild.context({
    entryPoints: ['src/projectName.ts'],
    outfile: 'main.js',
    external: [],
    bundle: true,
    sourcemap: prod ? false : "inline",
    minify: prod ? true : false,
    treeShaking: true,
    format: "cjs",
    platform: 'browser',
    logLevel: 'info',
});
  
if (prod) {
    await context.rebuild();
    process.exit(0);
} else {
    await context.watch();
}
