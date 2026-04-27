import type { Dict, Config, RunInput, EthereumProvider } from "./types";
export declare function createSigner(config: Config): {
    run(ethereum: EthereumProvider, input: RunInput): Promise<Dict>;
};
