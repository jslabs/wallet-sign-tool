import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import { resolve } from "path";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
    build: {
        lib: {
            entry:    resolve(__dirname, "src/index.ts"),
            fileName: "index",
            formats:  ["es"]
        },
        rollupOptions: {
            external: ["ethers"]
        }
    }
});
