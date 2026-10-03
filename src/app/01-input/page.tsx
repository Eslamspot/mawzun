import { PageShell } from "@/components/ui/PageShell";
import { AuditWorkspace } from "@/components/audit/AuditWorkspace";

export const metadata = {
  title: "01 المدخلات الأربعة | موزون",
  description: "النص الأصلي والنص المشتق ونوع العمل ومستوى المحتوى.",
};

export default function InputStagePage() {
  return (
    <PageShell width="7xl">
      <AuditWorkspace step="input" />
    </PageShell>
  );
}
