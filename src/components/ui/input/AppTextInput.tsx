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
  maxRawLength?: number;
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
      maxRawLength,
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
    const [rawValue, setRawValue] = React.useState<string>(() => {
      const base = props.value?.toString() ?? "";
      if (!sanitizeRegex) return base;
      const matches = base.match(sanitizeRegex);
      return matches ? matches.join("") : "";
    });

    React.useEffect(() => {
      if (props.value !== undefined && props.value !== null) {
        const nextRaw = props.value.toString();
        const rawDigits = sanitizeRegex
          ? (nextRaw.match(sanitizeRegex)?.join("") ?? "")
          : nextRaw;
        const nextDisplay = formatter ? formatter(rawDigits) : nextRaw;
        setDisplay(nextDisplay);
        setRawValue(rawDigits);
      }
    }, [props.value, sanitizeRegex, formatter]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = e.target.value;
      let raw = v;

      if (sanitizeRegex) {
        const matches = v.match(sanitizeRegex);
        raw = matches ? matches.join("") : "";
      }

      if (maxRawLength && raw.length > maxRawLength) {
        raw = raw.slice(0, maxRawLength);
      }

      if (formatter) {
        v = formatter(raw);
      }
      e.target.value = v;
      setDisplay(v);
      setRawValue(raw);
      onValueChange?.(raw);
      onChange?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === "Backspace" &&
        sanitizeRegex &&
        formatter &&
        display &&
        /[^0-9]$/.test(display)
      ) {
        const input = e.currentTarget;
        const atEnd =
          input.selectionStart === input.selectionEnd &&
          input.selectionEnd === display.length;
        if (atEnd) {
          const nextRaw = rawValue.slice(0, -1);
          const nextDisplay = nextRaw ? formatter(nextRaw) : "";
          setRawValue(nextRaw);
          setDisplay(nextDisplay);
          onValueChange?.(nextRaw);
          e.preventDefault();
          return;
        }
      }
      props.onKeyDown?.(e);
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
          onKeyDown={handleKeyDown}
          value={display}
          className={[
            props.disabled ? "bg-slate-100/80 cursor-not-allowed" : "bg-white/80",
            "h-11 w-full rounded-xl px-3 text-sm border",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              : "border-slate-200/70 hover:border-slate-300 focus:border-sky-300 focus:ring-2 focus:ring-sky-200",
            "text-slate-900 shadow-sm transition",
            "dark:bg-slate-900/80 dark:text-slate-100 dark:border-slate-700 dark:focus:ring-sky-900/40",
            "outline-none transition",
            className ?? "",
          ].join(" ")}
        />
        {error ? (
          <span className="text-xs text-red-600">{error}</span>
        ) : (
          helperText && <span className="text-xs text-slate-500 dark:text-slate-400">{helperText}</span>
        )}

      </div>
    );
  }
);

AppTextInput.displayName = "AppTextInput";

export default AppTextInput;
