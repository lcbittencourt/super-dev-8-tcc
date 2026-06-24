import { Routes } from '@angular/router';
import { AdminComponent } from './admin/admin';
import { NovaEmpresaComponent } from './admin/nova-empresa/nova-empresa';

export const routes: Routes = [
    { path: '', redirectTo: 'admin', pathMatch: 'full' },
    { path: 'admin', component: AdminComponent },
    { path: 'nova-empresa', component: NovaEmpresaComponent},
];
