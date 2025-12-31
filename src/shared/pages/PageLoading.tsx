export function PageLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        {/* Spinner */}
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />

        {/* Texto */}
        <span className="text-sm text-gray-500">
          Carregando…
        </span>
      </div>
    </div>
  );
}
