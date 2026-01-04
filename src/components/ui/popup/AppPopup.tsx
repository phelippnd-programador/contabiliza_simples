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
  default: "border-blue-200 text-blue-700 hover:border-blue-400",
  danger: "border-red-200 text-red-600 hover:border-red-400",
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {description ? (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
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
