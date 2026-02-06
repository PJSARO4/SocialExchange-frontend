/**
 * Auth Layout (Server Component)
 *
 * Forces dynamic rendering for auth pages to prevent
 * build-time static generation failures (useSearchParams, etc.).
 */
export const dynamic = 'force-dynamic';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
