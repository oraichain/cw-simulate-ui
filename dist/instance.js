"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VMInstance = exports.EDDSA_PUBKEY_LEN = exports.MAX_LENGTH_ED25519_MESSAGE = exports.MAX_LENGTH_ED25519_SIGNATURE = exports.MAX_LENGTH_HUMAN_ADDRESS = exports.MAX_LENGTH_CANONICAL_ADDRESS = exports.MAX_LENGTH_DB_VALUE = exports.MAX_LENGTH_DB_KEY = void 0;
/*eslint-disable prefer-const */
const bech32_1 = require("bech32");
const memory_1 = require("./memory");
const secp256k1_1 = require("secp256k1");
const byte_array_1 = require("./helpers/byte-array");
exports.MAX_LENGTH_DB_KEY = 64 * 1024;
exports.MAX_LENGTH_DB_VALUE = 128 * 1024;
exports.MAX_LENGTH_CANONICAL_ADDRESS = 64;
exports.MAX_LENGTH_HUMAN_ADDRESS = 256;
exports.MAX_LENGTH_ED25519_SIGNATURE = 64;
exports.MAX_LENGTH_ED25519_MESSAGE = 128 * 1024;
exports.EDDSA_PUBKEY_LEN = 32;
class VMInstance {
    constructor(backend, gasLimit) {
        this.backend = backend;
        this.gasLimit = gasLimit;
        this.debugMsgs = [];
        this.bech32 = bech32_1.bech32;
    }
    build(wasmByteCode) {
        return __awaiter(this, void 0, void 0, function* () {
            let imports = {
                env: {
                    db_read: this.db_read.bind(this),
                    db_write: this.db_write.bind(this),
                    db_remove: this.db_remove.bind(this),
                    db_scan: this.db_scan.bind(this),
                    db_next: this.db_next.bind(this),
                    addr_humanize: this.addr_humanize.bind(this),
                    addr_canonicalize: this.addr_canonicalize.bind(this),
                    addr_validate: this.addr_validate.bind(this),
                    secp256k1_verify: this.secp256k1_verify.bind(this),
                    secp256k1_recover_pubkey: this.secp256k1_recover_pubkey.bind(this),
                    ed25519_verify: this.ed25519_verify.bind(this),
                    ed25519_batch_verify: this.ed25519_batch_verify.bind(this),
                    curve_hash: this.curve_hash.bind(this),
                    poseidon_hash: this.poseidon_hash.bind(this),
                    groth16_verify: this.groth16_verify.bind(this),
                    debug: this.debug.bind(this),
                    query_chain: this.query_chain.bind(this),
                    abort: this.abort.bind(this),
                },
            };
            const result = yield WebAssembly.instantiate(wasmByteCode, imports);
            this.instance = result.instance;
        });
    }
    get exports() {
        if (!this.instance)
            throw new Error('Please init instance before using methods');
        return this.instance.exports;
    }
    get remainingGas() {
        return this.gasLimit; // TODO: implement
    }
    allocate(size) {
        let { allocate, memory } = this.exports;
        let regPtr = allocate(size);
        return new memory_1.Region(memory, regPtr);
    }
    deallocate(region) {
        let { deallocate } = this.exports;
        deallocate(region.ptr);
    }
    allocate_bytes(bytes) {
        let region = this.allocate(bytes.length);
        region.write(bytes);
        return region;
    }
    allocate_b64(b64) {
        let bytes = Buffer.from(b64, 'base64');
        return this.allocate_bytes(bytes);
    }
    allocate_str(str) {
        let region = this.allocate(str.length);
        region.write_str(str);
        return region;
    }
    allocate_json(obj) {
        let region = this.allocate(JSON.stringify(obj).length);
        region.write_json(obj);
        return region;
    }
    instantiate(env, info, msg) {
        let { instantiate } = this.exports;
        let args = [env, info, msg].map((x) => this.allocate_json(x).ptr);
        let result = instantiate(...args);
        return this.region(result);
    }
    execute(env, info, msg) {
        let { execute } = this.exports;
        let args = [env, info, msg].map((x) => this.allocate_json(x).ptr);
        let result = execute(...args);
        return this.region(result);
    }
    query(env, msg) {
        let { query } = this.exports;
        let args = [env, msg].map((x) => this.allocate_json(x).ptr);
        let result = query(...args);
        return this.region(result);
    }
    migrate(env, msg) {
        let { migrate } = this.exports;
        let args = [env, msg].map((x) => this.allocate_json(x).ptr);
        let result = migrate(...args);
        return this.region(result);
    }
    reply(env, msg) {
        let { reply } = this.exports;
        let args = [env, msg].map((x) => this.allocate_json(x).ptr);
        let result = reply(...args);
        return this.region(result);
    }
    db_read(key_ptr) {
        let key = this.region(key_ptr);
        return this.do_db_read(key).ptr;
    }
    db_write(key_ptr, value_ptr) {
        let key = this.region(key_ptr);
        let value = this.region(value_ptr);
        this.do_db_write(key, value);
    }
    db_remove(key_ptr) {
        let key = this.region(key_ptr);
        this.do_db_remove(key);
    }
    db_scan(start_ptr, end_ptr, order) {
        let start = this.region(start_ptr);
        let end = this.region(end_ptr);
        return this.do_db_scan(start, end, order).ptr;
    }
    db_next(iterator_id_ptr) {
        let iterator_id = this.region(iterator_id_ptr);
        return this.do_db_next(iterator_id).ptr;
    }
    addr_canonicalize(source_ptr, destination_ptr) {
        let source = this.region(source_ptr);
        let destination = this.region(destination_ptr);
        return this.do_addr_canonicalize(source, destination).ptr;
    }
    addr_humanize(source_ptr, destination_ptr) {
        let source = this.region(source_ptr);
        let destination = this.region(destination_ptr);
        return this.do_addr_humanize(source, destination).ptr;
    }
    addr_validate(source_ptr) {
        let source = this.region(source_ptr);
        return this.do_addr_validate(source).ptr;
    }
    secp256k1_verify(hash_ptr, signature_ptr, pubkey_ptr) {
        let hash = this.region(hash_ptr);
        let signature = this.region(signature_ptr);
        let pubkey = this.region(pubkey_ptr);
        return this.do_secp256k1_verify(hash, signature, pubkey);
    }
    secp256k1_recover_pubkey(hash_ptr, signature_ptr, recover_param) {
        let hash = this.region(hash_ptr);
        let signature = this.region(signature_ptr);
        return BigInt(this.do_secp256k1_recover_pubkey(hash, signature, recover_param).ptr);
    }
    ed25519_verify(message_ptr, signature_ptr, pubkey_ptr) {
        let message = this.region(message_ptr);
        let signature = this.region(signature_ptr);
        let pubkey = this.region(pubkey_ptr);
        return this.do_ed25519_verify(message, signature, pubkey);
    }
    ed25519_batch_verify(messages_ptr, signatures_ptr, public_keys_ptr) {
        let messages = this.region(messages_ptr);
        let signatures = this.region(signatures_ptr);
        let public_keys = this.region(public_keys_ptr);
        return this.do_ed25519_batch_verify(messages, signatures, public_keys);
    }
    curve_hash(input_ptr, destination_ptr) {
        let input = this.region(input_ptr);
        let destination = this.region(destination_ptr);
        return this.do_curve_hash(input, destination).ptr;
    }
    poseidon_hash(inputs_ptr, destination_ptr) {
        let inputs = this.region(inputs_ptr);
        let destination = this.region(destination_ptr);
        return this.do_poseidon_hash(inputs, destination).ptr;
    }
    groth16_verify(input_ptr, public_ptr, vk_ptr) {
        let input = this.region(input_ptr);
        let proof = this.region(public_ptr);
        let vk = this.region(vk_ptr);
        return this.do_groth16_verify(input, proof, vk);
    }
    debug(message_ptr) {
        let message = this.region(message_ptr);
        this.do_debug(message);
    }
    query_chain(request_ptr) {
        let request = this.region(request_ptr);
        return this.do_query_chain(request).ptr;
    }
    abort(message_ptr) {
        let message = this.region(message_ptr);
        this.do_abort(message);
    }
    region(ptr) {
        return new memory_1.Region(this.exports.memory, ptr);
    }
    do_db_read(key) {
        let value = this.backend.storage.get(key.data);
        if (key.str.length > exports.MAX_LENGTH_DB_KEY) {
            throw new Error(`Key length ${key.str.length} exceeds maximum length ${exports.MAX_LENGTH_DB_KEY}`);
        }
        if (value === null) {
            console.warn(`db_read: key not found: ${key.str}`);
            return this.region(0);
        }
        return this.allocate_bytes(value);
    }
    do_db_write(key, value) {
        if (value.str.length > exports.MAX_LENGTH_DB_VALUE) {
            throw new Error(`db_write: value too large: ${value.str}`);
        }
        // throw error for large keys
        if (key.str.length > exports.MAX_LENGTH_DB_KEY) {
            throw new Error(`db_write: key too large: ${key.str}`);
        }
        this.backend.storage.set(key.data, value.data);
    }
    do_db_remove(key) {
        this.backend.storage.remove(key.data);
    }
    do_db_scan(start, end, order) {
        const iteratorId = this.backend.storage.scan(start.data, end.data, order);
        let region = this.allocate(iteratorId.length);
        region.write(iteratorId);
        return region;
    }
    do_db_next(iterator_id) {
        const record = this.backend.storage.next(iterator_id.data);
        if (record === null) {
            return this.allocate_bytes(Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0]));
        }
        return this.allocate_bytes(new Uint8Array([
            ...record.key,
            ...(0, byte_array_1.toByteArray)(record.key.length, 4),
            ...record.value,
            ...(0, byte_array_1.toByteArray)(record.value.length, 4),
        ]));
    }
    do_addr_humanize(source, destination) {
        if (source.str.length === 0) {
            throw new Error('Empty address.');
        }
        let result = this.backend.backend_api.human_address(source.data);
        destination.write_str(result);
        // TODO: add error handling; -- 0 = success, anything else is a pointer to an error message
        return new memory_1.Region(this.exports.memory, 0);
    }
    do_addr_canonicalize(source, destination) {
        let source_data = source.str;
        if (source_data.length === 0) {
            throw new Error('Empty address.');
        }
        let result = this.backend.backend_api.canonical_address(source_data);
        destination.write(result);
        return new memory_1.Region(this.exports.memory, 0);
    }
    do_addr_validate(source) {
        if (source.str.length === 0) {
            throw new Error('Empty address.');
        }
        if (source.str.length > exports.MAX_LENGTH_HUMAN_ADDRESS) {
            throw new Error(`Address too large: ${source.str}`);
        }
        const canonical = this.bech32.fromWords(this.bech32.decode(source.str).words);
        if (canonical.length === 0) {
            throw new Error('Invalid address.');
        }
        const human = this.bech32.encode(this.backend.backend_api.bech32_prefix, this.bech32.toWords(canonical));
        if (human !== source.str) {
            throw new Error('Invalid address.');
        }
        return new memory_1.Region(this.exports.memory, 0);
    }
    // Verifies message hashes against a signature with a public key, using the secp256k1 ECDSA parametrization.
    // Returns 0 on verification success, 1 on verification failure
    do_secp256k1_verify(hash, signature, pubkey) {
        const isValidSignature = (0, secp256k1_1.ecdsaVerify)(signature.data, hash.data, pubkey.data);
        if (isValidSignature) {
            return 0;
        }
        else {
            return 1;
        }
    }
    do_secp256k1_recover_pubkey(msgHash, signature, recover_param) {
        const pub = (0, secp256k1_1.ecdsaRecover)(signature.data, recover_param, msgHash.data, false);
        return this.allocate_bytes(pub);
    }
    // Verifies a message against a signature with a public key, using the ed25519 EdDSA scheme.
    // Returns 0 on verification success, 1 on verification failure
    do_ed25519_verify(message, signature, pubkey) {
        if (message.length > exports.MAX_LENGTH_ED25519_MESSAGE)
            return 1;
        if (signature.length > exports.MAX_LENGTH_ED25519_SIGNATURE)
            return 1;
        if (pubkey.length > exports.EDDSA_PUBKEY_LEN)
            return 1;
        const sig = Buffer.from(signature.data).toString('hex');
        const pub = Buffer.from(pubkey.data).toString('hex');
        const msg = Buffer.from(message.data).toString('hex');
        const _signature = global.eddsa().makeSignature(sig);
        const _pubkey = global.eddsa().keyFromPublic(pub);
        const isValidSignature = global.eddsa().verify(msg, _signature, _pubkey);
        if (isValidSignature) {
            return 0;
        }
        else {
            return 1;
        }
    }
    // Verifies a batch of messages against a batch of signatures with a batch of public keys,
    // using the ed25519 EdDSA scheme.
    // Returns 0 on verification success (all batches verify correctly), 1 on verification failure
    do_ed25519_batch_verify(messages_ptr, signatures_ptr, public_keys_ptr) {
        let messages = decodeSections(messages_ptr.data);
        let signatures = decodeSections(signatures_ptr.data);
        let publicKeys = decodeSections(public_keys_ptr.data);
        if (messages.length === signatures.length &&
            messages.length === publicKeys.length) {
            // Do nothing, we're good to go
        }
        else if (messages.length === 1 &&
            signatures.length == publicKeys.length) {
            const repeated = [];
            for (let i = 0; i < signatures.length; i++) {
                repeated.push(...messages);
            }
            messages = repeated;
        }
        else if (publicKeys.length === 1 &&
            messages.length == signatures.length) {
            const repeated = [];
            for (let i = 0; i < messages.length; i++) {
                repeated.push(...publicKeys);
            }
            publicKeys = repeated;
        }
        else {
            throw new Error('Lengths of messages, signatures and public keys do not match.');
        }
        if (messages.length !== signatures.length ||
            messages.length !== publicKeys.length) {
            throw new Error('Lengths of messages, signatures and public keys do not match.');
        }
        for (let i = 0; i < messages.length; i++) {
            const message = Buffer.from(messages[i]).toString('hex');
            const signature = Buffer.from(signatures[i]).toString('hex');
            const publicKey = Buffer.from(publicKeys[i]).toString('hex');
            const _signature = global.eddsa().makeSignature(signature);
            const _publicKey = global.eddsa().keyFromPublic(publicKey);
            let isValid;
            try {
                isValid = global.eddsa().verify(message, _signature, _publicKey);
            }
            catch (e) {
                console.log(e);
                return 1;
            }
            if (!isValid) {
                return 1;
            }
        }
        return 0;
    }
    do_curve_hash(input, destination) {
        let result = global.curve_hash(input.data);
        destination.write(result);
        return new memory_1.Region(this.exports.memory, 0);
    }
    do_poseidon_hash(inputs, destination) {
        const inputsData = decodeSections(inputs.data);
        let result = global.poseidon_hash(inputsData);
        destination.write(result);
        return new memory_1.Region(this.exports.memory, 0);
    }
    do_groth16_verify(input, proof, vk) {
        const isValidProof = global.groth16_verify(input.data, proof.data, vk.data);
        if (isValidProof) {
            return 0;
        }
        else {
            return 1;
        }
    }
    do_debug(message) {
        this.debugMsgs.push(message.read_str());
    }
    do_query_chain(request) {
        const resultPtr = this.backend.querier.query_raw(request.data, 100000);
        let region = this.allocate(resultPtr.length);
        region.write(resultPtr);
        return region;
    }
    do_abort(message) {
        throw new Error(`abort: ${message.read_str()}`);
    }
}
exports.VMInstance = VMInstance;
function decodeSections(data) {
    let result = [];
    let remainingLen = data.length;
    while (remainingLen >= 4) {
        const tailLen = (0, byte_array_1.toNumber)([
            data[remainingLen - 4],
            data[remainingLen - 3],
            data[remainingLen - 2],
            data[remainingLen - 1],
        ]);
        const section = data.slice(remainingLen - 4 - tailLen, remainingLen - 4);
        result.push(section);
        remainingLen -= 4 + tailLen;
    }
    result.reverse();
    return result;
}
//# sourceMappingURL=instance.js.map