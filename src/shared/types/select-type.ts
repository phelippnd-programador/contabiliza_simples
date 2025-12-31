import type { ItemSelect } from "../../components/ui/input/AppSelectInput";
import { AnexoSimples, AnexoSimplesLabel, RegimeTributario, RegimeTributarioLabel } from "../../features/tributacao/types";

export const regimeTributarioOptions: ItemSelect[] =
    (Object.values(RegimeTributario) as RegimeTributario[]).map(value => ({
        value,
        label: RegimeTributarioLabel[value],
    }));
export const anexoSimplesOptions: ItemSelect[] = (
    Object.values(AnexoSimples) as AnexoSimples[]).map(value => ({
        value,
        label: AnexoSimplesLabel[value],
    })
    );