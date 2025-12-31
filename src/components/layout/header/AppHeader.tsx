import React from 'react'
import type { AppMenuItem } from '../menu/types';
import AppMenu from '../menu/AppMenu';

const AppHeader = () => {
  const menu: AppMenuItem[] = [
    { id: "dash", label: "Dashboard", to: "/", end: true },
    {
      id: "empresas", label: "Empresas", to: "/empresa",
      children: [
        { id: "minhas_empresas", label: "Minhas Empresas", to: "/empresa" ,end: true  },
        { id: "cadastro_empresa", label: "Cadastro Empresa", to: "/empresa/nova" },
      ]
    },
    {
      id: "receitas",
      label: "Receitas",
      children: [
        { id: "receitas", label: "Receitas", to: "/receitas" },
        { id: "caixa", label: "Caixa", to: "/caixa" },
        { id: "conciliacao", label: "Conciliação", to: "/conciliacao" },
      ],
    },
   
  ];
  return (
    <div className='flex w-full justify-between shadow-md items-center '>
      <AppMenu title="Meu App"  subtitle="Painel" menu={menu} />
      
    </div>
  )
}

export default AppHeader