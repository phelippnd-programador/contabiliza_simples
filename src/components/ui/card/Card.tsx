import React, { type ReactNode } from "react";

type CardTone = "default" | "blue" | "green" | "amber" | "purple";

interface CardProps {
    children: ReactNode | ReactNode[];
    className?: string;
    tone?: CardTone;
}

const toneClasses: Record<CardTone, string> = {
    default: "border border-slate-200/70 bg-white/85 dark:border-slate-800/70 dark:bg-slate-950/70",
    blue: "border border-blue-200/60 bg-blue-50/70 dark:border-blue-900/40 dark:bg-blue-950/40",
    green: "border border-emerald-200/60 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/40",
    amber: "border border-amber-200/60 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/40",
    purple: "border border-purple-200/60 bg-purple-50/70 dark:border-purple-900/40 dark:bg-purple-950/40",
};

const Card = ({ children, className, tone = "default" }: CardProps) => {
    return (
        <div
            className={[
                "flex w-full flex-col gap-5 rounded-2xl overflow-hidden p-8",
                "text-slate-900 dark:text-slate-100",
                "shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur",
                toneClasses[tone],
                className ?? "",
            ].join(" ")}
        >
            {children}
        </div>
    );
};

export default Card;
