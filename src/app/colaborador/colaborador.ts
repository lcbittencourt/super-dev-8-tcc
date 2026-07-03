import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-colaborador',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './colaborador.html',
  styleUrl: './colaborador.css'
})
export class ColaboradorComponent {

}
