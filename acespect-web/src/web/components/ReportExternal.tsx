import { EXTERNAL_BLOCKS } from "../reportExternal";
import { ReportBlocks } from "./ReportBlocks";

/** The EXTERNAL report body template. `compact` shrinks it for the panel. */
export function ReportExternal({ compact = false }: { compact?: boolean }) {
  return <ReportBlocks blocks={EXTERNAL_BLOCKS} compact={compact} />;
}
