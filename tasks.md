# Tasks & Milestones - Gym Management System (SaaS)

بناءً على PRD المحدد، هذا الملف يحتوي على جميع المهام والمحطات اللازمة لبناء الـ MVP.

---

## 📦 Milestone 0: إعداد المشروع والبنية الأساسية
**الهدف:** تجهيز بيئة التطوير، الريпозиتوري، والبنية الأساسية للـ Frontend و Backend.

### Tasks:
- [ ] **M0.1** تهيئة Git Repository
  - [ ] إنشاء repo على GitHub/GitLab
  - [ ] إعداد .gitignore لـ Node.js
  - [ ] إعداد فرع main وفرع develop
  - [ ] إعداد GitHub Actions / CI أساسي (lint + typecheck)

- [ ] **M0.2** إعداد Backend (Node.js + Express + TypeScript)
  - [ ] تهيئة مشروع npm مع TypeScript
  - [ ] تثبيت dependencies: express, cors, helmet, morgan, zod, jsonwebtoken, bcryptjs, pg, drizzle-orm (أو Prisma)
  - [ ] إعداد ESLint + Prettier + TypeScript strict mode
  - [ ] إعداد هيكل المجلدات: routes, controllers, services, middleware, utils, config, db
  - [ ] إعداد متغيرات البيئة (.env.example)
  - [ ] إعداد اتصال قاعدة البيانات (PostgreSQL عبر Neon/Supabase)
  - [ ] إعداد JWT Authentication middleware
  - [ ] إعداد Error handling middleware مركزي

- [ ] **M0.3** إعداد Frontend (React + TypeScript + Vite)
  - [ ] تهيئة مشروع Vite + React + TypeScript
  - [ ] تثبيت dependencies: react-router-dom, axios, react-hook-form, zod, @tanstack/react-query, date-fns, i18next
  - [ ] إعداد UI Library (اختيار: shadcn/ui + Tailwind CSS أو MUI)
  - [ ] إعداد ESLint + Prettier + TypeScript strict mode
  - [ ] إعداد هيكل المجلدات: components, pages, hooks, services, utils, contexts, types, locales
  - [ ] إعداد React Query Provider + Axios interceptor للـ JWT
  - [ ] إعداد i18n (عربي/إنجليزي) مع RTL support
  - [ ] إعداد Tailwind CSS مع RTL plugin

- [ ] **M0.4** إعداد قاعدة البيانات (PostgreSQL)
  - [ ] تصميم Schema مبدئي (ERD)
  - [ ] إعداد Migration system (Drizzle Kit أو Prisma Migrate)
  - [ ] إنشاء جداول: users, members, subscriptions, payments, attendances, subscription_plans
  - [ ] إضافة فهارس (indexes) للأداء
  - [ ] Seed data للـ subscription plans الأساسية

- [ ] **M0.5** نشر بيئة التطوير (Dev Deployment)
  - [ ] ربط Frontend بـ Vercel (Preview deployments)
  - [ ] ربط Backend بـ Railway/Render (أو local tunneling للـ dev)
  - [ ] إعداد قاعدة بيانات Neon/Supabase مجانية

---

## 🏗️ Milestone 1: المصادقة وإدارة المستخدمين (Auth & User Management)
**الهدف:** نظام تسجيل دخول بصلاحيات Admin/Reception مع JWT.

### Tasks:
- [ ] **M1.1** Backend - Auth API
  - [ ] POST /api/auth/register - إنشاء حساب Admin/Reception (Sign up)
  - [ ] POST /api/auth/login - تسجيل دخول مع إرجاع JWT
  - [ ] POST /api/auth/refresh - تجديد Access Token
  - [ ] GET /api/auth/me - جلب بيانات المستخدم الحالي
  - [ ] Middleware: verifyToken, requireRole(['admin', 'reception'])
  - [ ] تشفير كلمات المرور بـ bcrypt (cost factor 12)
  - [ ] JWT: Access Token (15min) + Refresh Token (7 days, HttpOnly cookie)

- [ ] **M1.2** Frontend - Auth Pages & State
  - [ ] صفحة Login مع Validation (react-hook-form + zod)
  - [ ] صفحة Register (Sign up) - للإدارة فقط
  - [ ] AuthContext لإدارة حالة المستخدم والـ tokens
  - [ ] Protected Routes Wrapper
  - [ ] Role-based UI rendering (Admin vs Reception)
  - [ ] Logout مع تنظيف الـ state والـ cookies

