import React from 'react'
interface AppListNotFoundProps {
    texto?: string;
}
const AppListNotFound = ({ texto }: AppListNotFoundProps) => {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/70 p-6 text-center text-sm font-medium text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
            {texto || "Nenhum dado encontrado."}
        </div>
    )
}

export default AppListNotFound
