import { PageShell } from "@/components/ui/PageShell";
import { AuditWorkspace } from "@/components/audit/AuditWorkspace";

export const metadata = {
  title: "03 الفحص بثلاث طبقات | موزون",
  description: "طبقة حتمية، وطبقة معجمية، وطبقة دلالية — كل طبقة معروضة على حدة.",
};

export default function CheckStagePage() {
  return (
    <PageShell width="7xl">
      <AuditWorkspace step="check" />
    </PageShell>
  );
}
