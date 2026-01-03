import React, { useEffect, useState } from 'react';
import AppTextInput from '../../../../components/ui/input/AppTextInput';
import AppButton from '../../../../components/ui/button/AppButton';
import { formatCNPJ } from '../../../../shared/utils/formater';
import type { EmpresaCadastro } from '../../types';

interface Props {
  empresa?: EmpresaCadastro;
}

export const DadosTab = ({ empresa }: Props) => {
  const [form, setForm] = useState<EmpresaCadastro | null>(null);
  const [errors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(empresa ?? null);
  }, [empresa]);

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold">Dados da Empresa</h2>
          <p className="text-sm text-gray-500">Informacoes para configuracao da empresa.</p>
        </div>
        <AppTextInput
          required
          title='Razao Social'
          placeholder=''
          value={form?.razaoSocial ?? ''}
          onChange={(e) =>
            setForm((prev) => (prev ? { ...prev, razaoSocial: e.target.value } : prev))
          }
          error={errors.razaoSocial}
        />
        <AppTextInput
          required
          title='Nome Fantasia'
          placeholder=''
          value={form?.nomeFantasia ?? ''}
          onChange={(e) =>
            setForm((prev) => (prev ? { ...prev, nomeFantasia: e.target.value } : prev))
          }
          error={errors.nomeFantasia}
        />
        <AppTextInput
          disabled
          value={formatCNPJ(form?.cnpj ?? '')}
          required
          title='CNPJ'
          placeholder=''
          error={errors.cnpj}
        />
        <AppTextInput
          required
          title='Inscricao Estadual'
          placeholder=''
          value={form?.inscricaoEstadual ?? ''}
          onChange={(e) =>
            setForm((prev) => (prev ? { ...prev, inscricaoEstadual: e.target.value } : prev))
          }
        />
      </div>
      <div className="footer flex gap-4">
        <AppButton onClick={() => {}}>Salvar</AppButton>
        <AppButton>Cancelar</AppButton>
      </div>
    </>
  );
};
