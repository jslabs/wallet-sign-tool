import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.16.0/+esm";

export async function run({ document, ethereum }, form, sel) {

    const out = (data) =>
        document.querySelector(sel).textContent =
            JSON.stringify(data, null, 2);

    try {

        if (!ethereum?.request) {
            throw new Error("no_wallet");
        }

        const input = form.hash.value;

        if (!input) throw new Error("empty_hash");

        let hash = input;

        if (!hash.startsWith("0x")) {
            hash = "0x" + hash;
        }

        if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) {
            throw new Error("invalid_bytes32_hash");
        }

        const [account] = await ethereum.request({
            method: "eth_requestAccounts"
        });

        const signature = await ethereum.request({
            method: "personal_sign",
            params: [hash, account]
        });

        out({
            wallet: account,
            hash,
            signature,
            digestSHA256: btoa(input),
        });

    } catch (err) {
        out({ error: err.message });
    }
}

export default { run };