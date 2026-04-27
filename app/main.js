import config from "./wallet-sign-tool.config.js";
import { createSigner } from "@jslabs/wallet-sign-tool";

const { run } = createSigner(config);
const out = document.querySelector("#out");

document.getElementById("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
        const result = await run(window.ethereum, {
            eip:     form.eip.value,
            mode:    form.mode.value,
            message: form.message.value,
            file:    form.file.files?.[0]
        });
        out.textContent = JSON.stringify(result, null, 2);
    } catch (err) {
        out.textContent = JSON.stringify({ error: err.message }, null, 2);
    }
});
