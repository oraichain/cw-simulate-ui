"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Environment = void 0;
class Environment {
    constructor(storage, querier, backendApi, data) {
        this.storage = storage;
        this.querier = querier;
        this.backendApi = backendApi;
        this.data = data;
        this.call_function = this.call_function.bind(this);
    }
    call_function(name, args = []) {
        if (name.length === 0) {
            throw new Error('Empty function name');
        }
        if (args.length === 0) {
            console.log('No arguments passed');
        }
        return {};
    }
    is_storage_readonly() {
        return this.data.storage_readonly;
    }
}
exports.Environment = Environment;
//# sourceMappingURL=environment.js.map