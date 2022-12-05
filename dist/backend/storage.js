"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicKVIterStorage = exports.BasicKVStorage = exports.Order = exports.Record = void 0;
const encoding_1 = require("@cosmjs/encoding");
const byte_array_1 = require("../helpers/byte-array");
const immutable_1 = __importDefault(require("immutable"));
const instance_1 = require("../instance");
class Record {
    constructor() {
        this.key = Uint8Array.from([]);
        this.value = Uint8Array.from([]);
    }
}
exports.Record = Record;
var Order;
(function (Order) {
    Order[Order["Ascending"] = 1] = "Ascending";
    Order[Order["Descending"] = 2] = "Descending";
})(Order = exports.Order || (exports.Order = {}));
class BasicKVStorage {
    // TODO: Add binary uint / typed Addr maps for cw-storage-plus compatibility
    constructor(dict = immutable_1.default.Map()) {
        this.dict = dict;
    }
    *keys() {
        for (const key of this.dict.keys()) {
            yield (0, encoding_1.fromBase64)(key);
        }
    }
    get(key) {
        const keyStr = (0, encoding_1.toBase64)(key);
        const value = this.dict.get(keyStr);
        if (value === undefined) {
            return null;
        }
        return (0, encoding_1.fromBase64)(value);
    }
    set(key, value) {
        const keyStr = (0, encoding_1.toBase64)(key);
        this.dict = this.dict.set(keyStr, (0, encoding_1.toBase64)(value));
    }
    remove(key) {
        if (key.length > instance_1.MAX_LENGTH_DB_KEY) {
            throw new Error(`Key length ${key.length} exceeds maximum length ${instance_1.MAX_LENGTH_DB_KEY}.`);
        }
        this.dict = this.dict.remove((0, encoding_1.toBase64)(key));
    }
}
exports.BasicKVStorage = BasicKVStorage;
class BasicKVIterStorage extends BasicKVStorage {
    constructor(dict = immutable_1.default.Map(), iterators = new Map()) {
        super(dict);
        this.dict = dict;
        this.iterators = iterators;
    }
    all(iterator_id) {
        const out = [];
        let condition = true;
        while (condition) {
            const record = this.next(iterator_id);
            if (record === null) {
                condition = false;
            }
            else {
                out.push(record);
            }
        }
        return out;
    }
    // Get next element of iterator with ID `iterator_id`.
    // Creates a region containing both key and value and returns its address.
    // Ownership of the result region is transferred to the contract.
    // The KV region uses the format value || valuelen || key || keylen, where valuelen and keylen are fixed-size big-endian u32 values.
    // An empty key (i.e. KV region ends with \0\0\0\0) means no more element, no matter what the value is.
    next(iterator_id) {
        const iter = this.iterators.get((0, byte_array_1.toNumber)(iterator_id));
        if (iter === undefined) {
            throw new Error(`Iterator not found.`);
        }
        const record = iter.data[iter.position];
        if (!record) {
            return null;
        }
        iter.position += 1;
        return record;
    }
    scan(start, end, order) {
        if (!(order in Order)) {
            throw new Error(`Invalid order value ${order}.`);
        }
        const newId = this.iterators.size + 1;
        // if start > end, this represents an empty range
        if ((start === null || start === void 0 ? void 0 : start.length) && (end === null || end === void 0 ? void 0 : end.length) && (0, byte_array_1.compare)(start, end) === 1) {
            this.iterators.set(newId, { data: [], position: 0 });
            return (0, byte_array_1.toByteArray)(newId);
        }
        let data = [];
        for (const key of Array.from(this.dict.keys()).sort()) {
            if ((start === null || start === void 0 ? void 0 : start.length) && (0, byte_array_1.compare)(start, (0, encoding_1.fromBase64)(key)) === 1)
                continue;
            if ((end === null || end === void 0 ? void 0 : end.length) && (0, byte_array_1.compare)((0, encoding_1.fromBase64)(key), end) > -1)
                break;
            data.push({ key: (0, encoding_1.fromBase64)(key), value: this.get((0, encoding_1.fromBase64)(key)) });
        }
        if (order === Order.Descending) {
            data = data.reverse();
        }
        this.iterators.set(newId, { data, position: 0 });
        return (0, byte_array_1.toByteArray)(newId);
    }
}
exports.BasicKVIterStorage = BasicKVIterStorage;
//# sourceMappingURL=storage.js.map