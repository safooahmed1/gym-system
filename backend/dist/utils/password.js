"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_js_1 = require("../config/env.js");
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, env_js_1.env.BCRYPT_SALT_ROUNDS);
}
async function verifyPassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
//# sourceMappingURL=password.js.map