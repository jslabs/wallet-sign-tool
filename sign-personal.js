import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.16.0/+esm";

export async function run({ document, ethereum }, form, sel) {

    const out = (data) =>
        document.querySelector(sel).textContent =
            JSON.stringify(data, null, 2);

    try {

        if (!ethereum?.request) {
            throw new Error("no_wallet");
        }

        let input = form.hash.value;
        if (!input) throw new Error("empty_hash");

        if (!input.startsWith("0x")) {
            input = "0x" + input;
        }

        if (!/^0x[0-9a-fA-F]{64}$/.test(input)) {
            throw new Error("invalid_bytes32_hash");
        }

        const [account] = await ethereum.request({
            method: "eth_requestAccounts"
        });

        const signature = await ethereum.request({
            method: "personal_sign",
            params: [input, account]
        });

        out({
            wallet: account,
            hash: input,
            signature
        });

    } catch (err) {
        out({ error: err.message });
    }
}

export default { run };