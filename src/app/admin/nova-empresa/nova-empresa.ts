import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-nova-empresa',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './nova-empresa.html',
  styleUrl: './nova-empresa.css'
})
export class NovaEmpresaComponent {
  planoSelecionado = 'Profissional';

  selecionarPlano(plano: string) {
    this.planoSelecionado = plano;
  }
}
