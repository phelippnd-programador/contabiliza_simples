import React from "react";
import AppButton from "../button/AppButton";

type AppPopupTone = "default" | "danger";

type AppPopupProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: AppPopupTone;
  onConfirm: () => void;
  onCancel: () => void;
};

const toneClasses: Record<AppPopupTone, string> = {
  default: "border-sky-200 text-sky-700 hover:border-sky-300",
  danger: "border-rose-200 text-rose-600 hover:border-rose-300",
};

const AppPopup = ({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
  onConfirm,
  onCancel,
}: AppPopupProps) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white/95 p-6 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {description ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {description}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <AppButton
            type="button"
            className="w-auto px-4"
            onClick={onCancel}
          >
            {cancelLabel}
          </AppButton>
          <AppButton
            type="button"
            className={`w-auto px-4 ${toneClasses[tone]}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default AppPopup;
