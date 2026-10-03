import { AuditWorkspace } from "@/components/audit/AuditWorkspace";

/**
 * The whole workflow lives on one page: the design is a single scrolling
 * workspace with a numbered section per stage and an anchor-based stepper.
 */
export default function Home() {
  return <AuditWorkspace />;
}