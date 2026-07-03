import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface EmpresaModulo {
  id: string;
  nome: string;
  cidade: string;
  logo: string;
}

@Component({
  selector: 'app-modulo-simples',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './modulo-simples.html',
  styleUrl: './modulo-simples.css',
})
export class ModuloSimplesComponent implements OnInit {
  titulo = 'Módulo';
  descricao = '';
  totalRegistros = 0;

  empresa: EmpresaModulo = {
    id: 'tx001',
    nome: 'Têxtil Vale Norte',
    cidade: 'Blumenau, SC',
    logo: 'TV',
  };

  constructor(
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit() {
    const dados = this.route.snapshot.data as { titulo?: string; descricao?: string };

    this.titulo = dados.titulo || this.titulo;
    this.descricao = dados.descricao || '';

    if (!this.estaNoNavegador()) {
      return;
    }

    this.carregarEmpresaSelecionada();
    this.totalRegistros = this.contarRegistros();
  }

  private carregarEmpresaSelecionada() {
    const empresaSalva = localStorage.getItem('empresaSelecionadaDashboard');

    if (!empresaSalva) {
      return;
    }

    const empresa = JSON.parse(empresaSalva);

    this.empresa = {
      ...this.empresa,
      ...empresa,
      logo: empresa.logo || this.empresa.logo,
    };
  }

  private contarRegistros(): number {
    const chaves: Record<string, string> = {
      Comunicados: 'comunicados',
      Eventos: 'eventos',
      Fornecedores: 'fornecedores',
      Relatórios: 'relatorios',
    };
    const prefixo = chaves[this.titulo];

    if (!prefixo) {
      return 0;
    }

    const registros = JSON.parse(localStorage.getItem(prefixo + ':' + this.empresa.id) || '[]');

    return Array.isArray(registros) ? registros.length : 0;
  }

  private estaNoNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