- [ ] **M1.3** اختبارات المصادقة
  - [ ] وحدة اختبارات لـ Auth Service
  - [ ] اختبارات تكامل لـ Login/Register endpoints
  - [ ] اختبار صلاحيات الوصول للمسارات المحمية

---

## 👥 Milestone 2: إدارة العملاء (Members Management)
**الهدف:** CRUD كامل للعملاء مع البحث، الفلترة، والـ Soft Delete.

### Tasks:
- [ ] **M2.1** Backend - Members API
  - [ ] تصميم نموذج Member (name, phone, national_id, account_id, status, created_at, updated_at, deleted_at)
  - [ ] Unique constraint على national_id
  - [ ] POST /api/members - إنشاء عميل جديد
    - [ ] Validation: الاسم مطلوب، التليفون مطلوب، الرقم القومي مطلوب وفريد
    - [ ] توليد account_id تلقائيًا (5 أرقام Unique)
  - [ ] GET /api/members - قائمة العملاء مع Pagination + Search + Filters
    - [ ] Query params: page, limit, search, status (active/expired/expiring_soon/inactive)
  - [ ] GET /api/members/:id - تفاصيل عميل واحد + سجلاته
  - [ ] PATCH /api/members/:id - تحديث بيانات العميل
  - [ ] DELETE /api/members/:id - Soft Delete (تحديث status='inactive' + deleted_at)
  - [ ] GET /api/members/:id/history - سجل الاشتراكات + المدفوعات + الحضور

- [ ] **M2.2** Frontend - Members UI
  - [ ] صفحة قائمة العملاء (Members List)
    - [ ] جدول قابل للفرز والبحث (TanStack Table أو react-table)
    - [ ] فلاتر: الحالة، البحث بالاسم/التليفون/ID/الرقم القومي
    - [ ] Pagination
    - [ ] أزرار Actions: عرض، تعديل، حذف، تجديد اشتراك
  - [ ] Modal/صفحة "إضافة عميل جديد" مع Form Validation
  - [ ] Modal/صفحة "تعديل عميل"
  - [ ] صفحة تفاصيل العميل (Member Profile)
    - [ ] تبويبات: بيانات، اشتراكات، مدفوعات، حضور
  - [ ] تأكيد حذف (Soft Delete) مع توضيح أن السجلات محفوظة

- [ ] **M2.3** معالجة الرقم القومي المكرر
  - [ ] Backend: إرجاع خطأ 409 مع رسالة واضحة
  - [ ] Frontend: عرض Toast/Alert بالخطأ

---

## 📋 Milestone 3: إدارة الاشتراكات (Subscriptions Management)
**الهدف:** إدارة باقات الاشتراك، ربطها بالعملاء، والتجديد المرن.

### Tasks:
- [ ] **M3.1** Backend - Subscription Plans & Subscriptions API
  - [ ] جدول subscription_plans (id, name, duration_months, price, description, is_active)
  - [ ] Seed: شهر (1)، 3 شهور (3)، سنة (12)
  - [ ] جدول subscriptions (id, member_id, plan_id, start_date, end_date, status, discount_type, discount_value, final_price, created_by, created_at)
  - [ ] POST /api/subscriptions - إنشاء اشتراك جديد
    - [ ] حساب end_date تلقائيًا: start_date + plan.duration_months
    - [ ] تطبيق الخصم (نسبة % أو مبلغ ثابت)
    - [ ] حساب final_price
  - [ ] GET /api/subscriptions - قائمة الاشتراكات مع فلاتر
  - [ ] GET /api/subscriptions/:id - تفاصيل اشتراك
  - [ ] POST /api/subscriptions/:id/renew - تجديد اشتراك
    - [ ] اختيار باقة جديدة (قد تختلف عن الحالية)
    - [ ] إذا كان الاشتراك نشط: new_end_date = current_end_date + new_plan_duration
    - [ ] إذا كان منتهي: new_end_date = today + new_plan_duration
    - [ ] تسجيل Payment مرتبط
  - [ ] Job/Function: تحديث حالة الاشتراكات تلقائيًا (active/expiring_soon/expired)
    - [ ] expiring_soon: إذا end_date <= today + 3 days
    - [ ] expired: إذا end_date < today

