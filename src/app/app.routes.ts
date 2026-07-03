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
import { TreinamentosEquipeComponent } from './treinamentos-equipe/treinamentos-equipe';
import { ColaboradorComponent } from './colaborador/colaborador';

export const routes: Routes = [
    { path: '', redirectTo: 'admin', pathMatch: 'full' },
    { path: 'admin', component: AdminComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'gestor', component: GestorComponent },
    { path: 'aprovacoes', component: AprovacoesComponent },
    { path: 'chamados', component: ChamadosComponent },
    { path: 'treinamentos-equipe', component: TreinamentosEquipeComponent },
    { path: 'colaboradores', component: ColaboradoresComponent },
    { path: 'colaborador', component: ColaboradorComponent },
    { path: 'controle-ponto', component: ControlePontoComponent },
    { path: 'ferias', component: FeriasComponent },
    { path: 'treinamentos', component: TreinamentosComponent },
    { path: 'nova-empresa', component: NovaEmpresaComponent},
    { path: 'nova-empresa/:id', component: NovaEmpresaComponent },
];
