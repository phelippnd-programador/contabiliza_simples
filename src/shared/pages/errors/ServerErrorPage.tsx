import { isRouteErrorResponse, useRouteError, Link } from "react-router-dom";

export default function ServerErrorPage() {
    const error = useRouteError();

    let message = "Erro inesperado";
    let status: number | undefined;

    if (isRouteErrorResponse(error)) {
        status = error.status;
        message = error.statusText;
    } else if (error instanceof Error) {
        message = error.message;
    }

    return (
        <div className="h-screen flex flex-col items-center justify-center text-center gap-4">
            <h1 className="text-6xl font-bold text-red-600">
                {status ?? 500}
            </h1>

            <p className="text-gray-700 font-medium">
                Ocorreu um erro inesperado
            </p>

            <p className="text-gray-500 max-w-md">
                {message}
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
