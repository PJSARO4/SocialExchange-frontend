/**
 * SYN capability registry — what Social Exchange can and cannot actually do.
 *
 * SYN-0 SCOPE: DECLARATION ONLY. This file describes capabilities. It does not
 * invoke any of them, and nothing imports it into an execution path yet.
 *
 * The reason this exists before any executor does: the failure mode of a
 * planning system is confidently proposing work the product cannot perform.
 * SYN must be able to say "opportunity identified, but Social Exchange cannot
 * execute this yet" — which requires an honest, machine-readable inventory that
 * distinguishes REAL from MOCKED. Every `status` below was verified against the
 * codebase during the SYN architecture audit, not assumed.
 */

/** How dangerous is invoking this, and what gate does it need? */
export type CapabilityPermission =
  | 'READ'               // No side effects. Safe at any control mode.
  | 'APPROVAL_REQUIRED'  // Writes something recoverable. Needs an explicit human OK.
  | 'RESTRICTED'         // Schedules real future actions. Needs ESCROW or above.
  | 'HIGH_RISK';         // Irreversible and public. Needs explicit per-action confirmation.

/**
 * REAL      backed by working code, verified end to end
 * PARTIAL   works, but with a known stub or gap in the path
 * MOCKED    UI exists, behaviour is fake — SYN must never present it as usable
 * ABSENT    does not exist at all
 */
export type CapabilityStatus = 'REAL' | 'PARTIAL' | 'MOCKED' | 'ABSENT';

export type CapabilityMaturity = 'NONE' | 'BASIC' | 'PROVEN';

export interface SynCapability {
  id: string;
  /** One line SYN can quote to the operator. */
  summary: string;
  status: CapabilityStatus;
  permission: CapabilityPermission;
  maturity: CapabilityMaturity;
  /** Where the capability actually lives. Audit trail for future maintainers. */
  implementation: string;
  /** True only when status === 'REAL' or 'PARTIAL'. Convenience for SYN. */
  available: boolean;
  /** Why it is unavailable, if it is. SYN quotes this verbatim. */
  unavailableReason?: string;
  /** Anything a human should know before approving. */
  approvalNotes?: string;
}

const cap = (c: Omit<SynCapability, 'available'>): SynCapability => ({
  ...c,
  available: c.status === 'REAL' || c.status === 'PARTIAL',
});

