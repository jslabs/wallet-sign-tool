import { ethers } from "ethers";

/** @type {import("@jslabs/wallet-sign-tool").Config} */
export default {
    eip191: {
        hooks: {
            hash: (ctx) => ethers.sha256(ethers.toUtf8Bytes(ctx.input))
        },
        output: {
            fields: {
                wallet:    "account",
                hash:      "hash",
                signature: "signature"
            },
            hooks: {
                digestSHA256: (ctx) => btoa(ctx.hash),
                signer:       (ctx) => ethers.verifyMessage(ethers.getBytes(ctx.hash), ctx.signature)
            }
        }
    },
    eip712: {
        hooks: {
            hash: (ctx) => ethers.sha256(ethers.toUtf8Bytes(ctx.input))
        },
        defaults: {
            "schema.types.WalletAttestation.did":      "did:web:sergio.me",
            "schema.types.WalletAttestation.nonce":    () => crypto.randomUUID(),
            "schema.types.WalletAttestation.issuedAt": () => Math.floor(Date.now() / 1000)
        },
        schema: {
            domain: {
                name:    "sergio.me",
                version: "1",
                chainId: 1
            },
            types: {
                EIP712Domain: [
                    { name: "name",    type: "string"  },
                    { name: "version", type: "string"  },
                    { name: "chainId", type: "uint256" }
                ],
                WalletAttestation: [
                    { name: "did",      type: "string"  },
                    { name: "wallet",   type: "address" },
                    { name: "hash",     type: "bytes32" },
                    { name: "nonce",    type: "string"  },
                    { name: "issuedAt", type: "uint256" }
                ]
            },
            primaryType: "WalletAttestation"
        },
        output: {
            fields: {
                did:       "schema.types.WalletAttestation.did",
                wallet:    "account",
                hash:      "hash",
                nonce:     "schema.types.WalletAttestation.nonce",
                issuedAt:  "schema.types.WalletAttestation.issuedAt",
                signature: "signature"
            },
            hooks: {
                digestSHA256: (ctx) => btoa(ctx.hash),
                signer: (ctx) => {
                    const { domain, types, primaryType } = ctx._schema;
                    const { EIP712Domain: _, ...customTypes } = types;
                    return ethers.verifyTypedData(domain, customTypes, ctx.message, ctx.signature);
                }
            }
        }
    }
};
