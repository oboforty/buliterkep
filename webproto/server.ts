import * as esbuild from "npm:esbuild";
import { serveDir } from "https://deno.land/std/http/file_server.ts";
import { copy } from "https://deno.land/std/fs/mod.ts";
import { ensureDir } from "https://deno.land/std/fs/ensure_dir.ts";

// copy static files
await ensureDir("dist");
await copy("static", "dist", { overwrite: true });
await copy("static/templates/index.html", "dist/index.html", { overwrite: true });


const ctx = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: "dist/main.js",
  platform: "browser",
  format: "esm",
  sourcemap: true,
});
await ctx.watch();

Deno.serve((req) =>
  serveDir(req, {
    fsRoot: "dist",
    showDirListing: false,
  })
);

console.log("dev server running on http://localhost:8000");
