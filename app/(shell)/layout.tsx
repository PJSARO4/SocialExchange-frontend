import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* Mission Control Header */}
        <header className="h-12 border-b border-neutral-800 flex items-center justify-center text-xs tracking-widest text-neutral-400">
          SOCIAL EXCHANGE · MISSION CONTROL
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
