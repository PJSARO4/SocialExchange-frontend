import CockpitHeader from '@/components/CockpitHeader';

export default function CockpitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="cockpit-shell">
      <CockpitHeader />
      <main className="cockpit-content">{children}</main>
    </div>
  );
}
