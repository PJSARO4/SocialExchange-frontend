"use client";

import React from "react";

type Props = {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
};

export default function HomeModuleCard({
  title,
  description,
  icon,
  className = "",
}: Props): JSX.Element {
  return (
    <article
      role="button"
      tabIndex={0}
      className={`w-full rounded-3xl bg-slate-800 border border-slate-700 p-6 min-h-[10rem] flex flex-col items-start justify-start gap-4 overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 transition-colors transition-shadow ${className} hover:bg-slate-700/60 hover:border-slate-500`}
    >
      <div className="flex-shrink-0 self-start h-12 w-12 rounded-xl bg-slate-700/50 ring-1 ring-slate-700 flex items-center justify-center text-2xl">
        {icon ?? null}
      </div>

      <h3 className="text-lg font-semibold text-white">{title}</h3>

      <p className="mt-1 text-sm text-slate-300 leading-relaxed">{description}</p>
    </article>
  );
}
