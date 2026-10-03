---
title: بنية المشروع
description: خريطة المجلدات والملفات في موزون ومسؤولية كل جزء منها.
order: 2
---

# بنية المشروع

```text
mawzun-project/
├── docs/                     # ← هذا التوثيق (مصدر الحقيقة)
├── public/                   # الأصول الثابتة
├── scripts/
│   ├── ensure-bun.mjs        # حارس يمنع npm/yarn/pnpm
│   ├── check-docs.mjs        # فحص التوثيق (docs:check)
│   └── engine-check.ts       # التحقق السلوكي من المحرك (engine:check)
├── src/
│   ├── app/                  # App Router
│   │   ├── globals.css       # رموز التصميم (@theme) ونمط الجذر
│   │   ├── layout.tsx        # الجذر: RTL + الخطوط + AppShell + AuditProvider
│   │   ├── page.tsx          # الصفحة الوحيدة: AuditWorkspace
│   │   └── api/audit/
│   │       └── route.ts      # POST /api/audit (ربط نموذج Workers AI)
│   ├── components/
│   │   ├── audit/            # مساحة العمل: AuditWorkspace، الأقسام الخمسة، parts
│   │   ├── layout/           # AppShell, TopBar, SearchModal, SettingsModal
│   │   └── ui/               # Icon (العناصر الأساسية المتبقية)
│   ├── context/
│   │   ├── AuditContext.tsx  # حالة الفحص والسجل والتحقق
│   │   └── ToastContext.tsx  # الإشعارات العابرة
│   └── lib/
│       ├── audit/            # محرّك الفحص ثلاثي الطبقات
│       │   ├── constraint-bank.ts     # القيود الخمس وأصولها
│       │   ├── ruling-strength.ts     # جدول قوة الحكم
│       │   ├── layer1-deterministic.ts
│       │   ├── layer2-lexical.ts
│       │   ├── layer3-semantic.ts
│       │   ├── verdict.ts             # الحكم ثلاثي الحالات
│       │   ├── record.ts              # السجل المختوم
│       │   ├── normalize.ts           # مفتاح المقارنة العربية
│       │   ├── layer-context.ts
│       │   ├── types.ts
│       │   └── index.ts               # runAudit
│       ├── cx.ts             # دمج أسماء أصناف Tailwind
│       ├── stages.ts         # مصدر حقيقة الأقسام الخمسة
│       └── typography.ts     # أدوار الطباعة
├── stitch_mawzun/            # مراجع التصميم الأصلية (Stitch) + DESIGN.md
├── archive/                  # نسخ ما قبل التعديل (وفق قواعد المشروع)
├── AGENTS.md                 # القواعد الإلزامية
├── wrangler.jsonc            # تكوين Cloudflare (ربط AI)
└── bun.lock                  # ملف القفل المرجعي
```

## المجلدات المحورية

### `src/app/`
يعتمد على **App Router** في Next.js 16، لكن لا مسارات مراحل: `page.tsx` تُصيّر مساحة العمل
كاملة، و`layout.tsx` يمرّر الحالة ويغلّف بالهيكل. المسار الوحيد على الخادم هو `api/audit`.
التنسيقات العامة ورموز التصميم في [globals.css](/docs/architecture/design-system).

### `src/components/`
- **`audit/`** — مساحة العمل والقسم الواحد: `AuditWorkspace`, `InputSection`, `ConstraintsSection`,
  `PipelineSection`, `VerdictSection`, `LedgerSection`, و`parts.tsx` بالأساس المشترك.
- **`layout/`** — الهيكل الثابت المشترك (`AppShell`, `TopBar`) والنوافذ (`SearchModal`, `SettingsModal`).
- **`ui/`** — عنصر أساسي محايد متبقٍّ (`Icon`). الألواح والرقائق في مساحة العمل مبنيّة في
  `components/audit/parts.tsx`.

### `src/lib/`
- **`audit/`** — المحرك كله: بنك القيود، جدول قوة الحكم، الطبقات 1–3، الحكم، السجل، والموحّد.
  نقطة الدخول `runAudit`. راجع [مسار التدقيق](/docs/workflow/audit-pipeline).
- **`stages.ts`** — مصدر الحقيقة الوحيد للأقسام الخمسة ومراسيها، يستهلكه الشريط العلوي وشريط
  المراحل والبحث. راجع [التوجيه والأقسام](/docs/architecture/routing-and-stages).

### `stitch_mawzun/`
مراجع التصميم الأصلية المُصدَّرة من Stitch، وتحتوي `mawzun_semantic_guard/DESIGN.md`
الذي وُلدت منه رموز التصميم في التطبيق.

### `archive/`
لقطات الملفات قبل أي تعديل أو حذف، منظّمة بتاريخ `YYYYMMDD`. إلزامية وفق
[قواعد المشروع](/docs/reference/conventions#الوسوم-والأرشفة).

## ما ليس مضمّناً في Git

`node_modules/`, `.next/`, `out/`, `build/`, `.env*`, و`archive` مُستثنى من فحص ESLint.
راجع `.gitignore` لمزيد من التفصيل.
