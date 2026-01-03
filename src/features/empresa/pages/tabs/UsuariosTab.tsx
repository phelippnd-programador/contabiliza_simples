import React, { useEffect, useRef, useState } from "react";
import AppButton from "../../../../components/ui/button/AppButton";
import AppTextInput from "../../../../components/ui/input/AppTextInput";
import { formatPhoneBR } from "../../../../shared/utils/formater";
import {
  getUserProfile,
  saveUserProfile,
  type UserProfile,
} from "../../../../shared/services/userProfile.service";

type FormState = {
  nome: string;
  email: string;
  telefone: string;
  fotoUrl: string;
  senhaAtual: string;
  senhaNova: string;
  senhaConfirmacao: string;
};

export function UsuariosTab() {
  const [form, setForm] = useState<FormState>({
    nome: "",
    email: "",
    telefone: "",
    fotoUrl: "",
    senhaAtual: "",
    senhaNova: "",
    senhaConfirmacao: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const profile = await getUserProfile();
      if (!isMounted) return;
      setForm((prev) => ({
        ...prev,
        nome: profile.nome ?? "",
        email: profile.email ?? "",
        telefone: profile.telefone ?? "",
        fotoUrl: profile.fotoUrl ?? "",
      }));
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, fotoUrl: "Arquivo invalido" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({ ...prev, fotoUrl: result }));
      setErrors((prev) => ({ ...prev, fotoUrl: "" }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFile(file);
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const openCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => undefined);
        };
      }
      setIsCameraOpen(true);
    } catch {
      setCameraError("Nao foi possivel acessar a camera.");
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setForm((prev) => ({ ...prev, fotoUrl: dataUrl }));
    setErrors((prev) => ({ ...prev, fotoUrl: "" }));
    closeCamera();
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.nome.trim()) next.nome = "Informe o nome";
    if (!form.email.trim()) next.email = "Informe o e-mail";

    const changingPassword =
      form.senhaAtual || form.senhaNova || form.senhaConfirmacao;
    if (changingPassword) {
      if (!form.senhaAtual) next.senhaAtual = "Informe a senha atual";
      if (!form.senhaNova) next.senhaNova = "Informe a nova senha";
      if (form.senhaNova && form.senhaNova.length < 8) {
        next.senhaNova = "A nova senha deve ter ao menos 8 caracteres";
      }
      if (!form.senhaConfirmacao)
        next.senhaConfirmacao = "Confirme a nova senha";
      if (
        form.senhaNova &&
        form.senhaConfirmacao &&
        form.senhaNova !== form.senhaConfirmacao
      ) {
        next.senhaConfirmacao = "As senhas nao conferem";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    setSuccess("");
    if (!validate()) return;

    const payload: UserProfile = {
      nome: form.nome,
      email: form.email,
      telefone: form.telefone,
      fotoUrl: form.fotoUrl,
    };
    await saveUserProfile(payload);

    setForm((prev) => ({
      ...prev,
      senhaAtual: "",
      senhaNova: "",
      senhaConfirmacao: "",
    }));
    setSuccess("Dados atualizados com sucesso.");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Dados pessoais</h2>
          <p className="text-sm text-gray-500">
            Atualize seus dados de contato.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
          <div>
            <div
              className={[
                "flex h-44 w-44 flex-col items-center justify-center rounded-xl border border-dashed",
                "bg-gray-50 text-xs text-gray-500 transition",
                isDragging
                  ? "border-blue-500 bg-blue-50 text-blue-600"
                  : "border-gray-300 hover:border-blue-400 hover:text-blue-600",
              ].join(" ")}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {form.fotoUrl ? (
                <img
                  src={form.fotoUrl}
                  alt="Foto do usuario"
                  className="h-40 w-40 rounded-lg object-cover"
                />
              ) : (
                <span>Arraste uma foto</span>
              )}
            </div>
            {errors.fotoUrl ? (
              <p className="mt-2 text-xs text-red-600">{errors.fotoUrl}</p>
            ) : null}
            <div className="mt-3 flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInput}
              />
              <AppButton
                type="button"
                className="w-auto"
                onClick={() => fileInputRef.current?.click()}
              >
                Escolher foto
              </AppButton>
              <AppButton type="button" className="w-auto" onClick={openCamera}>
                Tirar foto
              </AppButton>
              {form.fotoUrl ? (
                <button
                  type="button"
                  className="text-xs text-gray-500 hover:text-red-600"
                  onClick={() => setForm((prev) => ({ ...prev, fotoUrl: "" }))}
                >
                  Remover foto
                </button>
              ) : null}
              {cameraError ? (
                <span className="text-xs text-red-600">{cameraError}</span>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AppTextInput
              required
              title="Nome"
              value={form.nome}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nome: e.target.value }))
              }
              error={errors.nome}
            />

            <AppTextInput
              required
              title="E-mail"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              error={errors.email}
            />

            <AppTextInput
              title="Telefone"
              value={form.telefone}
              formatter={formatPhoneBR}
              sanitizeRegex={/[0-9]/g}
              onValueChange={(raw) =>
                setForm((prev) => ({ ...prev, telefone: raw }))
              }
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Senha</h2>
          <p className="text-sm text-gray-500">
            Defina uma nova senha caso deseje alterar o acesso.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <AppTextInput
            title="Senha atual"
            type="password"
            value={form.senhaAtual}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, senhaAtual: e.target.value }))
            }
            error={errors.senhaAtual}
          />

          <AppTextInput
            title="Nova senha"
            type="password"
            value={form.senhaNova}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, senhaNova: e.target.value }))
            }
            error={errors.senhaNova}
          />

          <AppTextInput
            title="Confirmar nova senha"
            type="password"
            value={form.senhaConfirmacao}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, senhaConfirmacao: e.target.value }))
            }
            error={errors.senhaConfirmacao}
          />
        </div>
      </div>

      {success ? <p className="text-sm text-green-600">{success}</p> : null}

      <div className="flex justify-end">
        <AppButton onClick={handleSave}>Salvar</AppButton>
      </div>

      {isCameraOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Camera</h3>
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={closeCamera}
              >
                Fechar
              </button>
            </div>
            <div className="mt-3 overflow-hidden rounded-lg bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-64 w-full object-cover"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <AppButton type="button" className="w-auto" onClick={capturePhoto}>
                Capturar
              </AppButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