- [ ] **M3.2** Frontend - Subscriptions UI
  - [ ] صفحة إدارة الباقات (Admin فقط): CRUD للباقات
  - [ ] في صفحة العميل: قسم "الاشتراك الحالي" مع حالة ملونة (نشط/قريب الانتهاء/منتهي)
  - [ ] زر "تجديد الاشتراك" يفتح Modal
    - [ ] اختيار الباقة الجديدة
    - [ ] عرض السعر بعد الخصم
    - [ ] انتقال لتسجيل الدفع
  - [ ] عرض سجل الاشتراكات السابقة للعميل

- [ ] **M3.3** منطق الخصومات (Discounts)
  - [ ] Backend: حقول discount_type (percentage/fixed)، discount_value
  - [ ] Validation: discount_value > 0، لا يوجد سقف أقصى
  - [ ] Frontend: حقول الخصم في نموذج إنشاء/تجديد الاشتراك
  - [ ] عرض السعر الأصلي والسعر النهائي بوضوح

---

## 💰 Milestone 4: المدفوعات (Payments)
**الهدف:** تسجيل المدفوعات كاش/إلكتروني مع سجل كامل.

### Tasks:
- [ ] **M4.1** Backend - Payments API
  - [ ] جدول payments (id, subscription_id, member_id, amount, method, reference_number, received_by, created_at)
  - [ ] Enum payment_method: 'cash' | 'electronic'
  - [ ] POST /api/payments - تسجيل دفعة جديدة
    - [ ] ربطها باشتراك (subscription_id)
    - [ ] Validation: المبلغ = final_price للاشتراك (لا دفع جزئي)
  - [ ] GET /api/payments - قائمة المدفوعات مع فلاتر (التاريخ، الطريقة، العضو)
  - [ ] GET /api/payments/:id - تفاصيل دفعة
  - [ ] GET /api/members/:id/payments - مدفوعات عميل محدد

- [ ] **M4.2** Frontend - Payments UI
  - [ ] نموذج تسجيل دفع (Modal في صفحة التجديد أو صفحة مستقلة)
    - [ ] اختيار الطريقة: كاش / إلكتروني
    - [ ] حقل رقم المرجع (للإلكتروني)
    - [ ] المبلغ محسوب تلقائيًا (غير قابل للتعديل)
  - [ ] صفحة تقارير المدفوعات (فلترة، تصدير)
  - [ ] عرض سجل مدفوعات العميل في صفحة تفاصيله

---

## ✅ Milestone 5: تسجيل الحضور (Check-in)
**الهدف:** تسجيل حضور بسيط بالـ ID مع منع الحضور للاشتراكات المنتهية.

### Tasks:
- [ ] **M5.1** Backend - Check-in API
  - [ ] جدول attendances (id, member_id, check_in_at, subscription_id)
  - [ ] POST /api/check-in - تسجيل حضور
    - [ ] Input: account_id (5 أرقام)
    - [ ] التحقق: العضو موجود + نشط + الاشتراك نشط (ليس منتهي)
    - [ ] إذا الاشتراك منتهي: إرجاع 403 مع رسالة "الاشتراك منتهي، يرجى التجديد"
    - [ ] إنشاء سجل حضور مع timestamp الحالي
  - [ ] GET /api/attendances - سجل الحضور مع فلاتر (التاريخ، العضو)
  - [ ] GET /api/members/:id/attendances - حضور عميل محدد
  - [ ] GET /api/attendances/stats - إحصائيات حضور (يومي/شهري)

- [ ] **M5.2** Frontend - Check-in UI
  - [ ] صفحة Check-in مخصصة (بسيطة وسريعة)
    - [ ] حقل إدخال واحد: Account ID (5 أرقام) مع Auto-focus
    - [ ] Enter لتسجيل الحضور فورًا
    - [ ] Feedback بصري: نجاح (أخضر) / فشل مع سبب (أحمر)
    - [ ] عرض اسم العميل وصورته (إن وجدت) بعد التحقق
  - [ ] صفحة سجل الحضور (Admin/Reception)
    - [ ] فلاتر: اليوم، الأسبوع، الشهر، عميل محدد
    - [ ] إحصائيات سريعة: عدد الحاضرين اليوم، هذا الأسبوع

---

## 🔔 Milestone 6: تنبيهات واتساب (WhatsApp Reminders)
**الهدف:** إرسال تذكيرات قبل 3 أيام وعند الانتهاء.

