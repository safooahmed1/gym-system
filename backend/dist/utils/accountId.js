"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueAccountId = generateUniqueAccountId;
exports.formatAccountId = formatAccountId;
const index_js_1 = require("../db/index.js");
const schema_js_1 = require("../db/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
async function generateUniqueAccountId() {
    let accountId;
    let exists = true;
    let attempts = 0;
    const maxAttempts = 10;
    while (exists && attempts < maxAttempts) {
        // Generate 5-digit number (10000-99999)
        accountId = String(Math.floor(Math.random() * 90000) + 10000);
        const existing = await index_js_1.db
            .select({ id: schema_js_1.members.id })
            .from(schema_js_1.members)
            .where((0, drizzle_orm_1.eq)(schema_js_1.members.accountId, accountId))
            .limit(1);
        exists = existing.length > 0;
        attempts++;
    }
    if (attempts >= maxAttempts) {
        // Fallback: find the max account_id and increment
        const result = await index_js_1.db
            .select({ accountId: schema_js_1.members.accountId })
            .from(schema_js_1.members)
            .orderBy(schema_js_1.members.accountId)
            .limit(1);
        if (result.length > 0) {
            const nextId = parseInt(result[0].accountId, 10) + 1;
            if (nextId <= 99999) {
                return String(nextId).padStart(5, '0');
            }
        }
        // Ultimate fallback
        return String(Date.now()).slice(-5).padStart(5, '0');
    }
    return accountId;
}
function formatAccountId(id) {
    return id.padStart(5, '0');
}
//# sourceMappingURL=accountId.js.map