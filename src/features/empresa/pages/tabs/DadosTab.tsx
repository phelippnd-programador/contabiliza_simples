import React, { useEffect, useState } from 'react';
import AppTextInput from '../../../../components/ui/input/AppTextInput';
import AppButton from '../../../../components/ui/button/AppButton';
import { formatCNPJ } from '../../../../shared/utils/formater';
import type { EmpresaCadastro } from '../../types';
import AppTitle, { AppSubTitle } from '../../../../components/ui/text/AppTitle';
import Card from '../../../../components/ui/card/Card';

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
      <div className="mb-4">
        <AppTitle text='Dados da Empresa' />
        <AppSubTitle text="Informacoes para configuracao da empresa." />

      </div>
      <Card>
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
      </Card>
      <div className="footer flex gap-4">
        <AppButton onClick={() => { }}>Salvar</AppButton>
        <AppButton>Cancelar</AppButton>
      </div>
    </>
  );
};
