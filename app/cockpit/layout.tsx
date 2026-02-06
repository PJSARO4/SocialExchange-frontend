/**
 * Cockpit Layout (Server Component)
 *
 * Forces dynamic rendering for the entire /cockpit route tree.
 * This prevents build-time static generation failures caused by
 * client components that depend on localStorage and browser APIs.
 *
 * The actual layout UI is in CockpitLayoutClient.tsx.
 */
import CockpitLayoutClient from './CockpitLayoutClient';

export const dynamic = 'force-dynamic';

export default function CockpitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CockpitLayoutClient>{children}</CockpitLayoutClient>;
}
