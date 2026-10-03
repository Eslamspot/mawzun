import { PageShell } from "@/components/ui/PageShell";
import { AuditWorkspace } from "@/components/audit/AuditWorkspace";

export const metadata = {
  title: "05 السجل والتحقق | موزون",
  description: "سجل قابل لإعادة التشغيل، وبصمة تشفيرية، وقرار المراجع البشري.",
};

export default function RecordStagePage() {
  return (
    <PageShell width="7xl">
      <AuditWorkspace step="record" />
    </PageShell>
  );
}
