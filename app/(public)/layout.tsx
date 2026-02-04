// Force dynamic rendering for all (public) routes - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
