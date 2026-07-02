import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-chamados',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './chamados.html',
  styleUrl: './chamados.css'
})
export class ChamadosComponent {

  gestor = 'João';
  empresa = 'Têxtil Vale Norte';

}