### Tasks:
- [ ] **M6.1** اختيار مزود واتساب
  - [ ] بحث وتجربة خيارات مجانية (Twilio Sandbox، WhatsApp Cloud API، UltraMsg، WATI، إلخ)
  - [ ] توثيق المزود المختار و الـ API credentials

- [ ] **M6.2** Backend - Notification Service
  - [ ] خدمة NotificationService مع دالة sendWhatsApp(phone, template, variables)
  - [ ] قوالب الرسائل:
    - [ ] تذكير قبل 3 أيام: "مرحباً [اسم]، اشتراكك في [الجيم] سينتهي خلال 3 أيام ([التاريخ]). يرجى التجديد للاستمرار."
    - [ ] انتهاء الاشتراك: "مرحباً [اسم]، اشتراكك في [الجيم] انتهى اليوم. يرجى التجديد لاستئناف حضورك."
  - [ ] Cron Job / Scheduled Function (يومي في وقت محدد، مثلاً 10 صباحًا):
    - [ ] استعلام: أعضاء نشطين حيث end_date = today + 3 أيام → إرسال تذكير
    - [ ] استعلام: أعضاء حيث end_date = today → إرسال إشعار انتهاء
  - [ ] جدول notification_logs لتتبع الإرسالات (member_id, type, status, sent_at, error_message)

- [ ] **M6.3** Frontend - إعدادات التنبيهات (Admin)
  - [ ] صفحة إعدادات: تفعيل/تعطيل التنبيهات، وقت الإرسال، معاينة القوالب
  - [ ] عرض سجل الإرسال (Notification Logs)

---

## 📊 Milestone 7: التقارير والإحصائيات (Reports & Analytics)
**الهدف:** لوحة تحكم تقارير شاملة مع تصدير Excel/PDF.

### Tasks:
- [ ] **M7.1** Backend - Reports API
  - [ ] GET /api/reports/dashboard - كروت الملخص (إجمالي الإيرادات، أعضاء نشطين، منتهيين، قريبين)
  - [ ] GET /api/reports/revenue - إيرادات مع فلترة (يومي/أسبوعي/شهري/سنوي، طريقة الدفع)
  - [ ] GET /api/reports/subscriptions-distribution - توزيع الاشتراكات المباعة
  - [ ] GET /api/reports/attendance - إحصائيات الحضور
  - [ ] GET /api/reports/export - تصدير تقرير (Excel/PDF)
    - [ ] Query params: type, format, date_from, date_to, filters
    - [ ] استخدام مكتبة: exceljs لـ Excel، pdfkit أو puppeteer لـ PDF

- [ ] **M7.2** Frontend - Reports Dashboard
  - [ ] صفحة Dashboard رئيسية مع كروت KPIs
  - [ ] رسوم بيانية (Charts): Recharts أو Chart.js
    - [ ] إيرادات عبر الزمن (Line chart)
    - [ ] توزيع طرق الدفع (Pie chart)
    - [ ] توزيع أنواع الاشتراكات (Bar chart)
    - [ ] الحضور اليومي/الأسبوعي
  - [ ] فلاتر تاريخ موحدة (Date Range Picker)
  - [ ] أزرار تصدير: Excel / PDF لكل تقرير
  - [ ] صلاحيات: Reception يرى فقط (View only)، Admin يرى ويصدر

---

## 🌐 Milestone 8: التدويل (i18n) والـ RTL
**الهدف:** دعم كامل للعربية والإنجليزية مع RTL صحيح.

### Tasks:
- [ ] **M8.1** إعداد i18n
  - [ ] ملفات الترجمة: locales/ar.json، locales/en.json
  - [ ] تغطية جميع النصوص في التطبيق
  - [ ] Language Switcher في الـ Header/Navbar
  - [ ] حفظ اللغة المختارة في localStorage

- [ ] **M8.2** RTL Support
  - [ ] Tailwind CSS RTL plugin أو إعداد يدوي
  - [ ] اتجاه الصفحة يتغير تلقائيًا حسب اللغة
  - [ ] مكونات RTL-aware: جداول، نماذج، مودالات، توستات
  - [ ] اختبار جميع الصفحات في الحالتين

---

## 🔧 Milestone 9: التحسينات، الاختبارات، والنشر
**الهدف:** تلميع المنتج، اختبارات، ونشر Production.

