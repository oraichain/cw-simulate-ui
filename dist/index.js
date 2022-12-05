"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const elliptic_1 = require("elliptic");
const pkg_1 = require("./wasm/zk/pkg");
__exportStar(require("./memory"), exports);
__exportStar(require("./backend"), exports);
__exportStar(require("./instance"), exports);
__exportStar(require("./environment"), exports);
global.eddsa = () => global._eddsa || (global._eddsa = new elliptic_1.eddsa('ed25519'));
const poseidon = new pkg_1.Poseidon();
global.poseidon_hash = poseidon.hash.bind(poseidon);
global.curve_hash = pkg_1.curve_hash;
global.groth16_verify = pkg_1.groth16_verify;
//# sourceMappingURL=index.js.map