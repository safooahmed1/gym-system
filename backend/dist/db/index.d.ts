import pg from 'pg';
import * as schema from './schema.js';
export declare const pool: pg.Pool;
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema>;
export declare function testConnection(): Promise<boolean>;
//# sourceMappingURL=index.d.ts.map