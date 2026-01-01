import React, { forwardRef } from "react";
import { AppLabel } from "../text/AppTitle";
import AppTooltip from "../AppTooltip";

interface AppTextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  title?: string;
  error?: string;
  sanitizeRegex?: RegExp;
  formatter?: (raw: string) => string;
  onValueChange?: (raw: string) => void;
  helperText?: string;
  tooltip?: string;
  tooltipPosition?: "top" | "right" | "bottom" | "left";
}

const AppTextInput = forwardRef<HTMLInputElement, AppTextInputProps>(
  (
    {
      title,
      required,
      error,
      className,
      sanitizeRegex,
      formatter,
      onChange,
      onValueChange,
      tooltip,
      tooltipPosition = "top",
      helperText,
      ...props
    },
    ref
  ) => {
    const [display, setDisplay] = React.useState<string>(
      props.value?.toString() ?? ''
    );

    React.useEffect(() => {
      if (props.value !== undefined && props.value !== null) {
        setDisplay(props.value.toString());
      }
    }, [props.value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = e.target.value;
      let raw = v;

      if (sanitizeRegex) {
        const matches = v.match(sanitizeRegex);
        raw = matches ? matches.join("") : "";
      }

      if (formatter) {
        v = formatter(raw);
      }
      e.target.value = v;
      setDisplay(v);
      onValueChange?.(raw);
      onChange?.(e);
    };

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
          onChange={handleChange}
          value={display}
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

AppTextInput.displayName = "AppTextInput";

export default AppTextInput;