### Tasks:
- [ ] **M9.1** اختبارات
  - [ ] Unit Tests: Services، Utils، Hooks (Jest + React Testing Library)
  - [ ] Integration Tests: API Endpoints (Supertest)
  - [ ] E2E Tests: Critical flows (Cypress أو Playwright)
    - [ ] تسجيل عميل + اشتراك + دفع
    - [ ] تجديد اشتراك
    - [ ] Check-in
    - [ ] Login/Logout

- [ ] **M9.2** تحسينات الأداء والأمان
  - [ ] Rate Limiting على APIs
  - [ ] Helmet headers
  - [ ] CORS configuration
  - [ ] Database query optimization (indexes، pagination)
  - [ ] React Query caching optimization
  - [ ] Code splitting و Lazy loading للصفحات

- [ ] **M9.3** Error Handling & Logging
  - [ ] Backend: Structured logging (pino أو winston)
  - [ ] Frontend: Error Boundary، Toast notifications موحدة
  - [ ] مراقبة الأخطاء (Sentry أو بديل مجاني)

- [ ] **M9.4** النشر للإنتاج (Production Deployment)
  - [ ] Frontend → Vercel Production
  - [ ] Backend → Railway/Render Production
  - [ ] Database → Neon/Supabase Production (مع Backup مفعل)
  - [ ] Domain و SSL
  - [ ] متغيرات البيئة للإنتاج
  - [ ] Smoke tests بعد النشر

- [ ] **M9.5** توثيق وتسليم
  - [ ] README شامل:Setup، Run، Deploy، Env vars
  - [ ] API Documentation (Swagger/OpenAPI)
  - [ ] دليل المستخدم للعربي/الإنجليزي
  - [ ] فيديو توضيحي قصير (اختياري)

---

## 📋 ملخص المحطات (Milestones Summary)

| المحطة | الوصف | الأولوية | تقدير الجهد |
|----------|---------|----------|-------------|
| **M0** | إعداد المشروع والبنية | **Critical** | 3-5 أيام |
| **M1** | المصادقة والصلاحيات | **Critical** | 2-3 أيام |
| **M2** | إدارة العملاء | **Critical** | 3-4 أيام |
| **M3** | إدارة الاشتراكات | **Critical** | 3-4 أيام |
| **M4** | المدفوعات | **Critical** | 2-3 أيام |
| **M5** | تسجيل الحضور | **Critical** | 2-3 أيام |
| **M6** | تنبيهات واتساب | **High** | 2-3 أيام |
| **M7** | التقارير والتصدير | **High** | 3-4 أيام |
| **M8** | i18n + RTL | **Medium** | 2-3 أيام |
| **M9** | اختبارات، تحسينات، نشر | **Critical** | 4-5 أيام |

**إجمالي التقدير:** ~26-37 يوم عمل (تقريبي، يعتمد على حجم الفريق)

---

## 🎯 Definition of Done لكل Task
- [ ] الكود مكتوب و يمر بـ TypeScript strict mode بدون أخطاء
- [ ] يمر بـ ESLint + Prettier
- [ ] اختبارات وحدة/تكامل مكتوبة وتنجح
- [ ] تم مراجعة الكود (Code Review) - لو في فريق
- [ ] تم اختبار الميزة يدويًا على البيئة المحلية
- [ ] تم توثيق أي قرارات تقنية مهمة في الكود أو README

---

## 🔄 ملاحظات هامة للتنفيذ

1. **ترتيب التنفيذ المقترح:** M0 → M1 → M2 → M3 → M4 → M5 → M7 → M6 → M8 → M9
   - M7 قبل M6 لأن التقارير تحتاج بيانات حقيقية
   - M6 يمكن تطويره بالتوازي مع M7

2. **قاعدة البيانات:** ابدأ بـ Schema بسيط وطوره مع كل ميلستون، استخدم Migrations

3. **التصميم (UI/UX):** ركز على البساطة والسرعة - الريسبشن يحتاج واجهة سريعة جدًا

4. **WhatsApp:** ابدأ بمزود مجاني للساندبوكس، ويمكن التبديل لاحقاً

5. **التقارير:** Excel أسهل في التنفيذ من PDF، ابدأ بـ Excel

---

*تم إنشاء هذا الملف بناءً على PRD v1.0 - سبتمبر 2026*
*سيتم تحديث المهام حسب التقدم والقرارات التقنية أثناء التطوير*