export const SYN_CAPABILITIES: Record<string, SynCapability> = {
  analyzeFeed: cap({
    id: 'analyzeFeed',
    summary: 'Read a feed’s cached metrics and historical follower/engagement series.',
    status: 'REAL',
    permission: 'READ',
    maturity: 'PROVEN',
    implementation: 'GET /api/feeds, GET /api/feeds/[id]/metrics, FeedMetricsHistory',
  }),

  readInstagramInsights: cap({
    id: 'readInstagramInsights',
    summary: 'Read live Instagram profile, media and insights data.',
    status: 'REAL',
    permission: 'READ',
    maturity: 'PROVEN',
    implementation: 'GET /api/instagram/{profile,media,insights,analytics,recent}',
    approvalNotes: 'Consumes Instagram Graph API quota.',
  }),

  readCompetitors: cap({
    id: 'readCompetitors',
    summary: 'Read tracked competitor accounts via Instagram business_discovery.',
    status: 'REAL',
    permission: 'READ',
    maturity: 'BASIC',
    implementation: 'GET /api/competitors',
  }),

  inspectStorage: cap({
    id: 'inspectStorage',
    summary: 'Browse the connected Google Drive folders and list stored content.',
    status: 'REAL',
    permission: 'READ',
    maturity: 'PROVEN',
    implementation: 'GET /api/google/files -> listDrive()',
  }),

  readScheduledPosts: cap({
    id: 'readScheduledPosts',
    summary: 'Read what is already queued to post and when.',
    status: 'REAL',
    permission: 'READ',
    maturity: 'PROVEN',
    implementation: 'GET /api/scheduler, ScheduledPostNew',
  }),

  generateMemes: cap({
    id: 'generateMemes',
    summary: 'Generate meme candidates from a subject using the Content Lab engine.',
    status: 'REAL',
    permission: 'APPROVAL_REQUIRED',
    maturity: 'BASIC',
    implementation: 'app/cockpit/meme-lab: captions.generate() + render.renderMeme()',
    approvalNotes:
      'Renders on <canvas> in the browser. Cannot run server-side or on a cron ' +
      'without a server-side rasterizer, so SYN cannot generate unattended.',
  }),

  saveToDrive: cap({
    id: 'saveToDrive',
    summary: 'Convert generated content to JPEG and store it in a chosen Drive folder.',
    status: 'REAL',
    permission: 'APPROVAL_REQUIRED',
    maturity: 'PROVEN',
    implementation: 'POST /api/meme-lab/to-drive -> uploadDriveFile()',
    approvalNotes: 'Writes files into the user’s own Google Drive. Storage only — never schedules.',
  }),

  scheduleContent: cap({
    id: 'scheduleContent',
    summary: 'Create scheduled posts from stored content.',
    status: 'REAL',
    permission: 'RESTRICTED',
    maturity: 'PROVEN',
    implementation: 'POST /api/scheduler; POST /api/automation/bulk-schedule',
    approvalNotes:
      'Creates rows the publish cron will act on. Requires ESCROW or above plus ' +
      'explicit human approval of the exact slots.',
  }),

  publishInstagram: cap({
    id: 'publishInstagram',
    summary: 'Publish a post to Instagram.',
    status: 'REAL',
    permission: 'HIGH_RISK',
    maturity: 'PROVEN',
    implementation: 'GET /api/cron/publish-scheduled; POST /api/instagram/publish',
    approvalNotes:
      'IRREVERSIBLE AND PUBLIC. SYN must never invoke this directly in any ' +
      'control mode without a per-action human confirmation.',
  }),

  moveDriveFile: cap({
    id: 'moveDriveFile',
    summary: 'Move a Drive file between folders (e.g. to_post -> posted).',
    status: 'REAL',
    permission: 'APPROVAL_REQUIRED',
    maturity: 'BASIC',
    implementation: 'POST /api/google/move -> moveDriveFile()',
    approvalNotes: 'Moves the operator’s original files. Requires Drive write scope.',
  }),

  readActivityLogs: cap({
    id: 'readActivityLogs',
    summary: 'Read system activity logs.',
    status: 'PARTIAL',
    permission: 'READ',
    maturity: 'BASIC',
    implementation: 'GET /api/logs',
    unavailableReason:
      'Logs are keyed to a hardcoded TEMP_USER_ID, so they are not per-user. ' +
      'SYN must not present them as this account’s history.',
  }),

  discoverContent: cap({
    id: 'discoverContent',
    summary: 'Search public image/video sources for reference material.',
    status: 'PARTIAL',
    permission: 'READ',
    maturity: 'BASIC',
    implementation: 'POST /api/organism/scrape (Unsplash, Pexels)',
    unavailableReason:
      'Returns nothing unless UNSPLASH_ACCESS_KEY / PEXELS_API_KEY are configured.',
  }),

  generateVideo: cap({
    id: 'generateVideo',
    summary: 'Generate video content.',
    status: 'ABSENT',
    permission: 'APPROVAL_REQUIRED',
    maturity: 'NONE',
    implementation: '—',
    unavailableReason: 'Social Exchange has no video generation capability.',
  }),

  linkEx: cap({
    id: 'linkEx',
    summary: 'Create trackable short links / link-in-bio pages.',
    status: 'MOCKED',
    permission: 'APPROVAL_REQUIRED',
    maturity: 'NONE',
    implementation: 'LinkExModal.tsx — short codes are Math.random(), nothing is persisted',
    unavailableReason:
      'LinkEx is a UI mock. Short URLs are generated at random and resolve to nothing. ' +
      'SYN must never propose a strategy that depends on link tracking.',
  }),

  workflowChains: cap({
    id: 'workflowChains',
    summary: 'Build and run multi-step automation chains.',
    status: 'MOCKED',
    permission: 'RESTRICTED',
    maturity: 'NONE',
    implementation: 'AutomationModal chain builder — chains persist to localStorage only',
    unavailableReason:
      'Chains are saved in the browser and have no server-side executor. ' +
      'Nothing runs them. SYN must not treat chains as automation.',
  }),

  writeFeedProfile: cap({
    id: 'writeFeedProfile',
    summary: 'Persist a FeedProfile.',
    status: 'ABSENT',
    permission: 'APPROVAL_REQUIRED',
    maturity: 'NONE',
    implementation: '— (contract defined in app/syn/feed-profile.ts)',
    unavailableReason: 'FeedProfile has a contract but no storage yet.',
  }),
};

/** Capabilities SYN may use with no human in the loop. */
export function readOnlyCapabilities(): SynCapability[] {
  return Object.values(SYN_CAPABILITIES).filter(
    c => c.available && c.permission === 'READ'
  );
}

/** Things SYN must openly decline. */
export function unavailableCapabilities(): SynCapability[] {
  return Object.values(SYN_CAPABILITIES).filter(c => !c.available);
}

/**
 * The honesty check. Before SYN proposes a plan, every capability the plan needs
 * goes through here; anything not `ok` must be surfaced to the operator rather
 * than glossed over.
 */
export function checkCapability(id: string): {
  ok: boolean;
  capability?: SynCapability;
  message?: string;
} {
  const c = SYN_CAPABILITIES[id];
  if (!c) {
    return { ok: false, message: `Unknown capability "${id}".` };
  }
  if (!c.available) {
    return {
      ok: false,
      capability: c,
      message:
        c.unavailableReason ??
        `Social Exchange does not currently have the execution capability for "${id}".`,
    };
  }
  return { ok: true, capability: c };
}

/**
 * SYN-0 GATE: no capability is wired to an executor. This constant exists so
 * that any future code path which tries to *act* fails loudly and on purpose
 * rather than acting by accident.
 */
export const SYN_EXECUTION_ENABLED = false as const;
