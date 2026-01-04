import React from "react";
import { AppLabel } from "../text/AppTitle";
import AppTooltip from "../AppTooltip";

export type ItemSelect = {
  value: string | number;
  label: string;
};

interface AppSelectInputProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "data"> {
  title?: string;
  placeholder?: string;
  error?: string;
  data: ItemSelect[];
  tooltip?: string;
  tooltipPosition?: "top" | "right" | "bottom" | "left";
}

const AppOption = ({ value, label }: ItemSelect) => {
  return (
    <option className="text-sm text-gray-800" value={value}>
      {label}
    </option>
  );
};

const AppSelectInput = ({
  title,
  required,
  placeholder,
  error,
  className,
  data,
  value,
  defaultValue,
  tooltip,
  tooltipPosition = "top",
  ...props
}: AppSelectInputProps) => {
  const isControlled = value !== undefined;

  return (
    <div className="w-full flex flex-col gap-1">
      <div className="flex gap-2">
        {title && <AppLabel text={title} />}
        {required && <span className="text-red-500">*</span>}
        {tooltip && (
          <AppTooltip text={tooltip} tooltipPosition={tooltipPosition} />
        )}
      </div>

      <div className="relative">
        <select
          {...props}
          value={isControlled ? value : undefined}
          defaultValue={!isControlled ? (defaultValue ?? "") : undefined}
          className={[
            "h-11 w-full rounded-lg",
            "px-3 pr-10",
            "border-2",
            "bg-white text-sm",
            "appearance-none",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              : "border-gray-200 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
            "text-gray-900 dark:bg-slate-900 dark:text-gray-100 dark:border-slate-700 dark:focus:ring-blue-900/40",
            "outline-none transition",
            className ?? "",
          ].join(" ")}
        >
          {placeholder ? (
            <option value="" disabled className="text-gray-400">
              {placeholder}
            </option>
          ) : (
            <option value="" />
          )}

          {data?.map((item) => (
            <AppOption key={String(item.value)} {...item} />
          ))}
        </select>

        <svg
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-500"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </div>
  );
};

export default AppSelectInput;
