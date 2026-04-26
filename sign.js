import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.16.0/+esm";

export async function run({ document, ethereum }, form, sel) {

    const out = (data) =>
        document.querySelector(sel).textContent =
            JSON.stringify(data, null, 2);

    if (!ethereum?.request) {
        return out({ error: "no_wallet" });
    }

    const mode = form.mode.value;

    let input;

    if (mode === "message") {
        input = form.message.value;
        if (!input) return out({ error: "empty_message" });

    } else if (mode === "file") {
        const file = form.file.files[0];
        if (!file) return out({ error: "no_file" });

        input = await file.text();

    } else {
        return out({ error: "invalid_mode" });
    }

    const nonce = crypto.randomUUID();

    const payload = {
        input,
        nonce
    };

    const message = JSON.stringify(payload);

    const messageHash = ethers.sha256(
        ethers.toUtf8Bytes(message)
    );

    const [account] = await ethereum.request({
        method: "eth_requestAccounts"
    });

    const signature = await ethereum.request({
        method: "personal_sign",
        params: [messageHash, account]
    });

    const result = {
        mode,
        account,
        message,
        messageHash,
        signature,
        nonce
    };

    const res = await fetch("/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result)
    });

    const verification = await res.json();

    out({
        attestation: result,
        verification
    });
}

export default { run };
