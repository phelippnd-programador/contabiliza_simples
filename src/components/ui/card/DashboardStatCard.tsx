import React from "react";
import Card from "./Card";

type DashboardStatCardProps = {
  title: string;
  value: string;
  helper?: string;
  tone?: "blue" | "green" | "amber" | "purple";
  icon?: React.ReactNode;
};

const iconToneClasses: Record<
  NonNullable<DashboardStatCardProps["tone"]>,
  string
> = {
  blue: "text-blue-600 bg-blue-100",
  green: "text-emerald-600 bg-emerald-100",
  amber: "text-amber-600 bg-amber-100",
  purple: "text-purple-600 bg-purple-100",
};

const DashboardStatCard = ({
  title,
  value,
  helper,
  tone = "blue",
  icon,
}: DashboardStatCardProps) => {
  return (
    <Card tone={tone} className="p-1 gap-2 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
        </div>
        {icon ? (
          <span
            className={[
              "inline-flex h-10 w-10 items-center justify-center rounded-full text-lg",
              iconToneClasses[tone],
            ].join(" ")}
          >
            {icon}
          </span>
        ) : null}
      </div>
      {helper ? <p className="text-xs text-gray-500">{helper}</p> : null}
    </Card>
  );
};

export default DashboardStatCard;
