#!/usr/bin/env node
import { createServer, build, preview } from "vite";
import { Command } from "commander";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
const pkgRoot = fileURLToPath(new URL("..", import.meta.url));
const appDir = resolve(pkgRoot, "app");
const configFile = resolve(process.cwd(), "wallet-sign-tool.config.js");
if (!existsSync(configFile)) {
    console.error(`Config not found: ${configFile}`);
    process.exit(1);
}
const cfg = {
    root: appDir,
    resolve: {
        alias: {
            [resolve(appDir, "wallet-sign-tool.config.js")]: configFile,
            "@jslabs/wallet-sign-tool": resolve(pkgRoot, "dist/index.js")
        }
    }
};
const program = new Command("wallet-sign-tool");
program
    .command("start")
    .action(async () => {
    const server = await createServer(cfg);
    await server.listen();
    server.printUrls();
});
program
    .command("build")
    .action(async () => {
    await build({ ...cfg, build: { outDir: resolve(process.cwd(), "dist") } });
});
program
    .command("preview")
    .action(async () => {
    const server = await preview({ ...cfg, build: { outDir: resolve(process.cwd(), "dist") } });
    server.printUrls();
});
program.parse();
