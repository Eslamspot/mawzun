import { PageShell } from "@/components/ui/PageShell";
import { AuditWorkspace } from "@/components/audit/AuditWorkspace";

export const metadata = {
  title: "04 الحكم | موزون",
  description: "حكم واحد بثلاث حالات، ومعه السبب والموضع والدليل.",
};

export default function VerdictStagePage() {
  return (
    <PageShell width="7xl">
      <AuditWorkspace step="verdict" />
    </PageShell>
  );
}
