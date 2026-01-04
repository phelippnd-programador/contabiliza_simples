import React, { type ReactNode } from "react";

type CardTone = "default" | "blue" | "green" | "amber" | "purple";

interface CardProps {
    children: ReactNode | ReactNode[];
    className?: string;
    tone?: CardTone;
}

const toneClasses: Record<CardTone, string> = {
    default: "border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-950",
    blue: "border border-blue-100 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/40",
    green: "border border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/40",
    amber: "border border-amber-100 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/40",
    purple: "border border-purple-100 bg-purple-50/60 dark:border-purple-900/40 dark:bg-purple-950/40",
};

const Card = ({ children, className, tone = "default" }: CardProps) => {
    return (
        <div
            className={[
                "flex w-full flex-col gap-5 rounded overflow-hidden shadow-lg p-10",
                "text-gray-900 dark:text-gray-100",
                toneClasses[tone],
                className ?? "",
            ].join(" ")}
        >
            {children}
        </div>
    );
};

export default Card;
