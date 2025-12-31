import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center gap-4">
      <h1 className="text-6xl font-bold text-gray-800">404</h1>
      <p className="text-gray-500">
        Página não encontrada
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
