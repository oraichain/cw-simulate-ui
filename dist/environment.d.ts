import { IBackendApi, IIterStorage, IQuerier, IStorage } from './backend';
export interface IEnvironment {
    call_function(name: string, args: object[]): object;
}
export interface GasState {
    gas_limit: number;
    externally_used_gas: number;
}
export interface ContextData {
    gas_state: GasState;
    storage: IStorage;
    storage_readonly: boolean;
    wasmer_instance: any;
}
export declare class Environment {
    storage: IIterStorage;
    querier: IQuerier;
    backendApi: IBackendApi;
    data: ContextData;
    constructor(storage: IIterStorage, querier: IQuerier, backendApi: IBackendApi, data: ContextData);
    call_function(name: string, args?: object[]): object;
    is_storage_readonly(): boolean;
}
