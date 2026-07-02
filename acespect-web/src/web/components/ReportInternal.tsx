import { INTERNAL_BLOCKS } from "../reportInternal";
import { ReportBlocks } from "./ReportBlocks";

/** The INTERNAL report body template. `compact` shrinks it for the panel. */
export function ReportInternal({ compact = false }: { compact?: boolean }) {
  return <ReportBlocks blocks={INTERNAL_BLOCKS} compact={compact} />;
}
