import React, { useState, type ReactNode } from 'react'
import AppTextInput from '../../../components/ui/input/AppTextInput'
import AppSelectInput from '../../../components/ui/input/AppSelectInput'
import AppButton from '../../../components/ui/button/AppButton'
import AppTitle, { AppSubTitle } from '../../../components/ui/text/AppTitle'
import { formatBRLRangeClamp, formatCNPJ, formatPercentBR, formatPhoneBR } from '../../../shared/utils/formater'
import Card from '../../../components/ui/card/Card'
import { AnexoSimples, RegimeTributario } from '../../tributacao/types'
import { CnaePicker } from '../../../components/ui/picked/CnaePicker'
import type { CnaeItem } from '../../../shared/services/ibgeCnae'
import { AppTabs, type TabItem } from '../../../components/ui/tab/AppTabs'
import { DadosTab } from './tabs/DadosTab'
import { EnderecoContatoTab } from './tabs/EnderecoContatoTab'
import { TributacaoTab } from './tabs/TributacaoTab'
import { FinanceiroTab } from './tabs/FinanceiroTab'

type EmpresaTab =
    | "dados"
    | "endereco"
    | "fiscal"
    | "financeiro"
    | "usuarios";
const ConfiguracaoEmpresaPage = () => {



    useState<string>('0,00%');


    const tabs: TabItem<EmpresaTab>[] = [
        { id: "dados", label: "Dados da Empresa" },
        { id: "endereco", label: "Endereço & Contato" },
        { id: "fiscal", label: "Fiscal / Tributação", badge: "!" }, // exemplo alerta
        { id: "financeiro", label: "Financeiro" },
        { id: "usuarios", label: "Usuários" },
    ];
    const [tab, setTab] = useState<EmpresaTab>("dados");

    const onSubmit = () => {

    };


    return (
        <div className='flex p-5 flex-col items-center justify-center w-full'>

            <AppTitle text='Configuração da Empresa' />
            <AppSubTitle text='Cadastre uma nova empresa para gerenciar sua contabilidade' />
            <Card>
                <AppSubTitle text='Informações da Empresa' />
                <small>Preencha os dados básicos da empresa. Todos os campos marcados com * são obrigatórios.</small>

                <AppTabs tabs={tabs} activeTab={tab} onChange={setTab} />
                {/* CONTEÚDO */}
                <div className="rounded-lg border border-gray-200 p-6 bg-white gap-4 flex flex-col">
                    {tab === "dados" && <DadosTab />}
                    {tab === "endereco" && <EnderecoContatoTab />}
                    {tab === "fiscal" && <TributacaoTab/>}
                    {tab === "financeiro" && <FinanceiroTab />}
                    {tab === "usuarios" && <div>👤 Conteúdo Usuários</div>}

                </div>




            </Card>
        </div>
    )
}

export default ConfiguracaoEmpresaPage