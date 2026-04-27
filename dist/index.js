function h(t, e) {
  for (const [n, o] of Object.entries(t))
    e[n] = o(e);
}
function E(t) {
  return typeof t == "function" ? t() : t;
}
async function k(t) {
  if (t.mode === "message") {
    if (!t.message) throw new Error("empty_message");
    return t.message;
  }
  if (t.mode === "file") {
    if (!t.file) throw new Error("no_file");
    return t.file.text();
  }
  throw new Error("invalid_mode");
}
function l(t, e) {
  const n = {}, { fields: o = {}, hooks: r = {} } = t;
  for (const [s, i] of Object.entries(o)) {
    const c = i.split(".").at(-1);
    n[s] = e[c];
  }
  for (const [s, i] of Object.entries(r))
    n[s] = i(e);
  return n;
}
async function O({ ethereum: t, account: e, hash: n, input: o }, r) {
  const s = await t.request({
    method: "personal_sign",
    params: [n, e]
  }), i = { input: o, account: e, hash: n, signature: s };
  return l(r.output, i);
}
async function b({ ethereum: t, account: e, hash: n, input: o }, r) {
  const { schema: s, defaults: i, output: c } = r, { domain: f, types: a, primaryType: w } = s, u = {};
  for (const [g, m] of Object.entries(i)) {
    const _ = g.split(".").at(-1);
    u[_] = E(m);
  }
  const p = { ...u, wallet: e, hash: n }, y = await t.request({
    method: "eth_signTypedData_v4",
    params: [e, JSON.stringify({ types: a, primaryType: w, domain: f, message: p })]
  }), d = { ...u, input: o, account: e, hash: n, message: p, signature: y, _schema: s };
  return l(c, d);
}
function q(t) {
  return {
    async run(e, n) {
      if (!(e != null && e.request)) throw new Error("no_wallet");
      const o = n.eip, r = t[o];
      if (!r) throw new Error(`unknown_eip: ${o}`);
      const s = await k(n), i = { input: s };
      h(r.hooks, i);
      const c = i.hash, [f] = await e.request({ method: "eth_requestAccounts" }), a = { ethereum: e, account: f, hash: c, input: s };
      if (o === "eip191") return O(a, r);
      if (o === "eip712") return b(a, r);
      throw new Error("invalid_eip");
    }
  };
}
export {
  q as createSigner
};
