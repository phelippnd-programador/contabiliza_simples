import React, { useState } from "react";
import { Link } from "react-router-dom";
import AppTextInput from "../../../components/ui/input/AppTextInput";
import AppButton from "../../../components/ui/button/AppButton";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError("Informe o e-mail");
      return;
    }
    setError("");
    await Promise.resolve();
    setSent(true);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-[460px] rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Recuperar acesso
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Enviaremos um link de redefinicao para seu e-mail.
          </p>
        </div>

        <div className="mt-8">
          <AppTextInput
            required
            title="E-mail"
            type="email"
            placeholder="voce@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
        </div>

        {sent ? (
          <p className="mt-4 text-sm text-green-600">
            Se existir uma conta com esse e-mail, enviamos um link.
          </p>
        ) : null}

        <div className="mt-8 flex items-center justify-between">
          <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700">
            Voltar ao login
          </Link>
          <AppButton type="button" className="w-auto px-6" onClick={handleSubmit}>
            Enviar
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
