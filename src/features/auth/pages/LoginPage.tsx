import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppButton from "../../../components/ui/button/AppButton";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import { useAuth } from "../../../shared/context/AuthContext";

const LoginPage = () => {
  const [form, setForm] = useState({
    email: "",
    senha: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.email) nextErrors.email = "Informe o e-mail";
    if (!form.senha) nextErrors.senha = "Informe a senha";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setSubmitError("");
      await login(form.email, form.senha);
      navigate("/");
    } catch {
      setSubmitError("Nao foi possivel autenticar. Verifique os dados.");
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-[460px] rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-lg font-semibold text-blue-600">
            G
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">
            Fazer login
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Use sua conta para continuar no painel.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
            <p className="font-semibold text-gray-700">Usuarios de teste</p>
            <p>admin@teste.com / admin123</p>
            <p>empresa@teste.com / empresa123</p>
          </div>
          <AppTextInput
            required
            title="E-mail"
            type="email"
            placeholder="voce@email.com"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            error={errors.email}
          />

          <AppTextInput
            required
            title="Senha"
            type="password"
            value={form.senha}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, senha: e.target.value }))
            }
            error={errors.senha}
          />
          {submitError ? (
            <span className="text-sm text-red-600">{submitError}</span>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <Link
            to="/esqueci-senha"
            className="text-blue-600 hover:text-blue-700"
          >
            Esqueci minha senha
          </Link>
          <span className="text-gray-500">Precisa de acesso? Fale com o admin.</span>
        </div>


        <AppButton type="button" className="w-auto px-6" onClick={handleSubmit}>
          Login
        </AppButton>

      </div>
    </div>
  );
};

export default LoginPage;
