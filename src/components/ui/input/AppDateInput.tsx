import React, { forwardRef } from "react";
import { AppLabel } from "../text/AppTitle";
import AppTooltip from "../AppTooltip";

interface AppDateInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  title?: string;
  error?: string;
  helperText?: string;
  tooltip?: string;
  tooltipPosition?: "top" | "right" | "bottom" | "left";
}

const AppDateInput = forwardRef<HTMLInputElement, AppDateInputProps>(
  (
    {
      title,
      required,
      error,
      className,
      tooltip,
      tooltipPosition = "top",
      helperText,
      ...props
    },
    ref
  ) => {
    return (
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center gap-2">
          {title && <AppLabel text={title} />}
          {required && <span className="text-red-500">*</span>}
          {tooltip && (
            <AppTooltip text={tooltip} tooltipPosition={tooltipPosition} />
          )}
        </div>

        <input
          ref={ref}
          {...props}
          type={props.type ?? "date"}
          className={[
            props.disabled ? "bg-gray-100 cursor-not-allowed" : "",
            "h-11 w-full rounded-lg px-3 text-sm border-2",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              : "border-gray-200 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
            "outline-none transition",
            className ?? "",
          ].join(" ")}
        />

        {error ? (
          <span className="text-xs text-red-600">{error}</span>
        ) : (
          helperText && <span className="text-xs text-gray-500">{helperText}</span>
        )}
      </div>
    );
  }
);

AppDateInput.displayName = "AppDateInput";

export default AppDateInput;
