---
title: الأوامر والسكربتات
description: مرجع كامل للأوامر المتاحة في موزون وكيفية تشغيلها باستخدام Bun.
order: 3
---

# الأوامر والسكربتات

جميع الأوامر تُنفَّذ عبر **Bun** حصراً.

## سكربتات `package.json`

| السكربت | الأمر | الوظيفة |
| --- | --- | --- |
| `dev` | `bun dev` | خادم التطوير مع إعادة التحميل الفوري |
| `build` | `bun run build` | بناء نسخة الإنتاج (`next build`) |
| `start` | `bun run start` | تشغيل نسخة الإنتاج بعد البناء |
| `lint` | `bun run lint` | فحص الكود بـ ESLint |
| `docs:check` | `bun run docs:check` | فحص التوثيق: ترويسات، ترتيب، وروابط داخلية |
| `engine:check` | `bun run engine:check` | تحقق سلوكي من محرك الفحص (انزياح، سند، حكم، سجل) |
| `build:worker` | `bun run build:worker` | بناء Worker لنشر Cloudflare (OpenNext) |
| `preview` | `bun run preview` | معاينة Worker محليًا |
| `deploy` | `bun run deploy` | نشر Worker على Cloudflare |
| `cf-typegen` | `bun run cf-typegen` | توليد أنواع Cloudflare (`wrangler types`) |
| `preinstall` | يُنفَّذ تلقائياً | حارس Bun-only (لا يُشغَّل يدوياً) |

## أوامر إدارة الاعتماديات

```bash
bun install            # تثبيت جميع الاعتماديات من bun.lock
bun add <pkg>          # إضافة اعتمادية إنتاج
bun add -d <pkg>       # إضافة اعتمادية تطوير
bun remove <pkg>       # إزالة اعتمادية
bunx <tool>            # تشغيل أداة لمرة واحدة (بديل npx)
```

## سير عمل التحقق الإلزامي

قبل أي دفع (push)، شغّل:

```bash
bun run lint           # يجب أن يمرّ بلا أخطاء
bun run docs:check     # يجب أن يمرّ بلا ترويسات ناقصة ولا روابط مكسورة
bun run engine:check   # يجب أن تمرّ كل حالات المحرك
```

هذا مطابق للخطوة السادسة في [سير العمل الإلزامي](/docs/reference/conventions#سير-العمل-الإلزامي).

> `bun run build` و`bun run build:worker` يملكهما مسار البناء، ولا يلزم تشغيلهما لتغيير توثيقي.

## أوامر مستحسنة

```bash
bun dev -- -p 3001     # تشغيل على منفذ مختلف
bunx tsc --noEmit      # تحقّق أنواع يدوي (بدون إخراج)
```

> **تذكير:** أي أمر يعتمد على `npx` يجب استبداله بـ `bunx`، وأي تثبيت يجب أن يبدأ بـ `bun`.
