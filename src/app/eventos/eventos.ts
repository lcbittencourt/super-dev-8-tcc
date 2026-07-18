import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css',
})
export class Eventos {}
