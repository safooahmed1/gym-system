"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationLogsRelations = exports.attendancesRelations = exports.paymentsRelations = exports.subscriptionsRelations = exports.subscriptionPlansRelations = exports.membersRelations = exports.usersRelations = exports.notificationLogs = exports.attendances = exports.payments = exports.subscriptions = exports.subscriptionPlans = exports.members = exports.users = exports.notificationStatusEnum = exports.notificationTypeEnum = exports.discountTypeEnum = exports.paymentMethodEnum = exports.subscriptionStatusEnum = exports.memberStatusEnum = exports.userRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.userRoleEnum = (0, pg_core_1.pgEnum)('user_role', ['admin', 'reception']);
exports.memberStatusEnum = (0, pg_core_1.pgEnum)('member_status', ['active', 'inactive', 'expired', 'expiring_soon']);
exports.subscriptionStatusEnum = (0, pg_core_1.pgEnum)('subscription_status', ['active', 'expired', 'expiring_soon']);
exports.paymentMethodEnum = (0, pg_core_1.pgEnum)('payment_method', ['cash', 'electronic']);
exports.discountTypeEnum = (0, pg_core_1.pgEnum)('discount_type', ['percentage', 'fixed']);
exports.notificationTypeEnum = (0, pg_core_1.pgEnum)('notification_type', ['renewal_reminder', 'expired_notice']);
exports.notificationStatusEnum = (0, pg_core_1.pgEnum)('notification_status', ['sent', 'failed', 'pending']);
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    passwordHash: (0, pg_core_1.varchar)('password_hash', { length: 255 }).notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    role: (0, exports.userRoleEnum)('role').notNull().default('reception'),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    lastLoginAt: (0, pg_core_1.timestamp)('last_login_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
});
exports.members = (0, pg_core_1.pgTable)('members', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    accountId: (0, pg_core_1.varchar)('account_id', { length: 5 }).notNull().unique(),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    phone: (0, pg_core_1.varchar)('phone', { length: 20 }).notNull(),
    nationalId: (0, pg_core_1.varchar)('national_id', { length: 14 }).notNull().unique(),
    status: (0, exports.memberStatusEnum)('status').notNull().default('active'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at'),
}, (table) => ({
    nationalIdIdx: (0, pg_core_1.uniqueIndex)('members_national_id_idx').on(table.nationalId),
    accountIdIdx: (0, pg_core_1.uniqueIndex)('members_account_id_idx').on(table.accountId),
    phoneIdx: (0, pg_core_1.index)('members_phone_idx').on(table.phone),
    nameIdx: (0, pg_core_1.index)('members_name_idx').on(table.name),
    statusIdx: (0, pg_core_1.index)('members_status_idx').on(table.status),
}));
exports.subscriptionPlans = (0, pg_core_1.pgTable)('subscription_plans', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 50 }).notNull(),
    durationMonths: (0, pg_core_1.integer)('duration_months').notNull(),
    price: (0, pg_core_1.numeric)('price', { precision: 10, scale: 2 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
});
exports.subscriptions = (0, pg_core_1.pgTable)('subscriptions', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    memberId: (0, pg_core_1.integer)('member_id').notNull().references(() => exports.members.id, { onDelete: 'cascade' }),
    planId: (0, pg_core_1.integer)('plan_id').notNull().references(() => exports.subscriptionPlans.id),
    startDate: (0, pg_core_1.date)('start_date').notNull(),
    endDate: (0, pg_core_1.date)('end_date').notNull(),
    status: (0, exports.subscriptionStatusEnum)('status').notNull().default('active'),
    discountType: (0, exports.discountTypeEnum)('discount_type'),
    discountValue: (0, pg_core_1.numeric)('discount_value', { precision: 10, scale: 2 }),
    finalPrice: (0, pg_core_1.numeric)('final_price', { precision: 10, scale: 2 }).notNull(),
    createdBy: (0, pg_core_1.integer)('created_by').notNull().references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
}, (table) => ({
    memberIdIdx: (0, pg_core_1.index)('subscriptions_member_id_idx').on(table.memberId),
    statusIdx: (0, pg_core_1.index)('subscriptions_status_idx').on(table.status),
    endDateIdx: (0, pg_core_1.index)('subscriptions_end_date_idx').on(table.endDate),
}));
exports.payments = (0, pg_core_1.pgTable)('payments', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    subscriptionId: (0, pg_core_1.integer)('subscription_id').notNull().references(() => exports.subscriptions.id, { onDelete: 'cascade' }),
    memberId: (0, pg_core_1.integer)('member_id').notNull().references(() => exports.members.id, { onDelete: 'cascade' }),
    amount: (0, pg_core_1.numeric)('amount', { precision: 10, scale: 2 }).notNull(),
    method: (0, exports.paymentMethodEnum)('method').notNull(),
    referenceNumber: (0, pg_core_1.varchar)('reference_number', { length: 100 }),
    receivedBy: (0, pg_core_1.integer)('received_by').notNull().references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (table) => ({
    subscriptionIdIdx: (0, pg_core_1.index)('payments_subscription_id_idx').on(table.subscriptionId),
    memberIdIdx: (0, pg_core_1.index)('payments_member_id_idx').on(table.memberId),
    createdAtIdx: (0, pg_core_1.index)('payments_created_at_idx').on(table.createdAt),
}));
exports.attendances = (0, pg_core_1.pgTable)('attendances', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    memberId: (0, pg_core_1.integer)('member_id').notNull().references(() => exports.members.id, { onDelete: 'cascade' }),
    subscriptionId: (0, pg_core_1.integer)('subscription_id').notNull().references(() => exports.subscriptions.id, { onDelete: 'cascade' }),
    checkInAt: (0, pg_core_1.timestamp)('check_in_at').notNull().defaultNow(),
}, (table) => ({
    memberIdIdx: (0, pg_core_1.index)('attendances_member_id_idx').on(table.memberId),
    checkInAtIdx: (0, pg_core_1.index)('attendances_check_in_at_idx').on(table.checkInAt),
    subscriptionIdIdx: (0, pg_core_1.index)('attendances_subscription_id_idx').on(table.subscriptionId),
}));
exports.notificationLogs = (0, pg_core_1.pgTable)('notification_logs', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    memberId: (0, pg_core_1.integer)('member_id').notNull().references(() => exports.members.id, { onDelete: 'cascade' }),
    type: (0, exports.notificationTypeEnum)('type').notNull(),
    status: (0, exports.notificationStatusEnum)('status').notNull().default('pending'),
    message: (0, pg_core_1.text)('message').notNull(),
    errorMessage: (0, pg_core_1.text)('error_message'),
    sentAt: (0, pg_core_1.timestamp)('sent_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
}, (table) => ({
    memberIdIdx: (0, pg_core_1.index)('notification_logs_member_id_idx').on(table.memberId),
    typeIdx: (0, pg_core_1.index)('notification_logs_type_idx').on(table.type),
    statusIdx: (0, pg_core_1.index)('notification_logs_status_idx').on(table.status),
}));
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    subscriptionsCreated: many(exports.subscriptions, { relationName: 'createdBy' }),
    paymentsReceived: many(exports.payments),
}));
exports.membersRelations = (0, drizzle_orm_1.relations)(exports.members, ({ many, one }) => ({
    subscriptions: many(exports.subscriptions),
    payments: many(exports.payments),
    attendances: many(exports.attendances),
    notificationLogs: many(exports.notificationLogs),
    currentSubscription: one(exports.subscriptions, {
        fields: [exports.members.id],
        references: [exports.subscriptions.memberId],
    }),
}));
exports.subscriptionPlansRelations = (0, drizzle_orm_1.relations)(exports.subscriptionPlans, ({ many }) => ({
    subscriptions: many(exports.subscriptions),
}));
exports.subscriptionsRelations = (0, drizzle_orm_1.relations)(exports.subscriptions, ({ one, many }) => ({
    member: one(exports.members, {
        fields: [exports.subscriptions.memberId],
        references: [exports.members.id],
    }),
    plan: one(exports.subscriptionPlans, {
        fields: [exports.subscriptions.planId],
        references: [exports.subscriptionPlans.id],
    }),
    createdByUser: one(exports.users, {
        fields: [exports.subscriptions.createdBy],
        references: [exports.users.id],
        relationName: 'createdBy',
    }),
    payments: many(exports.payments),
    attendances: many(exports.attendances),
}));
exports.paymentsRelations = (0, drizzle_orm_1.relations)(exports.payments, ({ one }) => ({
    subscription: one(exports.subscriptions, {
        fields: [exports.payments.subscriptionId],
        references: [exports.subscriptions.id],
    }),
    member: one(exports.members, {
        fields: [exports.payments.memberId],
        references: [exports.members.id],
    }),
    receivedByUser: one(exports.users, {
        fields: [exports.payments.receivedBy],
        references: [exports.users.id],
    }),
}));
exports.attendancesRelations = (0, drizzle_orm_1.relations)(exports.attendances, ({ one }) => ({
    member: one(exports.members, {
        fields: [exports.attendances.memberId],
        references: [exports.members.id],
    }),
    subscription: one(exports.subscriptions, {
        fields: [exports.attendances.subscriptionId],
        references: [exports.subscriptions.id],
    }),
}));
exports.notificationLogsRelations = (0, drizzle_orm_1.relations)(exports.notificationLogs, ({ one }) => ({
    member: one(exports.members, {
        fields: [exports.notificationLogs.memberId],
        references: [exports.members.id],
    }),
}));
//# sourceMappingURL=schema.js.map