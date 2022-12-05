export interface IGasInfo {
    cost: number;
    externally_used: number;
    with_cost(cost: number): IGasInfo;
    with_externally_used(externally_used: number): IGasInfo;
    free(): IGasInfo;
}
export declare class GasInfo implements IGasInfo {
    cost: number;
    externally_used: number;
    constructor(cost: number, externally_used: number);
    with_cost(cost: number): IGasInfo;
    with_externally_used(externally_used: number): IGasInfo;
    free(): IGasInfo;
}
export interface IBackendApi {
    bech32_prefix: string;
    canonical_address(human: string): Uint8Array;
    human_address(canonical: Uint8Array): string;
}
export declare class BasicBackendApi implements IBackendApi {
    bech32_prefix: string;
    CANONICAL_LENGTH: number;
    EXCESS_PADDING: number;
    constructor(bech32_prefix?: string);
    canonical_address(human: string): Uint8Array;
    human_address(canonical: Uint8Array): string;
}
