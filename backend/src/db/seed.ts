import { db } from '../db/index.js';
import { subscriptionPlans } from '../db/schema.js';
import { eq } from 'drizzle-orm';

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
    const existing = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.name, plan.name))
      .limit(1);
    
    if (existing.length === 0) {
      await db.insert(subscriptionPlans).values(plan);
      console.log(`Created plan: ${plan.name}`);
    } else {
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