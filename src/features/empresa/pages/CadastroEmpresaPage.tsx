import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppTextInput from '../../../components/ui/input/AppTextInput'
import AppButton from '../../../components/ui/button/AppButton'
import AppTitle, { AppSubTitle } from '../../../components/ui/text/AppTitle'
import { formatCNPJ, formatPhoneBR } from '../../../shared/utils/formater'
import Card from '../../../components/ui/card/Card'
// import { anexoSimplesOptions, regimeTributarioOptions } from '../../../shared/types/select-type'
// import { AnexoSimples, RegimeTributario } from '../../tributacao/types'
import { empresaSchema, type EmpresaFormData } from '../validation/empresa.schema'
import { CnaePicker } from '../../../components/ui/picked/CnaePicker'
import type { CnaeItem } from '../../../shared/services/ibgeCnae'
import { AppTributacaoInput } from '../../../components/ui/input/AppTributacaoInput'
import { saveEmpresa } from '../services/empresas.service'

const CadastroEmpresaPage = () => {
    const navigate = useNavigate();
    const empresaId = 1; // só para exemplo de syncKey
    const [form, setForm] = useState<
        EmpresaFormData & { email?: string; inscricaoEstadual?: string }
    >({} as EmpresaFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [selectedCnae, setSelectedCnae] = useState<CnaeItem | null>(null);
    const validate = () => {
        const result = empresaSchema.safeParse(form);

        if (!result.success) {
            const fieldErrors: Record<string, string> = {};

            result.error.issues.forEach((issue) => {
                const field = issue.path[0];
                if (field) fieldErrors[field as string] = issue.message;
            });
            console.log("Erros de validação:", fieldErrors);
            setErrors(fieldErrors);
            return false;
        }

        setErrors({});
        return true;
    };
    const onSubmit = async () => {
        console.log("Erros de validacao:");
        if (!validate()) return;

        await saveEmpresa({
            ...form,
        });
        navigate("/empresa");
    };
    // const renderTributacaoFields = (): ReactNode => {
    //     return <div className="flex w-full gap-4">
    //         <AppSelectInput value={regimeTributario}
    //             onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
    //                 setRegimeTributario(e.target.value as RegimeTributario);
    //                 setForm((p: EmpresaFormData) => ({ ...p, regimeTributario: e.target.value as RegimeTributario }))
    //             }}
    //             error={errors.regimeTributario}
    //             required title='Regime Tributário'
    //             data={regimeTributarioOptions} />
    //         {regimeTributario === RegimeTributario.SIMPLES_NACIONAL && (<>
    //             <AppTextInput
    //                 // onValueChange={v => setRbt12(v)}
    //                 onChange={v => setRbt12(v.target.value)}
    //                 value={rbt12}
    //                 onValueChange={(v) =>
    //                     setForm((p: EmpresaFormData) => ({ ...p, rbt12: Number(v) }))
    //                 }
    //                 error={errors.rbt12}
    //                 formatter={(v) => formatBRLRangeClamp(v, 0, 4800000)}
    //                 sanitizeRegex={/[0-9]/g} required title='RBT12'
    //                 tooltip='RBT12 = Receita Bruta Total acumulada dos últimos 12 meses.'
    //                 placeholder='' />

    //             <AppSelectInput
    //                 value={anexoSimples}
    //                 onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
    //                     setForm((p: EmpresaFormData) => ({ ...p, anexoSimples: e.target.value as AnexoSimples }))
    //                     setAnexoSimples(e.target.value as AnexoSimples);
    //                 }}
    //                 required
    //                 error={errors.anexoSimples}
    //                 title="Anexo do Simples"
    //                 data={anexoSimplesOptions}
    //             />
    //         </>
    //         )}
    //         {(anexoSimples && (anexoSimples === AnexoSimples.V || anexoSimples === AnexoSimples.III)) && (
    //             <AppTextInput tooltip='Fator R = Folha/Receita (12m). Corte 28%'
    //                 onValueChange={(v) =>
    //                     setForm((p: EmpresaFormData) => ({ ...p, percentualFatorR: Number(v) }))
    //                 }
    //                 error={errors.percentualFatorR}
    //                 onChange={v => setPercentualFatorR(v.target.value)}
    //                 value={percentualFatorR} formatter={formatPercentBR}
    //                 sanitizeRegex={/[0-9]/g} required title='Percentual Fator R'
    //                 placeholder='' />
    //         )
    //         }
    //     </div >
    // }

    return (
        <div className='flex p-5 flex-col items-center justify-center w-full'>

            <AppTitle text='Criar Empresa' />
            <AppSubTitle text='Cadastre uma nova empresa para gerenciar sua contabilidade' />
            <Card>
                <AppSubTitle text='Informações da Empresa' />
                <small>Preencha os dados básicos da empresa. Todos os campos marcados com * são obrigatórios.</small>
                <AppTextInput required title='Razão Social' placeholder=''
                    onValueChange={(v) =>
                        setForm((p: EmpresaFormData) => ({ ...p, razaoSocial: v ?? '' }))
                    }
                    error={errors.razaoSocial}
                />
                <AppTextInput required title='Nome Fantasia' placeholder=''
                    onValueChange={(v) =>
                        setForm((p: EmpresaFormData) => ({ ...p, nomeFantasia: v ?? '' }))
                    }
                    error={errors.nomeFantasia}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <AppTextInput
                        onValueChange={(v) =>
                            setForm((p: EmpresaFormData) => ({ ...p, cnpj: v ?? '' }))
                        }
                        error={errors.cnpj}
                        maxRawLength={14}
                        formatter={formatCNPJ} sanitizeRegex={/[0-9]/g} required title='CNPJ' placeholder='' />
                    <AppTextInput
                        required
                        title='Inscricao Estadual'
                        placeholder=''
                        value={form.inscricaoEstadual ?? ''}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, inscricaoEstadual: e.target.value }))
                        }
                    />
                </div>
                <AppTributacaoInput
                    syncKey={empresaId} // 👈 MUITO importante para carregar outra empresa e resetar display
                    value={{
                        regimeTributario: form.regimeTributario,
                        rbt12: form.rbt12,
                        anexoSimples: form.anexoSimples,
                        percentualFatorR: form.percentualFatorR,
                    }}
                    onChange={(t) =>
                        setForm((p) => ({
                            ...p,
                            regimeTributario: t.regimeTributario,
                            rbt12: t.rbt12,
                            anexoSimples: t.anexoSimples,
                            percentualFatorR: t.percentualFatorR,
                        }))
                    }
                    errors={{
                        regimeTributario: errors.regimeTributario,
                        rbt12: errors.rbt12,
                        anexoSimples: errors.anexoSimples,
                        percentualFatorR: errors.percentualFatorR,
                    }}
                />
                {/* <AppTributacaoInput errors={errors} setForm={setForm} form={form} /> */}
                {/* {renderTributacaoFields()} */}

                <CnaePicker
                    required
                    value={selectedCnae}
                    onChange={setSelectedCnae}
                    onChangeCodigo={(digits) => {
                        setForm((p) => ({ ...p, cnaePrincipal: digits ?? "" })); // <- só números no form
                    }}
                    error={errors.cnaePrincipal}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <AppTextInput onValueChange={(v) =>
                        setForm((p: EmpresaFormData) => ({ ...p, telefone: v ?? '' }))
                    }
                        error={errors.telefone}
                        sanitizeRegex={/[0-9]/g} formatter={formatPhoneBR} required title='Telefone' placeholder='' />
                    <AppTextInput
                        required
                        title='Email'
                        placeholder=''
                        value={form.email ?? ''}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    />
                </div>
                <div className="footer flex gap-4">
                    <AppButton onClick={onSubmit}>Criar empresa</AppButton>


                    <AppButton>Cancelar</AppButton>
                </div>
            </Card>
        </div>
    )
}

export default CadastroEmpresaPage
