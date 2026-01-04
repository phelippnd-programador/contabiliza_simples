import React from "react";
import AppTitle, { AppSubTitle } from "../../../components/ui/text/AppTitle";
import Card from "../../../components/ui/card/Card";
import { UsuariosTab } from "../../empresa/pages/tabs/UsuariosTab";

const UsuarioConfigPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <AppTitle text="Configuracao do usuario" />
        <AppSubTitle text="Atualize seus dados pessoais e senha." />
      </div>

      <Card>
        <UsuariosTab />
      </Card>
    </div>
  );
};

export default UsuarioConfigPage;
