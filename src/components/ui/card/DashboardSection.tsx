import React from "react";

type DashboardSectionProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const DashboardSection = ({ title, subtitle, children }: DashboardSectionProps) => {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-base font-medium text-slate-900 dark:text-slate-100">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
};

export default DashboardSection;
