import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';

interface AvisoSistema {
  id: string;
  titulo: string;
  detalhe: string;
  tipo: 'alerta' | 'info' | 'sucesso';
  rota: string;
  parametros?: Record<string, string>;
}

@Component({
  selector: 'app-notificacoes',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './notificacoes.html',
  styleUrl: './notificacoes.css',
})
export class NotificacoesComponent implements OnInit {
  avisos: AvisoSistema[] = [];
  empresaId = 'tx001';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const empresaSalva = this.lerJson('empresaSelecionadaDashboard', null);
    this.empresaId = empresaSalva?.id || this.empresaId;
    this.avisos = this.montarAvisos();
  }

  totalAvisos(): number {
    return this.avisos.length;
  }

  marcarComoLida(aviso: AvisoSistema) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const avisosLidos = this.avisosLidos();

    if (!avisosLidos.includes(aviso.id)) {
      avisosLidos.push(aviso.id);
      localStorage.setItem(this.chaveAvisosLidos(), JSON.stringify(avisosLidos));
    }

    this.avisos = this.avisos.filter((item) => item.id !== aviso.id);
  }

  private montarAvisos(): AvisoSistema[] {
    const avisos: AvisoSistema[] = [];
    const ferias = this.lerJson('ferias:' + this.empresaId, []);
    const chamados = this.lerJson('chamados:' + this.empresaId, []);
    const treinamentos = this.lerJson('treinamentos:' + this.empresaId, {});
    const colaboradores = this.lerJson('colaboradores:' + this.empresaId, []);

    const feriasPendentes = Array.isArray(ferias)
      ? ferias.filter((item: any) => item.situacao === 'Pendente')
      : [];
    const chamadosAbertos = Array.isArray(chamados)
      ? chamados.filter((item: any) => !['Resolvido', 'Cancelado'].includes(item.situacao || item.status))
      : [];
    const treinamentosPendentes = Array.isArray(treinamentos.acompanhamentos)
      ? treinamentos.acompanhamentos.filter((item: any) => item.situacao !== 'Concluído')
      : [];
    const licencas = Array.isArray(colaboradores)
      ? colaboradores.filter((item: any) => item.situacao === 'Licença Médica/Atestado')
      : [];

    if (feriasPendentes.length > 0) {
      avisos.push({
        id: this.criarIdAviso('ferias-pendentes', feriasPendentes),
        titulo: 'Férias pendentes',
        detalhe: feriasPendentes.length + ' solicitação(ões) aguardando análise.',
        tipo: 'alerta',
        rota: '/ferias',
        parametros: { perfil: 'gestor' },
      });
    }

    if (chamadosAbertos.length > 0) {
      avisos.push({
        id: this.criarIdAviso('chamados-abertos', chamadosAbertos),
        titulo: 'Chamados abertos',
        detalhe: chamadosAbertos.length + ' chamado(s) ainda precisam de acompanhamento.',
        tipo: 'info',
        rota: '/chamados',
      });
    }

    if (treinamentosPendentes.length > 0) {
      avisos.push({
        id: this.criarIdAviso('treinamentos-pendentes', treinamentosPendentes),
        titulo: 'Treinamentos pendentes',
        detalhe: treinamentosPendentes.length + ' acompanhamento(s) sem conclusão.',
        tipo: 'alerta',
        rota: '/treinamentos',
        parametros: { perfil: 'gestor' },
      });
    }

    if (licencas.length > 0) {
      avisos.push({
        id: this.criarIdAviso('licenca-medica', licencas),
        titulo: 'Licença médica',
        detalhe: licencas.length + ' colaborador(es) em licença/atestado.',
        tipo: 'info',
        rota: '/colaboradores',
      });
    }

    if (avisos.length === 0) {
      avisos.push({
        id: 'tudo-em-ordem',
        titulo: 'Tudo em ordem',
        detalhe: 'Nenhum aviso crítico para a empresa selecionada.',
        tipo: 'sucesso',
        rota: '/dashboard',
      });
    }

    const avisosLidos = this.avisosLidos();

    return avisos.filter((aviso) => !avisosLidos.includes(aviso.id));
  }

  private criarIdAviso(prefixo: string, itens: any[]): string {
    const assinatura = itens
      .map((item) =>
        String(
          item.id ??
            item.numero ??
            item.colaboradorId ??
            item.colaborador ??
            item.nome ??
            item.curso ??
            item.titulo ??
            JSON.stringify(item),
        ),
      )
      .sort()
      .join('|');

    return prefixo + ':' + assinatura;
  }

  private avisosLidos(): string[] {
    const avisosLidos = this.lerJson(this.chaveAvisosLidos(), []);

    return Array.isArray(avisosLidos) ? avisosLidos : [];
  }

  private chaveAvisosLidos(): string {
    return 'notificacoesLidas:' + this.empresaId;
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
}
