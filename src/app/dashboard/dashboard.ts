import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AcoesTopoComponent } from '../acoes-topo/acoes-topo';

interface EmpresaPainel {
  id: string;
  nome: string;
  cidade: string;
  plano: string;
  usuarios: number;
  modulos: number;
  situacao: string;
  logo: string;
}

interface ColaboradorPainel {
  nome: string;
  situacao: string;
  diasLicencaMedica?: number;
}

interface RegistroPontoPainel {
  colaboradorId?: string;
  data?: string;
  situacao?: string;
}

interface BarraDashboard {
  rotulo: string;
  valor: number;
  detalhe: string;
  percentual: number;
  percentualQuadro: number;
  classe: 'presenca' | 'ferias' | 'licenca' | 'treinamento' | 'chamado';
}

interface SegmentoQuadro {
  rotulo: string;
  valor: number;
  percentual: number;
  classe: 'ativo' | 'ferias' | 'licenca' | 'inativo';
}

interface TendenciaPresenca {
  data: string;
  dia: string;
  rotulo: string;
  completos: number;
  total: number;
  percentual: number;
}

interface AlertaDashboard {
  titulo: string;
  detalhe: string;
  classe: 'positivo' | 'atencao' | 'critico' | 'neutro';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, AcoesTopoComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  empresa: EmpresaPainel = {
    id: 'tx001',
    nome: 'Têxtil Vale Norte',
    cidade: 'Blumenau, SC',
    plano: 'Empresarial',
    usuarios: 0,
    modulos: 8,
    situacao: 'Ativa',
    logo: 'TV',
  };

