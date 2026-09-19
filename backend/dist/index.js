"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_js_1 = require("./config/env.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const index_js_1 = require("./db/index.js");
// Import routes
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const members_js_1 = __importDefault(require("./routes/members.js"));
const subscriptions_js_1 = __importDefault(require("./routes/subscriptions.js"));
const payments_js_1 = __importDefault(require("./routes/payments.js"));
const attendances_js_1 = __importDefault(require("./routes/attendances.js"));
const reports_js_1 = __importDefault(require("./routes/reports.js"));
const plans_js_1 = __importDefault(require("./routes/plans.js"));
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_js_1.env.CORS_ORIGIN,
    credentials: true,
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api/auth', auth_js_1.default);
app.use('/api/members', members_js_1.default);
app.use('/api/subscriptions', subscriptions_js_1.default);
app.use('/api/payments', payments_js_1.default);
app.use('/api/attendances', attendances_js_1.default);
app.use('/api/reports', reports_js_1.default);
app.use('/api/plans', plans_js_1.default);
// 404 handler
app.use(errorHandler_js_1.notFoundHandler);
// Error handler
app.use(errorHandler_js_1.errorHandler);
// Start server
async function start() {
    const connected = await (0, index_js_1.testConnection)();
    if (!connected) {
        console.error('Failed to connect to database. Exiting...');
        process.exit(1);
    }
    app.listen(env_js_1.env.PORT, () => {
        console.log(`Server running on port ${env_js_1.env.PORT} in ${env_js_1.env.NODE_ENV} mode`);
    });
}
start().catch(console.error);
exports.default = app;
//# sourceMappingURL=index.js.map