import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-comunicados',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './comunicados.html',
  styleUrl: './comunicados.css',
})
export class Comunicados {}
