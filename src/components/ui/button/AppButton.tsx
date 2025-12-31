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
            className={"w-full h-11 rounded-lg border border-gray-200 active:shadow-sm active:bg-gray-50 px-4 text-sm hover:border-blue-500 " + (className ?? "")}
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
