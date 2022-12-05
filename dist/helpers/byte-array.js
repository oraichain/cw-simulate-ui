"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toByteArray = exports.toNumber = exports.compare = void 0;
const encoding_1 = require("@cosmjs/encoding");
/**
 * Compares two byte arrays using the same logic as strcmp()
 *
 * @returns {number} bytes1 < bytes2 --> -1; bytes1 == bytes2 --> 0; bytes1 > bytes2 --> 1
 */
function compare(bytes1, bytes2) {
    const length = Math.max(bytes1.length, bytes2.length);
    for (let i = 0; i < length; i++) {
        if (bytes1.length < i)
            return -1;
        if (bytes2.length < i)
            return 1;
        if (bytes1[i] < bytes2[i])
            return -1;
        if (bytes1[i] > bytes2[i])
            return 1;
    }
    return 0;
}
exports.compare = compare;
function toNumber(bigEndianByteArray) {
    let value = 0;
    for (let i = 0; i < bigEndianByteArray.length; i++) {
        value = (value * 256) + bigEndianByteArray[i];
    }
    return value;
}
exports.toNumber = toNumber;
function toByteArray(number, fixedLength) {
    let hex = number.toString(16);
    if (hex.length % 2 === 1) {
        hex = `0${hex}`;
    }
    const bytesOriginal = (0, encoding_1.fromHex)(hex);
    if (!fixedLength) {
        return new Uint8Array([...bytesOriginal]);
    }
    let bytesFixedLength = [...bytesOriginal];
    for (let i = 0; i < fixedLength - bytesOriginal.length; i++) {
        bytesFixedLength = [0, ...bytesFixedLength];
    }
    return new Uint8Array(bytesFixedLength);
}
exports.toByteArray = toByteArray;
//# sourceMappingURL=byte-array.js.map