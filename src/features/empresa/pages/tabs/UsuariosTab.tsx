import React, { useEffect, useState } from "react";
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
  senhaAtual: string;
  senhaNova: string;
  senhaConfirmacao: string;
};

export function UsuariosTab() {
  const [form, setForm] = useState<FormState>({
    nome: "",
    email: "",
    telefone: "",
    senhaAtual: "",
    senhaNova: "",
    senhaConfirmacao: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");

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
      }));
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppTextInput
            required
            title="Nome"
            value={form.nome}
            onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
            error={errors.nome}
          />

          <AppTextInput
            required
            title="E-mail"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            error={errors.email}
          />

          <AppTextInput
            title="Telefone"
            value={form.telefone}
            formatter={formatPhoneBR}
            sanitizeRegex={/[0-9]/g}
            onValueChange={(raw) => setForm((prev) => ({ ...prev, telefone: raw }))}
          />
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
    </div>
  );
}
