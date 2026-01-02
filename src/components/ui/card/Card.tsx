import React, { type ReactNode } from "react";

type CardTone = "default" | "blue" | "green" | "amber" | "purple";

interface CardProps {
    children: ReactNode | ReactNode[];
    className?: string;
    tone?: CardTone;
}

const toneClasses: Record<CardTone, string> = {
    default: "border border-gray-200 bg-white",
    blue: "border border-blue-100 bg-blue-50/60",
    green: "border border-emerald-100 bg-emerald-50/60",
    amber: "border border-amber-100 bg-amber-50/60",
    purple: "border border-purple-100 bg-purple-50/60",
};

const Card = ({ children, className, tone = "default" }: CardProps) => {
    return (
        <div
            className={[
                "flex w-full flex-col gap-5 rounded overflow-hidden shadow-lg p-10",
                toneClasses[tone],
                className ?? "",
            ].join(" ")}
        >
            {children}
        </div>
    );
};

export default Card;
