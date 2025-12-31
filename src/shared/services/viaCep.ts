export type ViaCepResponse = {
    cep?: string;
    logradouro?: string;
    complemento?: string;
    bairro?: string;
    localidade?: string; // cidade
    uf?: string;
    erro?: boolean;
};

export async function buscarEnderecoPorCep(cepNumerico: string, signal?: AbortSignal) {
    const cep = (cepNumerico || "").replace(/\D/g, "");
    if (cep.length !== 8) return null;

    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal });
    if (!res.ok) return null;

    const data = (await res.json()) as ViaCepResponse;
    if (data.erro) return null;

    return data;
}
