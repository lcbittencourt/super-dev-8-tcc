import { Routes } from '@angular/router';
import { AdminComponent } from './admin/admin';
import { ColaboradoresComponent } from './colaboradores/colaboradores';
import { ControlePontoComponent } from './controle-ponto/controle-ponto';
import { DashboardComponent } from './dashboard/dashboard';
import { GestorComponent } from './gestor/gestor';
import { FeriasComponent } from './ferias/ferias';
import { TreinamentosComponent } from './treinamentos/treinamentos';
import { ChamadosComponent } from './chamados/chamados';
import { NovaEmpresaComponent } from './admin/nova-empresa/nova-empresa';
import { AprovacoesComponent } from './aprovacoes/aprovacoes';
import { ColaboradorComponent } from './colaborador/colaborador';
import { NovoChamado } from './colaborador/novo-chamado/novo-chamado';
import { SolicitarFerias } from './colaborador/solicitar-ferias/solicitar-ferias';
import { TreinamentosColaborador } from './colaborador/treinamentos-colaborador/treinamentos-colaborador';
import { MeusDados } from './colaborador/meus-dados/meus-dados';
import { FornecedoresComponent } from './fornecedores/fornecedores';
import { Comunicados } from './comunicados/comunicados';
import { Eventos } from './eventos/eventos';
import { Relatorios } from './relatorios/relatorios';

export const routes: Routes = [
    { path: '', redirectTo: 'admin', pathMatch: 'full' },
    { path: 'admin', component: AdminComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'gestor', component: GestorComponent },
    { path: 'aprovacoes', component: AprovacoesComponent },
    { path: 'chamados', component: ChamadosComponent },
    { path: 'treinamentos-equipe', component: TreinamentosComponent },
    { path: 'colaboradores', component: ColaboradoresComponent },
    { path: 'colaborador', component: ColaboradorComponent },
    { path: 'novo-chamado', component: NovoChamado },
    { path: 'solicitar-ferias', component: SolicitarFerias },
    { path: 'treinamentos-colaborador', component: TreinamentosColaborador },
    { path: 'meus-dados', component: MeusDados },
    { path: 'controle-ponto', component: ControlePontoComponent },
    { path: 'ferias', component: FeriasComponent },
    { path: 'treinamentos', component: TreinamentosComponent },
    { path: 'fornecedores', component: FornecedoresComponent },
    { path: 'comunicados', component: Comunicados },
    { path: 'eventos', component: Eventos },
    { path: 'relatorios', component: Relatorios },
    { path: 'nova-empresa', component: NovaEmpresaComponent},
    { path: 'nova-empresa/:id', component: NovaEmpresaComponent },
];
