"use client";

import HomeModuleCard from "@/components/home/HomeModuleCard";

type ModuleCard = {
  id: string;
  title: string;
  description: string;
  icon?: string | React.ReactNode;
};

const MODULES: ModuleCard[] = [
  {
    id: "marketplace",
    title: "Marketplace",
    description:
      "Discover, list, and trade social assets with secure workflows and clear permissions.",
    icon: "🛒",
  },
  {
    id: "automation",
    title: "Automation",
    description:
      "Automate publishing, engagement, and exchange flows using reliable, auditable actions.",
    icon: "⚙️",
  },
  {
    id: "analytics",
    title: "Analytics",
    description:
      "Measure performance, attribution, and growth across profiles and campaigns.",
    icon: "📊",
  },
];

export default function HomeModules(): JSX.Element {
  return (
    <section className="w-full">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
            Platform Capabilities
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl">
            Core modules that enable secure exchanges, automated workflows, and concise
            insights for teams and creators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {MODULES.map(({ id, title, description, icon }) => (
            <HomeModuleCard
              key={id}
              title={title}
              description={description}
              icon={typeof icon === "string" ? <span aria-hidden>{icon}</span> : icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
