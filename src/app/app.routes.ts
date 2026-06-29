import { Routes } from '@angular/router';
import { AdminComponent } from './admin/admin';
import { ColaboradoresComponent } from './colaboradores/colaboradores';
import { ControlePontoComponent } from './controle-ponto/controle-ponto';
import { DashboardComponent } from './dashboard/dashboard';
import { FeriasComponent } from './ferias/ferias';
import { TreinamentosComponent } from './treinamentos/treinamentos';
import { NovaEmpresaComponent } from './admin/nova-empresa/nova-empresa';

export const routes: Routes = [
    { path: '', redirectTo: 'admin', pathMatch: 'full' },
    { path: 'admin', component: AdminComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'colaboradores', component: ColaboradoresComponent },
    { path: 'controle-ponto', component: ControlePontoComponent },
    { path: 'ferias', component: FeriasComponent },
    { path: 'treinamentos', component: TreinamentosComponent },
    { path: 'nova-empresa', component: NovaEmpresaComponent},
    { path: 'nova-empresa/:id', component: NovaEmpresaComponent },
];
