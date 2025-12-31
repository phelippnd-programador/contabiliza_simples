import React from 'react'
interface AppListNotFoundProps {
    texto?: string;
}
const AppListNotFound = ({ texto }: AppListNotFoundProps) => {
    return (
        <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
            {texto || "Nenhuma dados encontrado."}
        </div>
    )
}

export default AppListNotFound