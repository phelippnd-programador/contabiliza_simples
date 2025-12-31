import React, { useState } from 'react'
import AppTextInput from '../../../components/ui/input/AppTextInput'
import AppSelectInput from '../../../components/ui/input/AppSelectInput'
import AppButton from '../../../components/ui/button/AppButton'
import AppTitle, { AppSubTitle } from '../../../components/ui/text/AppTitle'
import { formatPhoneBR } from '../../../shared/utils/formater'
import Card from '../../../components/ui/card/Card'
import AppHeader from '../../../components/layout/header/AppHeader'
import { anexoSimplesOptions, regimeTributarioOptions } from '../../../shared/types/select-type'
import { RegimeTributario } from '../types'

const TributacaoPage = () => {
    const [regimeTributario, setRegimeTributario] =
        useState<RegimeTributario>();


    return (
        <div className='flex p-5 flex-col items-center justify-center w-full'>
            <AppHeader />
            <AppTitle text='Criar Tributação' />
            <AppSubTitle text='Cadastre uma nova empresa para gerenciar sua contabilidade' />
            <Card>
                <AppSubTitle text='Informações da Tributação' />
                <small>Preencha os dados básicos da empresa. Todos os campos marcados com * são obrigatórios.</small>
                <AppTextInput required title='Razão Social' placeholder='' />
                
                <AppSelectInput value={regimeTributario} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setRegimeTributario(e.target.value as RegimeTributario); }} required title='Regime Tributário' data={regimeTributarioOptions} />
                {regimeTributario === RegimeTributario.SIMPLES_NACIONAL && (
                    <AppSelectInput
                        required
                        title="Anexo do Simples"
                        data={anexoSimplesOptions}
                    />
                )}

                <AppTextInput required title='Endereço' placeholder='' />
                <AppTextInput sanitizeRegex={/[0-9]/g} formatter={formatPhoneBR} required title='Telefone' placeholder='' />
                <AppTextInput required title='Email' placeholder='' />

                <div className="footer flex gap-4">
                    <AppButton>Criar empresa</AppButton>


                    <AppButton>Cancelar</AppButton>
                </div>
            </Card>
        </div>
    )
}

export default TributacaoPage