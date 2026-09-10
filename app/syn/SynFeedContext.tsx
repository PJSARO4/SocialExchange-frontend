'use client';

/**
 * SYN feed context — "which account is the operator working on right now?"
 *
 * SYN-0 SCOPE: context plumbing only. This carries identity, nothing more.
 * It grants no permissions and performs no actions.
 *
 * Why a separate provider rather than adding fields to OrganismContext:
 * OrganismContext owns SYN's own state (mood, tasks, chat). This owns a fact
 * about the *host application* — which feed the UI is focused on. Keeping them
 * apart means SYN's brain does not have to re-render when the user clicks a
 * different feed, and later intelligence layers (FeedProfile, metrics,
 * competitor intel, storage inventory) can subscribe to this one small object
 * rather than to all of SYN.
 *
 * Why not read FeedsContext directly: FeedsContext is mounted inside the
 * My Feeds route only. SYN is global. A publisher/subscriber split is the only
 * way for a globally-mounted panel to learn about route-local state without
 * hoisting FeedsContext up to the root (which would change app structure).
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

/** Everything SYN is allowed to know about the focused feed in SYN-0. */
export interface SynFeedContextValue {
  feedId: string;
  handle: string;
  platform: string;
  /** Lowercase ControlMode as used by the feeds UI ('manual' | 'escrow' | ...) */
  controlMode: string;
  displayName?: string;
}

/** The full context object SYN reads. `feed` is null in general cockpit context. */
export interface SynContextSnapshot {
  feed: SynFeedContextValue | null;
  /** Cockpit section derived from the route, e.g. 'meme-lab', 'my-e-assets'. */
  section: string | null;
}

interface SynFeedContextType {
  synContext: SynContextSnapshot;
  /** Called by route-local UI when the focused feed changes. */
  setSynFeed: (feed: SynFeedContextValue | null) => void;
  setSynSection: (section: string | null) => void;
}

const SynFeedContext = createContext<SynFeedContextType | undefined>(undefined);

export function SynFeedProvider({ children }: { children: ReactNode }) {
  const [feed, setFeed] = useState<SynFeedContextValue | null>(null);
  const [section, setSection] = useState<string | null>(null);

  const setSynFeed = useCallback((next: SynFeedContextValue | null) => {
    setFeed(prev => {
      // Reference-stable when nothing meaningful changed, so subscribers of
      // this context do not re-render on every parent render.
      if (prev === next) return prev;
      if (
        prev && next &&
        prev.feedId === next.feedId &&
        prev.handle === next.handle &&
        prev.platform === next.platform &&
        prev.controlMode === next.controlMode &&
        prev.displayName === next.displayName
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const setSynSection = useCallback((next: string | null) => {
    setSection(prev => (prev === next ? prev : next));
  }, []);

  const value = useMemo<SynFeedContextType>(
    () => ({ synContext: { feed, section }, setSynFeed, setSynSection }),
    [feed, section, setSynFeed, setSynSection]
  );

  return (
    <SynFeedContext.Provider value={value}>{children}</SynFeedContext.Provider>
  );
}

/**
 * Read the current SYN context. Safe to call outside the provider — returns an
 * empty context rather than throwing, so SYN never crashes a page that has not
 * been wired up yet.
 */
export function useSynContext(): SynContextSnapshot {
  const ctx = useContext(SynFeedContext);
  return ctx?.synContext ?? { feed: null, section: null };
}

/** Publish into SYN context. No-ops outside the provider. */
export function useSynContextPublisher(): {
  setSynFeed: (feed: SynFeedContextValue | null) => void;
  setSynSection: (section: string | null) => void;
} {
  const ctx = useContext(SynFeedContext);
  return {
    setSynFeed: ctx?.setSynFeed ?? (() => {}),
    setSynSection: ctx?.setSynSection ?? (() => {}),
  };
}
