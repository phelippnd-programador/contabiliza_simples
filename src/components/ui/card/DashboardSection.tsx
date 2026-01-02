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
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
};

export default DashboardSection;
