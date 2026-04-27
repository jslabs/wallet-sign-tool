import config from "./config.js";

function applyHooks(hooks, ctx) {
    for (const [key, fn] of Object.entries(hooks)) {
        ctx[key] = fn(ctx);
    }
}

function resolveDefault(value) {
    return typeof value === "function" ? value() : value;
}

async function readInput(form, mode) {
    if (mode === "message") {
        const input = form.message.value;
        if (!input) throw new Error("empty_message");
        return input;
    }
    if (mode === "file") {
        const file = form.file.files[0];
        if (!file) throw new Error("no_file");
        return file.text();
    }
    throw new Error("invalid_mode");
}

function buildOutput(outputConfig, ctx) {
    const result = {};
    const { fields = {}, hooks = {} } = outputConfig;
    for (const [outputKey, sourceRef] of Object.entries(fields)) {
        const ctxKey = sourceRef.split(".").at(-1);
        result[outputKey] = ctx[ctxKey];
    }
    for (const [outputKey, fn] of Object.entries(hooks)) {
        result[outputKey] = fn(ctx);
    }
    return result;
}

async function signEIP191(ethereum, account, hash, input, cfg) {
    const signature = await ethereum.request({
        method: "personal_sign",
        params: [hash, account]
    });
    const ctx = { account, hash, input, signature };
    return buildOutput(cfg.output, ctx);
}

async function signEIP712(ethereum, account, hash, input, cfg) {
    const { schema, defaults, output } = cfg;
    const { domain, types, primaryType } = schema;

    const resolved = {};
    for (const [path, value] of Object.entries(defaults)) {
        const key = path.split(".").at(-1);
        resolved[key] = resolveDefault(value);
    }

    const message = { ...resolved, wallet: account, hash };

    const signature = await ethereum.request({
        method: "eth_signTypedData_v4",
        params: [account, JSON.stringify({ types, primaryType, domain, message })]
    });

    const ctx = { ...resolved, account, hash, input, message, signature, _schema: schema };
    return buildOutput(output, ctx);
}

export async function run(window, form, sel) {
    const { document, ethereum } = window;

    const out = (data) =>
        document.querySelector(sel).textContent = JSON.stringify(data, null, 2);

    try {
        if (!ethereum?.request) {
            return out({ error: "no_wallet" });
        }

        const eip  = form.eip.value;
        const mode = form.mode.value;
        const cfg  = config[eip];

        const input = await readInput(form, mode);

        const ctx = { input };
        applyHooks(cfg.hooks, ctx);
        const hash = ctx.hash;

        const [account] = await ethereum.request({ method: "eth_requestAccounts" });

        let result;
        if (eip === "eip191") {
            result = await signEIP191(ethereum, account, hash, input, cfg);
        } else if (eip === "eip712") {
            result = await signEIP712(ethereum, account, hash, input, cfg);
        } else {
            throw new Error("invalid_eip");
        }

        out(result);

    } catch (err) {
        out({ error: err.message });
    }
}

export default { run };
