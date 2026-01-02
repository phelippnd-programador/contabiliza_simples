import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
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
    const toDateString = (date: Date) => date.toISOString().slice(0, 10);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const type = props.type ?? "date";
    const isMonthPicker = type === "month";
    const value = (props.value ?? "") as string;
    const [viewDate, setViewDate] = useState(() => {
      const fallback = new Date();
      if (!value) return fallback;
      if (isMonthPicker) {
        const [year, month] = value.split("-").map(Number);
        if (!year || !month) return fallback;
        return new Date(year, month - 1, 1);
      }
      const [year, month, day] = value.split("-").map(Number);
      if (!year || !month || !day) return fallback;
      return new Date(year, month - 1, day);
    });

    useEffect(() => {
      const next = value;
      if (!next) return;
      if (isMonthPicker) {
        const [year, month] = next.split("-").map(Number);
        if (year && month) {
          setViewDate(new Date(year, month - 1, 1));
        }
      } else {
        const [year, month, day] = next.split("-").map(Number);
        if (year && month && day) {
          setViewDate(new Date(year, month - 1, day));
        }
      }
    }, [isMonthPicker, value]);

    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        if (!containerRef.current) return;
        if (!containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const monthLabel = useMemo(
      () =>
        viewDate.toLocaleString("pt-BR", {
          month: "long",
          year: "numeric",
        }),
      [viewDate]
    );

    const monthShortLabels = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

    const weekLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

    const daysGrid = useMemo(() => {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startIndex = firstDay.getDay();
      const totalDays = lastDay.getDate();
      const grid: Array<{ day: number; inMonth: boolean }> = [];

      for (let i = 0; i < startIndex; i += 1) {
        grid.push({ day: 0, inMonth: false });
      }
      for (let d = 1; d <= totalDays; d += 1) {
        grid.push({ day: d, inMonth: true });
      }
      while (grid.length < 42) {
        grid.push({ day: 0, inMonth: false });
      }
      return grid;
    }, [viewDate]);

    const emitChange = (nextValue: string) => {
      if (props.onChange) {
        props.onChange({
          target: { value: nextValue },
        } as React.ChangeEvent<HTMLInputElement>);
      }
    };

    const selectDate = (day: number) => {
      if (!day) return;
      const year = viewDate.getFullYear();
      const month = String(viewDate.getMonth() + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      emitChange(`${year}-${month}-${dayStr}`);
      setOpen(false);
    };

    const selectMonth = (monthIndex: number) => {
      const year = viewDate.getFullYear();
      const month = String(monthIndex + 1).padStart(2, "0");
      emitChange(`${year}-${month}`);
      setOpen(false);
    };

    const goPrev = () => {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      setViewDate(new Date(year, month - 1, 1));
    };

    const goNext = () => {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      setViewDate(new Date(year, month + 1, 1));
    };

    const goPrevYear = () => {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      setViewDate(new Date(year - 1, month, 1));
    };

    const goNextYear = () => {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      setViewDate(new Date(year + 1, month, 1));
    };

    return (
      <div ref={containerRef} className="relative flex w-full flex-col gap-1">
        <div className="flex items-center gap-2">
          {title && <AppLabel text={title} />}
          {required && <span className="text-red-500">*</span>}
          {tooltip && (
            <AppTooltip text={tooltip} tooltipPosition={tooltipPosition} />
          )}
        </div>

        <div className="relative">
          <input
            ref={(node) => {
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
              inputRef.current = node;
            }}
            {...props}
            type="text"
            readOnly={props.readOnly}
            placeholder={props.placeholder ?? (isMonthPicker ? "YYYY-MM" : "YYYY-MM-DD")}
            className={[
              props.disabled ? "bg-gray-100 cursor-not-allowed" : "",
              "h-11 w-full rounded-lg px-3 pr-10 text-sm border-2",
              error
                ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-gray-200 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
              "outline-none transition",
              "appearance-none",
              className ?? "",
            ].join(" ")}
            onFocus={(e) => {
              props.onFocus?.(e);
              if (!props.disabled) setOpen(true);
            }}
            onClick={(e) => {
              props.onClick?.(e);
              if (!props.disabled) setOpen(true);
            }}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v3H2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm15 9v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9h20ZM6 14h4v4H6v-4Zm6 0h6v2h-6v-2Z" />
            </svg>
          </span>
        </div>

        {open && !props.disabled ? (
          <div className="absolute left-0 top-full z-50 mt-2 w-full max-w-[320px] rounded-md border border-gray-200 bg-white p-3 shadow-xl">
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                onClick={isMonthPicker ? goPrevYear : goPrev}
                aria-label="Anterior"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                  <path d="M12.78 15.22a.75.75 0 0 1-1.06 0l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 1 1 1.06 1.06L9.06 10l3.72 3.72a.75.75 0 0 1 0 1.06Z" />
                </svg>
              </button>
              <span className="text-sm font-medium text-gray-700">
                {monthLabel}
              </span>
              <button
                type="button"
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                onClick={isMonthPicker ? goNextYear : goNext}
                aria-label="Proximo"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                  <path d="M7.22 4.78a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L10.94 10 7.22 6.28a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </button>
            </div>

            {isMonthPicker ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {monthShortLabels.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    className="rounded-md border border-gray-200 px-2 py-2 text-xs text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                    onClick={() => selectMonth(index)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-7 gap-1 text-[11px] text-gray-500">
                  {weekLabels.map((label) => (
                    <span key={label} className="text-center">
                      {label}
                    </span>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-1">
                  {daysGrid.map((item, index) => (
                    <button
                      key={`${item.day}-${index}`}
                      type="button"
                      disabled={!item.inMonth}
                      onClick={() => selectDate(item.day)}
                      className={[
                        "h-8 rounded-md text-xs",
                        item.inMonth
                          ? "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                          : "text-gray-300",
                      ].join(" ")}
                    >
                      {item.day || ""}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2 text-xs text-gray-500">
              <span>{new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => {
                    const now = new Date();
                    if (isMonthPicker) {
                      const month = String(now.getMonth() + 1).padStart(2, "0");
                      emitChange(`${now.getFullYear()}-${month}`);
                    } else {
                      emitChange(toDateString(now));
                    }
                    setOpen(false);
                  }}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    emitChange("");
                    setOpen(false);
                  }}
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>
        ) : null}

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
