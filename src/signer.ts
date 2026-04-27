import type { Ctx, Dict, Thunk, EIPConfig, EIP712Config, Config, SignArgs, RunInput, EthereumProvider } from "./types";

function applyHooks(hooks: Record<string, (ctx: Ctx) => unknown>, ctx: Ctx): void {
    for (const [key, fn] of Object.entries(hooks)) {
        (ctx as Record<string, unknown>)[key] = fn(ctx);
    }
}

function resolveDefault(value: unknown): unknown {
    return typeof value === "function" ? (value as Thunk)() : value;
}

async function readInput(input: RunInput): Promise<string> {
    if (input.mode === "message") {
        if (!input.message) throw new Error("empty_message");
        return input.message;
    }
    if (input.mode === "file") {
        if (!input.file) throw new Error("no_file");
        return input.file.text();
    }
    throw new Error("invalid_mode");
}

function buildOutput(outputConfig: EIPConfig["output"], ctx: Ctx): Dict {
    const result: Dict = {};
    const { fields = {}, hooks = {} } = outputConfig;
    for (const [outputKey, sourceRef] of Object.entries(fields)) {
        const ctxKey = sourceRef.split(".").at(-1)!;
        result[outputKey] = (ctx as Record<string, unknown>)[ctxKey];
    }
    for (const [outputKey, fn] of Object.entries(hooks)) {
        result[outputKey] = fn(ctx);
    }
    return result;
}

async function signEIP191({ ethereum, account, hash, input }: SignArgs, cfg: EIPConfig): Promise<Dict> {
    const signature = await ethereum.request({
        method: "personal_sign",
        params: [hash, account]
    }) as string;
    const ctx: Ctx = { input, account, hash, signature };
    return buildOutput(cfg.output, ctx);
}

async function signEIP712({ ethereum, account, hash, input }: SignArgs, cfg: EIP712Config): Promise<Dict> {
    const { schema, defaults, output } = cfg;
    const { domain, types, primaryType } = schema;

    const resolved: Dict = {};
    for (const [path, value] of Object.entries(defaults)) {
        const key = path.split(".").at(-1)!;
        resolved[key] = resolveDefault(value);
    }

    const message: Dict = { ...resolved, wallet: account, hash };

    const signature = await ethereum.request({
        method: "eth_signTypedData_v4",
        params: [account, JSON.stringify({ types, primaryType, domain, message })]
    }) as string;

    const ctx: Ctx = { ...resolved, input, account, hash, message, signature, _schema: schema };
    return buildOutput(output, ctx);
}

export function createSigner(config: Config) {
    return {
        async run(ethereum: EthereumProvider, input: RunInput): Promise<Dict> {
            if (!ethereum?.request) throw new Error("no_wallet");

            const eip = input.eip;
            const cfg = config[eip];
            if (!cfg) throw new Error(`unknown_eip: ${eip}`);

            const rawInput = await readInput(input);

            const ctx: Ctx = { input: rawInput };
            applyHooks(cfg.hooks, ctx);
            const hash = ctx.hash as string;

            const [account] = await ethereum.request({ method: "eth_requestAccounts" });

            const args: SignArgs = { ethereum, account, hash, input: rawInput };

            if (eip === "eip191") return signEIP191(args, cfg);
            if (eip === "eip712") return signEIP712(args, cfg as EIP712Config);
            throw new Error("invalid_eip");
        }
    };
}
