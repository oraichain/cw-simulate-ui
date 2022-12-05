/**
 * Compares two byte arrays using the same logic as strcmp()
 *
 * @returns {number} bytes1 < bytes2 --> -1; bytes1 == bytes2 --> 0; bytes1 > bytes2 --> 1
 */
export declare function compare(bytes1: Uint8Array, bytes2: Uint8Array): number;
export declare function toNumber(bigEndianByteArray: Uint8Array | number[]): number;
export declare function toByteArray(number: number, fixedLength?: number | undefined): Uint8Array;
