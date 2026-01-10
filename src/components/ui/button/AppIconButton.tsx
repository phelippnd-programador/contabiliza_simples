import React from "react";

type Variant = "default" | "primary" | "danger";

type AppIconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ReactNode;
  label: string;
  variant?: Variant;
};

const variantClasses: Record<Variant, string> = {
  default:
    "border-slate-200/70 text-slate-700 hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-500",
  primary:
    "border-sky-200 text-sky-700 hover:border-sky-300 hover:text-sky-800 dark:border-sky-900/60 dark:text-sky-200 dark:hover:border-sky-400",
  danger:
    "border-rose-200 text-rose-600 hover:border-rose-300 hover:text-rose-700 dark:border-rose-900/60 dark:text-rose-200 dark:hover:border-rose-400",
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
        "h-10 w-10 rounded-xl border",
        "bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        "focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-1 focus:ring-offset-white",
        "dark:bg-slate-900/80 dark:focus:ring-sky-900/40 dark:focus:ring-offset-slate-950",
        variantClasses[variant],
        className ?? "",
      ].join(" ")}
    >
      {icon}
    </button>
  );
};

export default AppIconButton;
