import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
    root: resolve(process.cwd(), "app"),
    resolve: {
        alias: {
            "@jslabs/wallet-sign-tool": resolve(process.cwd(), "dist/index.js")
        }
    }
});
