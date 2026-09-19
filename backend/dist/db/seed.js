"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("../db/index.js");
const schema_js_1 = require("../db/schema.js");
const drizzle_orm_1 = require("drizzle-orm");
const defaultPlans = [
    {
        name: 'شهري',
        durationMonths: 1,
        price: '300.00',
        description: 'اشتراك شهر واحد',
        isActive: true,
    },
    {
        name: '3 شهور',
        durationMonths: 3,
        price: '800.00',
        description: 'اشتراك 3 شهور بخصم',
        isActive: true,
    },
    {
        name: 'سنوي',
        durationMonths: 12,
        price: '3000.00',
        description: 'اشتراك سنة كاملة بأفضل سعر',
        isActive: true,
    },
];
async function seed() {
    console.log('Seeding subscription plans...');
    for (const plan of defaultPlans) {
        const existing = await index_js_1.db
            .select()
            .from(schema_js_1.subscriptionPlans)
            .where((0, drizzle_orm_1.eq)(schema_js_1.subscriptionPlans.name, plan.name))
            .limit(1);
        if (existing.length === 0) {
            await index_js_1.db.insert(schema_js_1.subscriptionPlans).values(plan);
            console.log(`Created plan: ${plan.name}`);
        }
        else {
            console.log(`Plan already exists: ${plan.name}`);
        }
    }
    console.log('Seeding completed!');
    process.exit(0);
}
seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map