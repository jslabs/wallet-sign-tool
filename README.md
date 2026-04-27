# @jslabs/wallet-sign-tool

A browser-based EIP-191 and EIP-712 wallet signing tool. Spin up a local signing UI driven entirely by a config file you own.

## Requirements

- Node.js 20+
- A browser with MetaMask (or any EIP-1193 compatible wallet)

## Config file

Create `wallet-sign-tool.config.js` in your project root — plain ES module:

```js
import { ethers } from "ethers";

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
            "schema.types.MyType.nonce":    () => crypto.randomUUID(),
            "schema.types.MyType.issuedAt": () => Math.floor(Date.now() / 1000)
        },
        schema: {
            domain: { name: "example.com", version: "1", chainId: 1, verifyingContract: "0xYourContractAddress" },
            types: {
                EIP712Domain: [
                    { name: "name",              type: "string"  },
                    { name: "version",           type: "string"  },
                    { name: "chainId",           type: "uint256" },
                    { name: "verifyingContract", type: "address" }
                ],
                MyType: [
                    { name: "wallet",   type: "address" },
                    { name: "hash",     type: "bytes32" },
                    { name: "nonce",    type: "string"  },
                    { name: "issuedAt", type: "uint256" }
                ]
            },
            primaryType: "MyType"
        },
        output: {
            fields: {
                wallet:    "account",
                hash:      "hash",
                nonce:     "schema.types.MyType.nonce",
                issuedAt:  "schema.types.MyType.issuedAt",
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
```

## Config reference

### Top level

| Key | Type | Description |
|-----|------|-------------|
| `eip191` | `EIPConfig` | EIP-191 `personal_sign` config |
| `eip712` | `EIP712Config` | EIP-712 typed data config |

### `EIPConfig`

| Key | Type | Description |
|-----|------|-------------|
| `hooks` | `Record<string, Hook>` | Pre-signing hooks. A `hash` hook is required — its result is passed to the wallet. |
| `output` | `OutputConfig` | What to display after signing |

### `EIP712Config` (extends `EIPConfig`)

| Key | Type | Description |
|-----|------|-------------|
| `defaults` | `Record<string, Default>` | Dot-path default values for schema type fields. Use `() => value` for dynamic values. |
| `schema` | `EIP712Schema` | EIP-712 domain, types, and `primaryType` |

### `OutputConfig`

| Key | Type | Description |
|-----|------|-------------|
| `fields` | `Record<string, string>` | Output label → context dot-path. Dot-paths resolve against the signing context (see below). |
| `hooks` | `Record<string, Hook>` | Post-signing computed values, added to output alongside `fields` |

### Hook context (`ctx`)

A `Hook` is `(ctx) => string | number | boolean`.

**Available after pre-signing hooks run:**

| Key | Description |
|-----|-------------|
| `ctx.input` | Raw text input or file contents |
| `ctx.<hookName>` | Result of each pre-signing hook (e.g. `ctx.hash`) |

**Available in output hooks and fields (post-signing):**

| Key | Description |
|-----|-------------|
| `ctx.account` | Connected wallet address |
| `ctx.signature` | The wallet signature |
| `ctx.message` | *(EIP-712 only)* Resolved typed data message object |
| `ctx._schema` | *(EIP-712 only)* Full schema with defaults applied |

Dot-paths in `output.fields` and `defaults` resolve nested objects using `.` as separator (e.g. `"schema.types.MyType.nonce"`).

## Usage — standalone CLI

No code required. Add a `wallet-sign-tool.config.js` to your project root and run:

```sh
npm install @jslabs/wallet-sign-tool
npx wallet-sign-tool start
```

Or add to your `package.json`:

```json
"scripts": { "start": "wallet-sign-tool start" }
```

Then `npm start`.

## Usage — library (React, Vue, etc.)

Install:

```sh
npm install @jslabs/wallet-sign-tool
```

Import and wire up to your own UI:

```ts
import { createSigner } from "@jslabs/wallet-sign-tool";
import type { Config } from "@jslabs/wallet-sign-tool";

const config: Config = {
    eip191: { hooks: { hash: ... }, output: { fields: {}, hooks: {} } },
    eip712: { hooks: { hash: ... }, defaults: {}, schema: { ... }, output: { fields: {}, hooks: {} } }
};

const { run } = createSigner(config);

// EIP-191 with a text message
const result = await run(window.ethereum, {
    eip:     "eip191",
    mode:    "message",
    message: "hello world"
});

// EIP-712 with a file
const result = await run(window.ethereum, {
    eip:  "eip712",
    mode: "file",
    file: fileInputElement.files[0]
});

// result is a plain object — render it however you like
console.log(result);
```

`run(ethereum, input)` requests the wallet signature and returns a plain object. Errors throw so you can handle them with try/catch.

| `RunInput` field | Type | Description |
|---|---|---|
| `eip` | `string` | `"eip191"` or `"eip712"` (or any key in your config) |
| `mode` | `"message" \| "file"` | Input source |
| `message` | `string?` | Required when `mode` is `"message"` |
| `file` | `File?` | Required when `mode` is `"file"` |

## License

MIT
