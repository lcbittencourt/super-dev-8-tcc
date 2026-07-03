import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

interface EmpresaGestor {
  id: string;
  nome: string;
  cidade: string;
  logo: string;
}

interface Indicador {
  titulo: string;
  valor: string;
  nota: string;
  tendencia: 'positiva' | 'negativa';
}

interface Resumo {
  titulo: string;
  valor: string;
  nota: string;
}

interface BarraGrafico {
  rotulo: string;
  valor: string;
  percentual: number;
}

interface Aprovacao {
  id: string;
  categoria: string;
  data: string;
  solicitante: string;
  iniciais: string;
  detalhe: string;
  status: string;
  situacao: 'pendente' | 'urgente' | 'analise';
}

@Component({
  selector: 'app-gestor',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './gestor.html',
  styleUrl: './gestor.css',
})
export class GestorComponent implements OnInit {
  gestor = 'Gestor';
  empresa: EmpresaGestor = {
    id: 'tx001',
    nome: 'Têxtil Vale Norte',
    cidade: 'Blumenau, SC',
    logo: 'TV',
  };

  menuAberto = false;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit() {
    if (!this.estaNoNavegador()) {
      return;
    }

    this.carregarEmpresaSelecionada();
    this.validarAcessoGestor();
  }


  alternarMenu() {
    if (this.menuAberto === true) {
      this.menuAberto = false;
    } else {
      this.menuAberto = true;
    }
  }

  fecharMenu() {
    this.menuAberto = false;
  }

  iniciaisEmpresa(): string {
    return this.empresa.logo || this.empresa.nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(parte => parte.charAt(0))
      .join('')
      .toUpperCase();
  }

  indicadores: Indicador[] = [
    { titulo: 'Colaboradores', valor: '148', nota: '+3 este mês', tendencia: 'positiva' },
    { titulo: 'Presença hoje', valor: '94%', nota: 'Acima da meta', tendencia: 'positiva' },
    { titulo: 'Chamados abertos', valor: '12', nota: '+4 vs ontem', tendencia: 'negativa' },
    { titulo: 'Aprovações pendentes', valor: '7', nota: 'Requer ação', tendencia: 'negativa' },
  ];

  resumos: Resumo[] = [
    { titulo: 'Férias pendentes', valor: '5', nota: 'Aguardam aprovação' },
    { titulo: 'Treinamentos vencendo', valor: '8', nota: 'Próximos 30 dias' },
    { titulo: 'Horas extras (mês)', valor: '124h', nota: 'Banco da equipe' },
    { titulo: 'Novos colaboradores', valor: '3', nota: 'Em onboarding' },
  ];

  presencaMensal: BarraGrafico[] = [
    { rotulo: 'Semana 1', valor: '92%', percentual: 92 },
    { rotulo: 'Semana 2', valor: '95%', percentual: 95 },
    { rotulo: 'Semana 3', valor: '91%', percentual: 91 },
    { rotulo: 'Semana 4', valor: '94%', percentual: 94 },
  ];

  chamadosPorCategoria: BarraGrafico[] = [
    { rotulo: 'TI', valor: '5', percentual: 100 },
    { rotulo: 'Predial', valor: '4', percentual: 80 },
    { rotulo: 'Manutenção', valor: '2', percentual: 40 },
    { rotulo: 'RH', valor: '1', percentual: 20 },
  ];

  private carregarEmpresaSelecionada() {
    const empresaSalva = this.lerJson('empresaSelecionadaDashboard', null);

    if (!empresaSalva) {
      return;
    }

    this.empresa = {
      ...this.empresa,
      ...empresaSalva,
      cidade: empresaSalva.cidade || this.empresa.cidade,
      logo: empresaSalva.logo || this.empresa.logo,
    };
  }

  private validarAcessoGestor() {
    const acesso = this.lerJson('acessoGestorPulso', null);

    if (!acesso || acesso.empresaId !== this.empresa.id) {
      alert('Faça login como gestor para acessar as informações desta empresa.');
      this.router.navigate(['/admin']);
      return;
    }

    this.gestor = acesso.nome || 'Gestor';
  }

  private lerJson(chave: string, retornoPadrao: any) {
    const valor = localStorage.getItem(chave);

    if (!valor) {
      return retornoPadrao;
    }

    try {
      return JSON.parse(valor);
    } catch {
      return retornoPadrao;
    }
  }

  private estaNoNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  aprovacoes: Aprovacao[] = [
    {
      id: '#0412',
      categoria: 'Férias',
      data: '20/05/2025',
      solicitante: 'Ana Lima',
      iniciais: 'AL',
      detalhe: '15 dias · jun/25',
      status: 'Pendente',
      situacao: 'pendente',
    },
    {
      id: '#0411',
      categoria: 'Hora extra',
      data: '20/05/2025',
      solicitante: 'Carlos Souza',
      iniciais: 'CS',
      detalhe: '4h sábado',
      status: 'Pendente',
      situacao: 'pendente',
    },
    {
      id: '#0410',
      categoria: 'Chamado TI',
      data: '19/05/2025',
      solicitante: 'Mariana Silva',
      iniciais: 'MS',
      detalhe: 'Acesso bloqueado',
      status: 'Urgente',
      situacao: 'urgente',
    },
    {
      id: '#0409',
      categoria: 'Treinamento',
      data: '18/05/2025',
      solicitante: 'Pedro Rocha',
      iniciais: 'PR',
      detalhe: 'NR-35 renovação',
      status: 'Análise',
      situacao: 'analise',
    },
    {
      id: '#0408',
      categoria: 'Afastamento',
      data: '17/05/2025',
      solicitante: 'Fernanda Costa',
      iniciais: 'FC',
      detalhe: 'Atestado 5 dias',
      status: 'Pendente',
      situacao: 'pendente',
    },
  ];
}
