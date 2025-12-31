import React from 'react'
import { Outlet } from 'react-router-dom'
import AppHeader from './header/AppHeader'

const AppLayout = () => {
    return (
        <div className="h-screen flex flex-col px-0">
            <AppHeader />
            <main className="flex-1 px-10 py-5 overflow-auto">
                <Outlet />
            </main>
        </div>
    )
}

export default AppLayout