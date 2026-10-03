---
title: الاصطلاحات البرمجية
description: قواعد كتابة الكود والالتزامات الإلزامية (الفروع، الوسوم، الأرشفة، مدير الحزم).
order: 1
---

# الاصطلاحات البرمجية

## نمط الكود

- **TypeScript صرف** — لا `any` ولا `@ts-ignore` بلا مبرّر موثّق.
- **Server Components افتراضياً** — لا تُضف `"use client"` إلا عند الحاجة لتفاعل فعلي
  (حالة، تأثير، مستمعو أحداث، أو hooks مثل `usePathname`).
- **الاستيراد المطلق** — استخدم بادئة `@/` المعرّفة في `tsconfig.json` بدل المسارات النسبية.
- **دمج الأصناف** — استعمل `cx()` من `@/lib/cx` لدمج أصناف Tailwind الشرطية.
- **الطباعة** — لا تكتب مقاسات خطوط يدوياً؛ استخدم الأدوار من `t` في `@/lib/typography`.
- **الأيقونات** — استخدم مكوّن `Icon` في `@/components/ui/Icon` بدل كتابة ligature يدوياً.
- **التوثيق** — أضف تعليقاً موجزاً لأي منطق غير بديهي، بصيغة JSDoc مختصرة.

### مثال

```tsx
import { cx } from "@/lib/cx";
import { t } from "@/lib/typography";
import { Icon } from "@/components/ui/Icon";

export function StatusPill({ active }: { active: boolean }) {
  return (
    <span className={cx("inline-flex items-center gap-1", t.labelSm, active && "text-primary")}>
      <Icon name="verified" className="text-sm" filled={active} />
      {active ? "نشط" : "معلّق"}
    </span>
  );
}
```

## تسمية الملفات والرموز

- المكوّنات: `PascalCase.tsx` (`AuditWorkspace.tsx`).
- الأدوات والمنطق: `camelCase.ts` (`stages.ts`, `typography.ts`).
- الأنواع: `PascalCase`؛ الثوابت: `UPPER_SNAKE_CASE`.

## الوسوم والأرشفة

قبل تعديل أو حذف أي ملف:

```bash
# 1) وسم للحالة قبل التغيير
git tag -a pre-<scope>-<YYYY-MM-DD> -m "snapshot before <description>"

# 2) أرشفة الملف مع الحفاظ على مساره
mkdir -p archive/$(date +%Y%m%d)
cp --parents src/path/to/file.tsx archive/$(date +%Y%m%d)/
```

الرجوع للحالة السابقة:

```bash
git diff <tag>..HEAD              # مقارنة
git checkout <tag> -- <path>      # استعادة ملف
git switch --detach <tag>         # استعادة كاملة
```

## الفروع

- فرع `main` **محمي**: يُمنع تعديله مباشرة عدا تحديثات التوثيق (Markdown).
- كل تغيير آخر يبدأ من فرع مستقل بتسمية `<type>/<kebab-desc>` حيث `type` هو أحد:
  `feat`, `fix`, `chore`, `refactor`, `docs`.

```bash
git switch -c feat/audit-layer-2
```

## سير العمل الإلزامي

1. تأكّد من نظافة الشجرة: `git status`.
2. أنشئ الوسم ([فوق](#الوسوم-والأرشفة)).
3. أرشف الملفات المتأثّرة.
4. أنشئ فرعاً مستقلاً (إلا لتوثيق على `main`).
5. نفّذ التغيير باستخدام **Bun فقط**.
6. تحقّق: `bun run lint` ثم `bun run build`.
7. التزم (commit) وادفع (push) الفرع.

> لا تخلط تغييرات غير مترابطة في نفس الفرع أو الالتزام.

القواعد الكاملة المُلزمة في [`AGENTS.md`](https://github.com/Eslamspot/mawzun/blob/main/AGENTS.md).
