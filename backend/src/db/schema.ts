import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  date,
  uniqueIndex,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['admin', 'reception']);
export const memberStatusEnum = pgEnum('member_status', ['active', 'inactive', 'expired', 'expiring_soon']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'expired', 'expiring_soon']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'electronic']);
export const discountTypeEnum = pgEnum('discount_type', ['percentage', 'fixed']);
export const notificationTypeEnum = pgEnum('notification_type', ['renewal_reminder', 'expired_notice']);
export const notificationStatusEnum = pgEnum('notification_status', ['sent', 'failed', 'pending']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: userRoleEnum('role').notNull().default('reception'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  accountId: varchar('account_id', { length: 5 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  nationalId: varchar('national_id', { length: 14 }).notNull().unique(),
  status: memberStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  nationalIdIdx: uniqueIndex('members_national_id_idx').on(table.nationalId),
  accountIdIdx: uniqueIndex('members_account_id_idx').on(table.accountId),
  phoneIdx: index('members_phone_idx').on(table.phone),
  nameIdx: index('members_name_idx').on(table.name),
  statusIdx: index('members_status_idx').on(table.status),
}));

export const subscriptionPlans = pgTable('subscription_plans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  durationMonths: integer('duration_months').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  memberId: integer('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  planId: integer('plan_id').notNull().references(() => subscriptionPlans.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  discountType: discountTypeEnum('discount_type'),
  discountValue: numeric('discount_value', { precision: 10, scale: 2 }),
  finalPrice: numeric('final_price', { precision: 10, scale: 2 }).notNull(),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  memberIdIdx: index('subscriptions_member_id_idx').on(table.memberId),
  statusIdx: index('subscriptions_status_idx').on(table.status),
  endDateIdx: index('subscriptions_end_date_idx').on(table.endDate),
}));

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  subscriptionId: integer('subscription_id').notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
  memberId: integer('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  method: paymentMethodEnum('method').notNull(),
  referenceNumber: varchar('reference_number', { length: 100 }),
  receivedBy: integer('received_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  subscriptionIdIdx: index('payments_subscription_id_idx').on(table.subscriptionId),
  memberIdIdx: index('payments_member_id_idx').on(table.memberId),
  createdAtIdx: index('payments_created_at_idx').on(table.createdAt),
}));

export const attendances = pgTable('attendances', {
  id: serial('id').primaryKey(),
  memberId: integer('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  subscriptionId: integer('subscription_id').notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
  checkInAt: timestamp('check_in_at').notNull().defaultNow(),
}, (table) => ({
  memberIdIdx: index('attendances_member_id_idx').on(table.memberId),
  checkInAtIdx: index('attendances_check_in_at_idx').on(table.checkInAt),
  subscriptionIdIdx: index('attendances_subscription_id_idx').on(table.subscriptionId),
}));

export const notificationLogs = pgTable('notification_logs', {
  id: serial('id').primaryKey(),
  memberId: integer('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  status: notificationStatusEnum('status').notNull().default('pending'),
  message: text('message').notNull(),
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  memberIdIdx: index('notification_logs_member_id_idx').on(table.memberId),
  typeIdx: index('notification_logs_type_idx').on(table.type),
  statusIdx: index('notification_logs_status_idx').on(table.status),
}));

export const usersRelations = relations(users, ({ many }) => ({
  subscriptionsCreated: many(subscriptions, { relationName: 'createdBy' }),
  paymentsReceived: many(payments),
}));

export const membersRelations = relations(members, ({ many, one }) => ({
  subscriptions: many(subscriptions),
  payments: many(payments),
  attendances: many(attendances),
  notificationLogs: many(notificationLogs),
  currentSubscription: one(subscriptions, {
    fields: [members.id],
    references: [subscriptions.memberId],
  }),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  member: one(members, {
    fields: [subscriptions.memberId],
    references: [members.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
  createdByUser: one(users, {
    fields: [subscriptions.createdBy],
    references: [users.id],
    relationName: 'createdBy',
  }),
  payments: many(payments),
  attendances: many(attendances),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
  member: one(members, {
    fields: [payments.memberId],
    references: [members.id],
  }),
  receivedByUser: one(users, {
    fields: [payments.receivedBy],
    references: [users.id],
  }),
}));

export const attendancesRelations = relations(attendances, ({ one }) => ({
  member: one(members, {
    fields: [attendances.memberId],
    references: [members.id],
  }),
  subscription: one(subscriptions, {
    fields: [attendances.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const notificationLogsRelations = relations(notificationLogs, ({ one }) => ({
  member: one(members, {
    fields: [notificationLogs.memberId],
    references: [members.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Attendance = typeof attendances.$inferSelect;
export type NewAttendance = typeof attendances.$inferInsert;
export type NotificationLog = typeof notificationLogs.$inferSelect;
export type NewNotificationLog = typeof notificationLogs.$inferInsert;