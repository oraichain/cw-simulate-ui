"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicBackendApi = exports.GasInfo = void 0;
const encoding_1 = require("@cosmjs/encoding");
const bech32_1 = require("bech32");
class GasInfo {
    constructor(cost, externally_used) {
        this.cost = cost;
        this.externally_used = externally_used;
    }
    with_cost(cost) {
        return new GasInfo(cost, 0);
    }
    with_externally_used(externally_used) {
        return new GasInfo(0, externally_used);
    }
    free() {
        return new GasInfo(0, 0);
    }
}
exports.GasInfo = GasInfo;
class BasicBackendApi {
    constructor(bech32_prefix = 'terra') {
        this.bech32_prefix = bech32_prefix;
        // public GAS_COST_CANONICALIZE = 55;
        this.CANONICAL_LENGTH = 54;
        this.EXCESS_PADDING = 6;
    }
    canonical_address(human) {
        if (human.length === 0) {
            throw new Error('Empty human address');
        }
        const normalized = (0, encoding_1.normalizeBech32)(human);
        if (normalized.length < 3) {
            throw new Error(`canonical_address: Address too short: ${normalized}`);
        }
        if (normalized.length > this.CANONICAL_LENGTH) {
            throw new Error(`canonical_address: Address too long: ${normalized}`);
        }
        return (0, encoding_1.fromBech32)(normalized).data;
    }
    human_address(canonical) {
        if (canonical.length === 0) {
            throw new Error('human_address: Empty canonical address');
        }
        if (canonical.length !== this.CANONICAL_LENGTH) {
            throw new Error(`human_address: canonical address length not correct: ${canonical.length}`);
        }
        // Remove excess padding, otherwise bech32.encode will throw "Exceeds length limit"
        // error when normalized is greater than 48 in length.
        const normalized = canonical.length - this.EXCESS_PADDING >= 48
            ? canonical.slice(0, this.CANONICAL_LENGTH - this.EXCESS_PADDING)
            : canonical;
        return bech32_1.bech32.encode(this.bech32_prefix, bech32_1.bech32.toWords(normalized));
    }
}
exports.BasicBackendApi = BasicBackendApi;
//# sourceMappingURL=backendApi.js.map