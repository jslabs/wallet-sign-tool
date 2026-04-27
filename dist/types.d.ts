export type Scalar = string | number | boolean;
export type Default = Scalar | (() => Scalar);
export type Hook = (ctx: Ctx) => Scalar;
export type Thunk = () => Scalar;
export type Dict = Record<string, unknown>;
export type Ctx = {
    input: string;
} & Dict;
export interface EIP712TypeField {
    name: string;
    type: string;
}
export interface EIP712Schema {
    domain: {
        name: string;
        version: string;
        chainId: number;
    };
    types: Record<string, EIP712TypeField[]>;
    primaryType: string;
}
export interface OutputConfig {
    fields: Record<string, string>;
    hooks: Record<string, Hook>;
}
export interface EIPConfig {
    hooks: Record<string, Hook>;
    output: OutputConfig;
}
export interface EIP712Config extends EIPConfig {
    defaults: Record<string, Default>;
    schema: EIP712Schema;
}
export interface Config {
    eip191: EIPConfig;
    eip712: EIP712Config;
    [key: string]: EIPConfig | EIP712Config;
}
export interface EthereumProvider {
    request(args: {
        method: "eth_requestAccounts";
    }): Promise<string[]>;
    request(args: {
        method: "personal_sign";
        params: [string, string];
    }): Promise<string>;
    request(args: {
        method: "eth_signTypedData_v4";
        params: [string, string];
    }): Promise<string>;
}
export interface SignArgs {
    ethereum: EthereumProvider;
    account: string;
    hash: string;
    input: string;
}
export interface RunInput {
    eip: string;
    mode: "message" | "file";
    message?: string;
    file?: File;
}
export interface SignForm extends HTMLFormElement {
    eip: HTMLInputElement;
    mode: HTMLInputElement;
    message: HTMLTextAreaElement;
    file: HTMLInputElement;
}
