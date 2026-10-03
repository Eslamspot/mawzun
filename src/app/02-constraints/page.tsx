import { PageShell } from "@/components/ui/PageShell";
import { AuditWorkspace } from "@/components/audit/AuditWorkspace";

export const metadata = {
  title: "02 بنك القيود | موزون",
  description: "القيود الخمسة المستوردة من الحزمة العلمية المعتمدة، مع أصل كل قيد.",
};

export default function ConstraintsStagePage() {
  return (
    <PageShell width="7xl">
      <AuditWorkspace step="constraints" />
    </PageShell>
  );
}
