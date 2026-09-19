"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.generateTokens = generateTokens;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
const accessTokenOptions = {
    expiresIn: env_js_1.env.JWT_ACCESS_EXPIRY,
};
const refreshTokenOptions = {
    expiresIn: env_js_1.env.JWT_REFRESH_EXPIRY,
};
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign({ ...payload, type: 'access' }, env_js_1.env.JWT_ACCESS_SECRET, accessTokenOptions);
}
function generateRefreshToken(payload) {
    return jsonwebtoken_1.default.sign({ ...payload, type: 'refresh' }, env_js_1.env.JWT_REFRESH_SECRET, refreshTokenOptions);
}
function verifyAccessToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, env_js_1.env.JWT_ACCESS_SECRET);
    }
    catch {
        return null;
    }
}
function verifyRefreshToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, env_js_1.env.JWT_REFRESH_SECRET);
    }
    catch {
        return null;
    }
}
function generateTokens(payload) {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
}
//# sourceMappingURL=jwt.js.map