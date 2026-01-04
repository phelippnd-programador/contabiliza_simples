import { useCallback, useState } from "react";

type ConfirmTone = "default" | "danger";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

type ConfirmState = ConfirmOptions & {
  open: boolean;
  onConfirm?: () => void;
};

const initialState: ConfirmState = {
  open: false,
  title: "",
  description: "",
  confirmLabel: "Confirmar",
  cancelLabel: "Cancelar",
  tone: "default",
};

const useConfirmPopup = () => {
  const [state, setState] = useState<ConfirmState>(initialState);

  const openConfirm = useCallback(
    (options: ConfirmOptions, onConfirm: () => void) => {
      setState({
        open: true,
        title: options.title,
        description: options.description ?? "",
        confirmLabel: options.confirmLabel ?? "Confirmar",
        cancelLabel: options.cancelLabel ?? "Cancelar",
        tone: options.tone ?? "default",
        onConfirm,
      });
    },
    []
  );

  const closeConfirm = useCallback(() => {
    setState((prev) => ({ ...prev, open: false, onConfirm: undefined }));
  }, []);

  const handleConfirm = useCallback(() => {
    const action = state.onConfirm;
    closeConfirm();
    if (action) {
      action();
    }
  }, [closeConfirm, state.onConfirm]);

  return {
    popupProps: {
      open: state.open,
      title: state.title,
      description: state.description,
      confirmLabel: state.confirmLabel,
      cancelLabel: state.cancelLabel,
      tone: state.tone,
      onConfirm: handleConfirm,
      onCancel: closeConfirm,
    },
    openConfirm,
    closeConfirm,
  };
};

export default useConfirmPopup;
export type { ConfirmOptions };
