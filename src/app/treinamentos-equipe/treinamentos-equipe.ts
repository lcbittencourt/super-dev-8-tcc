import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-treinamentos-equipe',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './treinamentos-equipe.html',
  styleUrl: './treinamentos-equipe.css'
})
export class TreinamentosEquipeComponent {

  gestor = 'João';
  empresa = 'Têxtil Vale Norte';

}
