import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AcoesTopoComponent } from '../acoes-topo/acoes-topo';

type SituacaoRegistroPonto = 'Sem registro' | 'Completo' | 'Pendente';

interface EmpresaSelecionada {
  id: string;
  nome: string;
  cidade: string;
  logo: string;
}

interface ColaboradorPonto {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  situacao: string;
}

interface RegistroPonto {
  colaboradorId: string;
  nome: string;
  data: string;
  entrada: string;
  saidaAlmoco: string;
  retorno: string;
  saida: string;
  situacao: SituacaoRegistroPonto;
  observacoes: string;
}

@Component({
  selector: 'app-controle-ponto',
  standalone: true,
  imports: [FormsModule, AcoesTopoComponent],
  templateUrl: './controle-ponto.html',
  styleUrl: './controle-ponto.css',
})
export class ControlePontoComponent implements OnInit {
  empresaSelecionada: EmpresaSelecionada = {
    id: 'tx001',
    nome: 'Têxtil Vale Norte',
    cidade: 'Blumenau, SC',
    logo: 'TV',
  };

  colaboradores: ColaboradorPonto[] = [];
  registros: RegistroPonto[] = [];
  dataSelecionada = this.dataHoje();

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit() {
    if (!this.estaNoNavegador()) {
      return;
    }

    this.carregarEmpresaSelecionada();
    this.carregarColaboradores();
    this.carregarRegistros();
  }

  registrosDoDia(): RegistroPonto[] {
    return this.registros.filter((registro) => registro.data === this.dataSelecionada);
  }

  registrosCompletos(): number {
    return this.registrosDoDia().filter((registro) => registro.situacao === 'Completo').length;
  }

  totalHorasDia(): string {
    const total = this.registrosDoDia().reduce(
      (soma, registro) => soma + this.minutosTrabalhados(registro),
      0,
    );

    return this.formatarMinutos(total);
  }

  horasTrabalhadas(registro: RegistroPonto): string {
    return this.formatarMinutos(this.minutosTrabalhados(registro));
  }

  salvarAjustes() {
    if (!this.estaNoNavegador()) {
      return;
    }

    localStorage.setItem(this.chavePonto(), JSON.stringify(this.registros));
    alert('Ajustes de ponto salvos para ' + this.empresaSelecionada.nome + '.');
  }

  alterarData() {
    this.carregarRegistros();
  }

  diaAnterior() {
    this.moverData(-1);
  }

  proximoDia() {
    this.moverData(1);
  }

  irParaHoje() {
    this.dataSelecionada = this.dataHoje();
    this.alterarData();
  }

  atualizarSituacao(registro: RegistroPonto) {
    if (!registro.entrada && !registro.saidaAlmoco && !registro.retorno && !registro.saida) {
      registro.situacao = 'Sem registro';
      return;
    }

    if (registro.entrada && registro.saidaAlmoco && registro.retorno && registro.saida) {
      registro.situacao = 'Completo';
      return;
    }

    registro.situacao = 'Pendente';
  }

  private moverData(dias: number) {
    const data = new Date(this.dataSelecionada + 'T00:00:00');
    data.setDate(data.getDate() + dias);
    this.dataSelecionada = this.dataParaCampo(data);
    this.alterarData();
  }

  private minutosTrabalhados(registro: RegistroPonto): number {
    const primeiroPeriodo = this.diferencaMinutos(registro.entrada, registro.saidaAlmoco);
    const segundoPeriodo = this.diferencaMinutos(registro.retorno, registro.saida);

    return primeiroPeriodo + segundoPeriodo;
  }

  private diferencaMinutos(inicio: string, fim: string): number {
    if (!inicio || !fim) {
      return 0;
    }

    const [horaInicio, minutoInicio] = inicio.split(':').map(Number);
    const [horaFim, minutoFim] = fim.split(':').map(Number);
    const minutosInicio = horaInicio * 60 + minutoInicio;
    const minutosFim = horaFim * 60 + minutoFim;

    return Math.max(minutosFim - minutosInicio, 0);
  }

  private formatarMinutos(totalMinutos: number): string {
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;

    return horas + 'h' + String(minutos).padStart(2, '0');
  }

  private carregarEmpresaSelecionada() {
    const empresaSalva = localStorage.getItem('empresaSelecionadaDashboard');

    if (!empresaSalva) {
      return;
    }

    this.empresaSelecionada = JSON.parse(empresaSalva);
  }

  private carregarColaboradores() {
    const colaboradoresSalvos = localStorage.getItem(this.chaveColaboradores());
    this.colaboradores = colaboradoresSalvos ? JSON.parse(colaboradoresSalvos) : [];
  }

  private carregarRegistros() {
    const registrosSalvos = localStorage.getItem(this.chavePonto());
    const registros = registrosSalvos
      ? JSON.parse(registrosSalvos).map((registro: any) => this.normalizarRegistro(registro))
      : [];

    this.registros = this.sincronizarRegistros(registros);
  }

  private sincronizarRegistros(registros: RegistroPonto[]): RegistroPonto[] {
    const registrosAtualizados = [...registros];

    this.colaboradores.forEach((colaborador) => {
      const existeRegistro = registrosAtualizados.some(
        (registro) =>
          registro.colaboradorId === colaborador.id && registro.data === this.dataSelecionada,
      );

      if (!existeRegistro) {
        registrosAtualizados.push({
          colaboradorId: colaborador.id,
          nome: colaborador.nome,
          data: this.dataSelecionada,
          entrada: '',
          saidaAlmoco: '',
          retorno: '',
          saida: '',
          situacao: 'Sem registro',
          observacoes: '',
        });
      }
    });

    return registrosAtualizados.map((registro) => ({
      ...registro,
      nome:
        this.colaboradores.find((colaborador) => colaborador.id === registro.colaboradorId)?.nome ||
        registro.nome,
    }));
  }

  private normalizarRegistro(registro: any): RegistroPonto {
    const { status, ...dadosRegistro } = registro;

    return {
      ...dadosRegistro,
      situacao: registro.situacao ?? status ?? 'Sem registro',
    };
  }

  private chaveColaboradores(): string {
    return 'colaboradores:' + this.empresaSelecionada.id;
  }

  private chavePonto(): string {
    return 'controlePonto:' + this.empresaSelecionada.id;
  }

  private dataHoje(): string {
    return this.dataParaCampo(new Date());
  }

  private dataParaCampo(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return ano + '-' + mes + '-' + dia;
  }

  private estaNoNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
