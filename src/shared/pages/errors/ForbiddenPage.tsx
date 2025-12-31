import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center gap-4">
      <h1 className="text-6xl font-bold text-yellow-600">403</h1>

      <p className="text-gray-700 font-medium">
        Acesso negado
      </p>

      <p className="text-gray-500 max-w-md">
        Você não tem permissão para acessar esta página.
        Se acredita que isso é um erro, entre em contato com o administrador.
      </p>

      <Link
        to="/"
        className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
      >
        Voltar para o início
      </Link>
    </div>
  );
}
