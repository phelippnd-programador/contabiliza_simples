import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AppTitle, { AppSubTitle } from '../../../components/ui/text/AppTitle';
import Card from '../../../components/ui/card/Card';
import { AppTabs, type TabItem } from '../../../components/ui/tab/AppTabs';
import { DadosTab } from './tabs/DadosTab';
import { EnderecoContatoTab } from './tabs/EnderecoContatoTab';
import { TributacaoTab } from './tabs/TributacaoTab';
import { FinanceiroTab } from './tabs/FinanceiroTab';
import type { EmpresaCadastro } from '../types';
import { getEmpresa } from '../services/empresas.service';

type EmpresaTab =
  | "dados"
  | "endereco"
  | "fiscal"
  | "financeiro"
  | "usuarios";

const ConfiguracaoEmpresaPage = () => {
  const { id } = useParams();
  const [empresa, setEmpresa] = useState<EmpresaCadastro | null>(null);
  const [error, setError] = useState('');

  const tabs: TabItem<EmpresaTab>[] = [
    { id: 'dados', label: 'Dados da Empresa' },
    { id: 'endereco', label: 'Endereco & Contato' },
    { id: 'fiscal', label: 'Fiscal / Tributacao', badge: '!' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'usuarios', label: 'Usuarios' },
  ];
  const [tab, setTab] = useState<EmpresaTab>('dados');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!id) return;
      try {
        const data = await getEmpresa(id);
        if (!isMounted) return;
        setEmpresa(data ?? null);
      } catch {
        if (!isMounted) return;
        setError('Nao foi possivel carregar a empresa.');
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className='flex p-5 flex-col items-center justify-center w-full'>
      <AppTitle text='Configuracao da Empresa' />
      <AppSubTitle text='Cadastre uma nova empresa para gerenciar sua contabilidade' />
      <Card>
        <AppSubTitle text='Informacoes da Empresa' />
        <small>Preencha os dados basicos da empresa. Todos os campos marcados com * sao obrigatorios.</small>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <AppTabs tabs={tabs} activeTab={tab} onChange={setTab} />
        <div className="rounded-lg border border-gray-200 p-6 bg-white gap-4 flex flex-col">
          {tab === 'dados' && <DadosTab empresa={empresa ?? undefined} />}
          {tab === 'endereco' && <EnderecoContatoTab empresa={empresa ?? undefined} />}
          {tab === 'fiscal' && (
            <TributacaoTab empresaId={empresa?.id} empresa={empresa ?? undefined} />
          )}
          {tab === 'financeiro' && <FinanceiroTab />}
          {tab === 'usuarios' && <div>Conteudo Usuarios</div>}
        </div>
      </Card>
    </div>
  );
};

export default ConfiguracaoEmpresaPage;
