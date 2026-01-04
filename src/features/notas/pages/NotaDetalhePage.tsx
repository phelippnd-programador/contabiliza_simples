import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import AppButton from "../../../components/ui/button/AppButton";
import { getNota } from "../services/notas.service";
import type { NotaEmissaoResponse } from "../types";
import { getErrorMessage } from "../../../shared/services/apiClient";

const NotaDetalhePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nota, setNota] = useState<NotaEmissaoResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        setError("");
        const data = await getNota(id);
        if (!isMounted) return;
        setNota(data);
      } catch (err) {
        if (!isMounted) return;
        setError(getErrorMessage(err, "Nao foi possivel carregar a nota."));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <AppTitle text="Detalhe da nota" />
          <AppSubTitle text="Informacoes da emissao e documentos." />
        </div>
        <AppButton
          type="button"
          className="w-auto px-6"
          onClick={() => navigate("/fiscal/notas")}
        >
          Voltar
        </AppButton>
      </div>

      <Card>
        {error ? (
          <div className="flex items-center gap-3 text-sm text-red-600">
            <span>{error}</span>
            <AppButton
              type="button"
              className="w-auto px-4"
              onClick={() => {
                setNota(null);
                setError("");
                setIsLoading(true);
                if (id) {
                  getNota(id)
                    .then((data) => setNota(data))
                    .catch((err) =>
                      setError(getErrorMessage(err, "Nao foi possivel carregar a nota."))
                    )
                    .finally(() => setIsLoading(false));
                }
              }}
            >
              Tentar novamente
            </AppButton>
          </div>
        ) : null}
        {isLoading && !nota ? (
          <p className="text-sm text-gray-500">Carregando...</p>
        ) : null}

        {nota ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-sm font-semibold text-gray-900">{nota.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Numero</p>
              <p className="text-sm font-semibold text-gray-900">{nota.numero ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Serie</p>
              <p className="text-sm font-semibold text-gray-900">{nota.serie ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Chave</p>
              <p className="text-sm font-semibold text-gray-900">{nota.chave ?? "-"}</p>
            </div>
            {nota.urlPdf ? (
              <a
                href={nota.urlPdf}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Abrir PDF
              </a>
            ) : null}
            {nota.urlXml ? (
              <a
                href={nota.urlXml}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Baixar XML
              </a>
            ) : null}
            {nota.status === "ERRO" && nota.erro ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p className="font-semibold">{nota.erro.mensagem}</p>
                {nota.erro.detalhes ? <p>{nota.erro.detalhes}</p> : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default NotaDetalhePage;
