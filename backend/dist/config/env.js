"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/gym_system',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key-change-in-production',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
    JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
};
//# sourceMappingURL=env.js.map