import React, { useState } from 'react'
import AppTextInput from '../../../../components/ui/input/AppTextInput';
import { formatCNPJ, formatPhoneBR } from '../../../../shared/utils/formater';
import type { EmpresaFormData } from '../../validation/empresa.schema';
import AppButton from '../../../../components/ui/button/AppButton';

export const DadosTab = () => {
    const [form, setForm] = useState<EmpresaFormData>({} as EmpresaFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    return (
        <>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-4">
                    <h2 className="text-base font-semibold">Dados da Empresa</h2>
                    <p className="text-sm text-gray-500">Informações para configuração da empresa.</p>
                </div>
                <AppTextInput required title='Razão Social' placeholder=''
                    // onValueChange={(v) =>
                    // setForm((p: EmpresaFormData) => ({ ...p, razaoSocial: v ?? '' }))
                    // }
                    error={errors.razaoSocial}
                />
                <AppTextInput required title='Nome Fantasia' placeholder=''
                    // onValueChange={(v) =>
                    //     setForm((p: EmpresaFormData) => ({ ...p, nomeFantasia: v ?? '' }))
                    // }
                    error={errors.nomeFantasia}
                />
                <AppTextInput
                    disabled={true}
                    // onValueChange={(v) =>
                    //     setForm((p: EmpresaFormData) => ({ ...p, cnpj: v ?? '' }))
                    // }
                    // error={errors.cnpj}
                    formatter={formatCNPJ} sanitizeRegex={/[0-9]/g} required title='CNPJ' placeholder='' />
                <AppTextInput required title='Inscrição Estadual' placeholder='' />

            </div>
            <div className="footer flex gap-4">
                <AppButton onClick={() => { }}>Salvar</AppButton>
                <AppButton>Cancelar</AppButton>
            </div>
        </>
    )
}
