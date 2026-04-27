import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.16.0/+esm";

function toBytes32(input, mode) {
    if (mode === "hash") {
        if (typeof input !== "string") {
            throw new Error("Hash input must be a string");
        }

        if (!input.startsWith("0x")) {
            input = "0x" + input;
        }

        if (input.length !== 66) {
            throw new Error(`Invalid bytes32 length: expected 66, got ${input.length}`);
        }

        if (!/^0x[0-9a-fA-F]{64}$/.test(input)) {
            throw new Error("Invalid bytes32: invalid hex");
        }

        return input;
    }

    return ethers.sha256(ethers.toUtf8Bytes(input));
}

export async function run(window, form, sel) {

    const { document, location, ethereum } = window;

    const out = (data) =>
        document.querySelector(sel).textContent = JSON.stringify(data, null, 2);

    try {
        if (!ethereum?.request) {
            return out({ error: "no_wallet" });
        }

        const params = new URLSearchParams(location.search);
        const did = params.get("did") || "did:web:sergio.me";

        const mode = form.mode.value;

        let input;

        if (mode === "message") {
            input = form.message.value;
            if (!input) throw new Error("empty_message");

        } else if (mode === "file") {
            const file = form.file.files[0];
            if (!file) throw new Error("no_file");
            input = await file.text();

        } else if (mode === "hash") {
            input = form.hash.value;
            if (!input) throw new Error("empty_hash");

        } else {
            throw new Error("invalid_mode");
        }

        const [account] = await ethereum.request({
            method: "eth_requestAccounts"
        });

        const nonce = crypto.randomUUID();
        const issuedAt = Math.floor(Date.now() / 1000);

        const profileHash = toBytes32(input, mode);

        const domain = {
            name: "sergio.me",
            version: "1",
            chainId: 1
        };

        const types = {
            WalletAttestation: [
                { name: "did", type: "string" },
                { name: "wallet", type: "address" },
                { name: "profileHash", type: "bytes32" },
                { name: "nonce", type: "string" },
                { name: "issuedAt", type: "uint256" }
            ]
        };

        const message = {
            did,
            wallet: account,
            profileHash,
            nonce,
            issuedAt
        };

        const signature = await ethereum.request({
            method: "eth_signTypedData_v4",
            params: [
                account,
                JSON.stringify({
                    types: {
                        EIP712Domain: [
                            { name: "name", type: "string" },
                            { name: "version", type: "string" },
                            { name: "chainId", type: "uint256" }
                        ],
                        ...types
                    },
                    primaryType: "WalletAttestation",
                    domain,
                    message
                })
            ]
        });

        out({
            did,
            wallet: account,
            profileHash,
            nonce,
            issuedAt,
            signature
        });

    } catch (err) {
        out({ error: err.message });
    }
}

export default { run };