import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppListNotFound from "../../../components/ui/AppListNotFound";
import { AppTabs } from "../../../components/ui/tab/AppTabs";
import { getFuncionario } from "../services/rh.service";
import type { Funcionario } from "../types/rh.types";
import { formatCpfCnpj } from "../../../shared/utils/formater";

type TabId =
  | "resumo"
  | "contrato"
  | "remuneracao"
  | "folha"
  | "ferias"
  | "afastamentos"
  | "ponto";

const FuncionarioDetalhePage = () => {
  const { id } = useParams();
  const [item, setItem] = useState<Funcionario | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabId>("resumo");

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getFuncionario(id);
        setItem(data);
      } catch {
        setItem(null);
        setError("Nao foi possivel carregar o funcionario.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const timeline = useMemo(() => {
    if (!item) return [];
    return [
      { label: "Admissao", value: item.dataAdmissao },
      { label: "Criado em", value: item.createdAt ?? "-" },
      { label: "Atualizado em", value: item.updatedAt ?? "-" },
    ];
  }, [item]);

  if (loading) {
    return <p className="text-sm text-gray-500">Carregando...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!item) {
    return <AppListNotFound texto="Funcionario nao encontrado." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AppTitle text={item.nome} />
        <AppSubTitle text="Perfil completo do funcionario." />
      </div>

      <Card>
        <AppTabs
          activeTab={tab}
          onChange={setTab}
          tabs={[
            { id: "resumo", label: "Resumo" },
            { id: "contrato", label: "Contrato" },
            { id: "remuneracao", label: "Remuneracao" },
            { id: "folha", label: "Folha" },
            { id: "ferias", label: "Ferias" },
            { id: "afastamentos", label: "Afastamentos" },
            { id: "ponto", label: "Ponto" },
          ]}
        />

        {tab === "resumo" ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs text-gray-400">CPF</div>
              <div className="text-sm">{formatCpfCnpj(item.cpf)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Matricula</div>
              <div className="text-sm">{item.matricula}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Status</div>
              <div className="text-sm">{item.status}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Admissao</div>
              <div className="text-sm">{item.dataAdmissao}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Email</div>
              <div className="text-sm">{item.email ?? "-"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Telefone</div>
              <div className="text-sm">{item.telefone ?? "-"}</div>
            </div>
          </div>
        ) : null}

        {tab === "contrato" ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs text-gray-400">Tipo contrato</div>
              <div className="text-sm">{item.tipoContrato}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Jornada</div>
              <div className="text-sm">{item.jornada}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Departamento</div>
              <div className="text-sm">{item.departamentoId ?? "-"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Cargo</div>
              <div className="text-sm">{item.cargoId ?? "-"}</div>
            </div>
          </div>
        ) : null}

        {tab === "remuneracao" ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs text-gray-400">Salario base</div>
              <div className="text-sm">R$ {item.salarioBase.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Tipo salario</div>
              <div className="text-sm">{item.salarioTipo}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Periculosidade</div>
              <div className="text-sm">{item.adicionalPericulosidade ? "Sim" : "Nao"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Insalubridade</div>
              <div className="text-sm">{item.adicionalInsalubridade ? "Sim" : "Nao"}</div>
            </div>
          </div>
        ) : null}

        {tab === "folha" ? (
          <p className="mt-4 text-sm text-gray-500">
            Resumo de folha sera exibido aqui quando houver lancamentos.
          </p>
        ) : null}

        {tab === "ferias" ? (
          <p className="mt-4 text-sm text-gray-500">
            Nenhuma ferias registrada.
          </p>
        ) : null}

        {tab === "afastamentos" ? (
          <p className="mt-4 text-sm text-gray-500">
            Nenhum afastamento registrado.
          </p>
        ) : null}

        {tab === "ponto" ? (
          <p className="mt-4 text-sm text-gray-500">
            Nenhum registro de ponto para o periodo selecionado.
          </p>
        ) : null}
      </Card>

      <Card>
        <AppSubTitle text="Timeline" />
        <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
          {timeline.map((itemRow) => (
            <li key={itemRow.label} className="flex justify-between">
              <span>{itemRow.label}</span>
              <span>{itemRow.value}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default FuncionarioDetalhePage;