  colaboradores: ColaboradorPainel[] = [];
  chamados: any[] = [];
  registrosPonto: RegistroPontoPainel[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit() {
    if (!this.estaNoNavegador()) {
      return;
    }

    const empresaSelecionada = localStorage.getItem('empresaSelecionadaDashboard');

    if (empresaSelecionada) {
      this.empresa = this.normalizarEmpresa(JSON.parse(empresaSelecionada));
    }

    this.colaboradores = this.lerJson(this.chaveColaboradores(), []);
    this.chamados = this.lerJson('chamados:' + this.empresa.id, []);
    this.registrosPonto = this.lerJson('controlePonto:' + this.empresa.id, []);
  }

  funcionarios(): number {
    return this.colaboradores.length;
  }

  ferias(): number {
    return this.contarSituacao('Férias');
  }

  licencaMedica(): number {
    return this.contarSituacao('Licença Médica/Atestado');
  }

  inativos(): number {
    return this.contarSituacao('Inativo');
  }

  presentesHoje(): number {
    return Math.max(this.funcionarios() - this.ferias() - this.licencaMedica(), 0);
  }

  taxaPresenca(): number {
    const funcionarios = this.funcionarios();

    if (!funcionarios) {
      return 0;
    }

    return Math.round((this.presentesHoje() / funcionarios) * 100);
  }

  ausenciasHoje(): number {
    return this.ferias() + this.licencaMedica();
  }

  demandasAbertas(): number {
    return this.treinamentosPendentes() + this.chamadosAbertos();
  }

  indiceOperacional(): number {
    if (!this.funcionarios()) {
      return 0;
    }

    const penalidadeDemandas = Math.min(this.demandasAbertas() * 4, 28);
    const penalidadeLicenca = Math.min(this.licencaMedica() * 5, 18);

    return Math.max(0, Math.min(100, Math.round(this.taxaPresenca() - penalidadeDemandas - penalidadeLicenca)));
  }

  classeIndiceOperacional(): string {
    const indice = this.indiceOperacional();

    if (indice >= 80) {
      return 'bom';
    }

    if (indice >= 55) {
      return 'atencao';
    }

    return 'critico';
  }

  aniversariantes(): number {
    return 0;
  }

  treinamentosPendentes(): number {
    if (!this.estaNoNavegador()) {
      return 0;
    }

    const dadosTreinamentos = this.lerJson('treinamentos:' + this.empresa.id, null);

    if (!dadosTreinamentos) {
      return 0;
    }

    const cursosColaborador = (dadosTreinamentos.cursosColaborador || []).filter(
      (curso: any) => !['integracao', 'lgpd'].includes(curso.id),
    );
    const acompanhamentos = (dadosTreinamentos.acompanhamentos || []).filter(
      (item: any) => item.colaboradorId,
    );

    return (
      cursosColaborador.filter((curso: any) => Number(curso.progresso || 0) < 100).length +
      acompanhamentos.filter((item: any) => item.situacao === 'Pendente').length
    );
  }

  chamadosAbertos(): number {
    return Array.isArray(this.chamados)
      ? this.chamados.filter(
          (chamado: any) =>
            !['Resolvido', 'Cancelado'].includes(chamado.situacao || chamado.status),
        ).length
      : 0;
  }

  chamadosRecentes(): any[] {
    return Array.isArray(this.chamados) ? this.chamados.slice(0, 5) : [];
  }

  totalDiasLicenca(): number {
    return this.colaboradores
      .filter((colaborador) => colaborador.situacao === 'Licença Médica/Atestado')
      .reduce((total, colaborador) => total + Number(colaborador.diasLicencaMedica || 0), 0);
  }

  composicaoQuadro(): SegmentoQuadro[] {
    const total = Math.max(this.funcionarios(), 1);
    const ativos = this.colaboradores.filter((colaborador) => colaborador.situacao === 'Ativo').length;

    return [
      {
        rotulo: 'Ativos',
        valor: ativos,
        percentual: this.percentualReal(ativos, total),
        classe: 'ativo',
      },
      {
        rotulo: 'Férias',
        valor: this.ferias(),
        percentual: this.percentualReal(this.ferias(), total),
        classe: 'ferias',
      },
      {
        rotulo: 'Licença',
        valor: this.licencaMedica(),
        percentual: this.percentualReal(this.licencaMedica(), total),
        classe: 'licenca',
      },
      {
        rotulo: 'Inativos',
        valor: this.inativos(),
        percentual: this.percentualReal(this.inativos(), total),
        classe: 'inativo',
      },
    ];
  }

  graficoResumo(): BarraDashboard[] {
    const maior = Math.max(
      this.presentesHoje(),
      this.ferias(),
      this.licencaMedica(),
      this.treinamentosPendentes(),
      this.chamadosAbertos(),
      1,
    );
    const totalColaboradores = Math.max(this.funcionarios(), 1);

    return [
      {
        rotulo: 'Presentes hoje',
        valor: this.presentesHoje(),
        detalhe: 'colaboradores presentes',
        percentual: this.percentual(this.presentesHoje(), maior),
        percentualQuadro: this.percentualReal(this.presentesHoje(), totalColaboradores),
        classe: 'presenca',
      },
      {
        rotulo: 'Férias',
        valor: this.ferias(),
        detalhe: 'colaboradores ausentes',
        percentual: this.percentual(this.ferias(), maior),
        percentualQuadro: this.percentualReal(this.ferias(), totalColaboradores),
        classe: 'ferias',
      },
      {
        rotulo: 'Licença médica',
        valor: this.licencaMedica(),
        detalhe: this.totalDiasLicenca() + ' dia(s) informados',
        percentual: this.percentual(this.licencaMedica(), maior),
        percentualQuadro: this.percentualReal(this.licencaMedica(), totalColaboradores),
        classe: 'licenca',
      },
      {
        rotulo: 'Treinamentos',
        valor: this.treinamentosPendentes(),
        detalhe: 'pendentes',
        percentual: this.percentual(this.treinamentosPendentes(), maior),
        percentualQuadro: 0,
        classe: 'treinamento',
      },
      {
        rotulo: 'Chamados',
        valor: this.chamadosAbertos(),
        detalhe: 'em aberto',
        percentual: this.percentual(this.chamadosAbertos(), maior),
        percentualQuadro: 0,
        classe: 'chamado',
      },
    ];
  }

  tendenciaPresenca(): TendenciaPresenca[] {
    const hoje = new Date();
    const dias: TendenciaPresenca[] = [];

    for (let indice = 6; indice >= 0; indice--) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() - indice);
      const dataCampo = this.dataParaCampo(data);
      const registrosDia = this.registrosPonto.filter((registro) => registro.data === dataCampo);
      const total = registrosDia.length || this.funcionarios();
      const completos = registrosDia.filter((registro) => registro.situacao === 'Completo').length;

      dias.push({
        data: dataCampo,
        dia: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
          .format(data)
          .replace('.', ''),
        rotulo: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(data),
        completos,
        total,
        percentual: total ? Math.round((completos / total) * 100) : 0,
      });
    }

