import React from "react";

type Variant = "default" | "primary" | "danger";

type AppIconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ReactNode;
  label: string;
  variant?: Variant;
};

const variantClasses: Record<Variant, string> = {
  default:
    "border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-gray-200 dark:hover:border-blue-400",
  primary:
    "border-blue-200 text-blue-600 hover:border-blue-400 hover:text-blue-700 dark:border-blue-900/60 dark:text-blue-200 dark:hover:border-blue-400",
  danger:
    "border-red-200 text-red-600 hover:border-red-400 hover:text-red-700 dark:border-red-900/60 dark:text-red-200 dark:hover:border-red-400",
};

const AppIconButton = ({
  icon,
  label,
  variant = "default",
  className,
  type = "button",
  ...props
}: AppIconButtonProps) => {
  return (
    <button
      {...props}
      type={type}
      aria-label={label}
      title={label}
      className={[
        "inline-flex items-center justify-center",
        "h-9 w-9 rounded-full border",
        "bg-white transition focus:outline-none focus:ring-2 focus:ring-blue-200",
        "dark:bg-slate-900 dark:focus:ring-blue-900/40",
        variantClasses[variant],
        className ?? "",
      ].join(" ")}
    >
      {icon}
    </button>
  );
};

export default AppIconButton;
