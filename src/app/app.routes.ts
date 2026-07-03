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
<<<<<<< Updated upstream
import { AprovacoesComponent } from './aprovacoes/aprovacoes';
import { TreinamentosEquipeComponent } from './treinamentos-equipe/treinamentos-equipe';
import { ColaboradorComponent } from './colaborador/colaborador';
import { LoginComponent } from './login/login';
=======
import { LoginComponent } from './login/login';
import { ModuloSimplesComponent } from './modulo-simples/modulo-simples';
>>>>>>> Stashed changes

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
    { path: 'login/:perfil', component: LoginComponent },
    { path: 'controle-ponto', component: ControlePontoComponent },
    { path: 'ferias', component: FeriasComponent },
    { path: 'treinamentos', component: TreinamentosComponent },
<<<<<<< Updated upstream
=======
    { path: 'chamados', component: ChamadosComponent },
    {
        path: 'comunicados',
        component: ModuloSimplesComponent,
        data: { titulo: 'Comunicados', descricao: 'Mural e avisos corporativos' },
    },
    {
        path: 'eventos',
        component: ModuloSimplesComponent,
        data: { titulo: 'Eventos', descricao: 'Confraternizações e datas importantes' },
    },
    {
        path: 'fornecedores',
        component: ModuloSimplesComponent,
        data: { titulo: 'Fornecedores', descricao: 'Cadastro e contratos' },
    },
    {
        path: 'relatorios',
        component: ModuloSimplesComponent,
        data: { titulo: 'Relatórios', descricao: 'Exportações e análises customizadas' },
    },
    { path: 'login/:perfil', component: LoginComponent },
>>>>>>> Stashed changes
    { path: 'nova-empresa', component: NovaEmpresaComponent},
    { path: 'nova-empresa/:id', component: NovaEmpresaComponent },
];
