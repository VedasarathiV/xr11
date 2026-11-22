import type { IntegrationStatus } from "./api";

/**
 * Repair is for the native host registration or an outdated extension. When the host is ready
 * but no extension has checked in, the user needs to load/enable the extension, not repair it.
 */
export function needsRepair(status: IntegrationStatus | null): boolean {
  if (!status) return false;
  if (status.extensionOutdated) return true;
  return status.browsers.some((b) => b.installed && b.supported !== false && !(b.registered && b.pointsToThisHost));
}
