import React from "react";

interface AppButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
}

const AppButton = ({
    children,
    loading,
    className,
    disabled,
    ...props
}: AppButtonProps) => {
    return (
        <button
            {...props}
            disabled={disabled || loading}
            className={[
                "w-full h-11 rounded-xl px-4 text-sm font-medium",
                "border border-slate-200/70 bg-white/90 text-slate-800",
                "shadow-sm transition-all hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-md",
                "active:translate-y-0 active:shadow-sm",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-100",
                "dark:hover:border-slate-600 dark:hover:bg-slate-900",
                className ?? "",
            ].join(" ")}
        // className={[
        //     "w-full",
        //     "h-11 px-6 rounded-lg",
        //     "bg-blue-900 text-white font-semibold",
        //     "transition",
        //     "hover:bg-blue-800",
        //     "active:scale-[0.98]",
        //     "focus:outline-none focus:ring-2 focus:ring-blue-200",
        //     "disabled:opacity-50 disabled:cursor-not-allowed",
        //     className ?? "",
        // ].join(" ")}
        >
            {loading ? "Carregando..." : children}
        </button>
    );
};

export default AppButton;
