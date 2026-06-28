import { Routes } from '@angular/router';
import { AdminComponent } from './admin/admin';
import { ColaboradoresComponent } from './colaboradores/colaboradores';
import { NovaEmpresaComponent } from './admin/nova-empresa/nova-empresa';

export const routes: Routes = [
    { path: '', redirectTo: 'admin', pathMatch: 'full' },
    { path: 'admin', component: AdminComponent },
    { path: 'colaboradores', component: ColaboradoresComponent },
    { path: 'nova-empresa', component: NovaEmpresaComponent},
    { path: 'nova-empresa/:id', component: NovaEmpresaComponent },
];
