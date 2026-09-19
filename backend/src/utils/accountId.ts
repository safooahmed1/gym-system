import { db } from '../db/index.js';
import { members } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function generateUniqueAccountId(): Promise<string> {
  let accountId: string;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 10;

  while (exists && attempts < maxAttempts) {
    // Generate 5-digit number (10000-99999)
    accountId = String(Math.floor(Math.random() * 90000) + 10000);
    
    const existing = await db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.accountId, accountId))
      .limit(1);
    
    exists = existing.length > 0;
    attempts++;
  }

  if (attempts >= maxAttempts) {
    // Fallback: find the max account_id and increment
    const result = await db
      .select({ accountId: members.accountId })
      .from(members)
      .orderBy(members.accountId)
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

  return accountId!;
}

export function formatAccountId(id: string): string {
  return id.padStart(5, '0');
}