    return dias;
  }

  alertasDashboard(): AlertaDashboard[] {
    const alertas: AlertaDashboard[] = [];

    if (!this.funcionarios()) {
      return [
        {
          titulo: 'Sem colaboradores',
          detalhe: 'Cadastre colaboradores para alimentar os indicadores.',
          classe: 'neutro',
        },
      ];
    }

    if (this.indiceOperacional() >= 80 && this.demandasAbertas() === 0) {
      alertas.push({
        titulo: 'Operação estável',
        detalhe: 'Presença saudável e sem demandas abertas.',
        classe: 'positivo',
      });
    }

    if (this.licencaMedica() > 0) {
      alertas.push({
        titulo: 'Licença médica ativa',
        detalhe: this.licencaMedica() + ' colaborador(es), ' + this.totalDiasLicenca() + ' dia(s) informados.',
        classe: 'critico',
      });
    }

    if (this.chamadosAbertos() > 0) {
      alertas.push({
        titulo: 'Chamados em aberto',
        detalhe: this.chamadosAbertos() + ' chamado(s) aguardando andamento.',
        classe: 'atencao',
      });
    }

    if (this.treinamentosPendentes() > 0) {
      alertas.push({
        titulo: 'Treinamentos pendentes',
        detalhe: this.treinamentosPendentes() + ' pendência(s) para acompanhar.',
        classe: 'atencao',
      });
    }

    if (this.ferias() > 0) {
      alertas.push({
        titulo: 'Férias programadas',
        detalhe: this.ferias() + ' colaborador(es) fora da operação.',
        classe: 'neutro',
      });
    }

    return alertas.slice(0, 4);
  }

  estiloAnelResumo(): string {
    const presentes = this.taxaPresenca();
    const ferias = this.percentualReal(this.ferias(), Math.max(this.funcionarios(), 1));
    const licenca = this.percentualReal(this.licencaMedica(), Math.max(this.funcionarios(), 1));
    const fimFerias = Math.min(presentes + ferias, 100);
    const fimLicenca = Math.min(fimFerias + licenca, 100);

    return (
      'conic-gradient(#2f6f4e 0 ' +
      presentes +
      '%, #d99a2b ' +
      presentes +
      '% ' +
      fimFerias +
      '%, #b51a2b ' +
      fimFerias +
      '% ' +
      fimLicenca +
      '%, #efe6d7 ' +
      fimLicenca +
      '% 100%)'
    );
  }

  private percentual(valor: number, maior: number): number {
    if (valor <= 0) {
      return 0;
    }

    return Math.max(4, Math.round((valor / maior) * 100));
  }

  private percentualReal(valor: number, total: number): number {
    if (!total) {
      return 0;
    }

    return Math.round((valor / total) * 100);
  }

  private contarSituacao(situacao: string): number {
    return this.colaboradores.filter((colaborador) => colaborador.situacao === situacao).length;
  }

  private dataParaCampo(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return ano + '-' + mes + '-' + dia;
  }

  private normalizarEmpresa(empresa: any): EmpresaPainel {
    const { users, status, ...dadosEmpresa } = empresa;

    return {
      ...this.empresa,
      ...dadosEmpresa,
      usuarios: empresa.usuarios ?? users ?? this.empresa.usuarios,
      situacao: empresa.situacao ?? status ?? this.empresa.situacao,
    };
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

  private chaveColaboradores(): string {
    return 'colaboradores:' + this.empresa.id;
  }
}
