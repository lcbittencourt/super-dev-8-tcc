import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  private empresasRemovidas = [
    'ml002',
    'cf003',
    'tc004',
    'al005',
    'pl006'
  ];

  private nomesEmpresasRemovidas = [
    'metalurgica muller',
    'confeccoes schmitt',
    'tecnocampo solucoes',
    'alimentos beira-rio',
    'plastico riedel',
    'plasticos riedel'
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.limparDadosEmpresasRemovidas();
    this.prepararDemonstracaoTextilValeNorte();
  }

  private limparDadosEmpresasRemovidas() {
    const empresasSalvas = this.lerJson('empresas', [])
      .filter((empresa: any) => !this.empresaFoiRemovida(empresa));

    localStorage.setItem('empresas', JSON.stringify(empresasSalvas));

    this.empresasRemovidas.forEach(id => {
      [
        'modulos',
        'colaboradores',
        'controlePonto',
        'ferias',
        'treinamentos',
        'chamados',
        'usuariosSistema'
      ].forEach(prefixo => localStorage.removeItem(`${prefixo}:${id}`));
    });

    ['empresaSelecionadaDashboard', 'empresaEmEdicao'].forEach(chave => {
      const empresa = this.lerJson(chave, null);

      if (empresa && this.empresaFoiRemovida(empresa)) {
        localStorage.removeItem(chave);
      }
    });
  }


  private prepararDemonstracaoTextilValeNorte() {
    const chaveChamados = 'chamados:tx001';
    const chamadosSalvos = this.lerJson(chaveChamados, null);

    if (!Array.isArray(chamadosSalvos) || chamadosSalvos.length === 0) {
      localStorage.setItem(
        chaveChamados,
        JSON.stringify(this.chamadosDemonstracaoTextilValeNorte())
      );
    }

    const chaveUsuarios = 'usuariosSistema:tx001';
    const usuariosSalvos = this.lerJson(chaveUsuarios, null);

    if (!Array.isArray(usuariosSalvos) || usuariosSalvos.length === 0) {
      localStorage.setItem(
        chaveUsuarios,
        JSON.stringify(this.usuariosDemonstracaoTextilValeNorte())
      );
    }
  }

  private chamadosDemonstracaoTextilValeNorte() {
    const ano = new Date().getFullYear();
    const colaboradores = this.lerJson('colaboradores:tx001', []);
    const solicitante = (indice: number, nome: string, setor: string) => {
      const colaborador = Array.isArray(colaboradores) ? colaboradores[indice] : null;

      return {
        id: colaborador?.id || 'demo-col-' + String(indice + 1).padStart(3, '0'),
        nome: colaborador?.nome || nome,
        setor: colaborador?.departamento || setor
      };
    };
    const mensagem = (autor: string, perfil: string, texto: string, data: string, interna = false) => ({
      autor,
      perfil,
      texto,
      data,
      interna
    });

    const ana = solicitante(0, 'Ana Paula Martins', 'RH');
    const bruno = solicitante(1, 'Bruno Costa', 'Financeiro');
    const carla = solicitante(2, 'Carla Mendes', 'Produção');
    const diego = solicitante(3, 'Diego Rocha', 'Treinamentos');
    const fernanda = solicitante(4, 'Fernanda Lima', 'Comercial');
    const rafael = solicitante(5, 'Rafael Souza', 'Vendas');

    const chamado1Abertura = this.dataDemonstracao(2, 9, 12);
    const chamado1Atualizacao = this.dataDemonstracao(1, 14, 35);
    const chamado2Abertura = this.dataDemonstracao(1, 10, 5);
    const chamado2Atualizacao = this.dataDemonstracao(0, 8, 48);
    const chamado3Abertura = this.dataDemonstracao(1, 8, 20);
    const chamado3Atualizacao = this.dataDemonstracao(0, 10, 35);
    const chamado4Abertura = this.dataDemonstracao(0, 9, 25);
    const chamado5Abertura = this.dataDemonstracao(0, 7, 55);
    const chamado5Atualizacao = this.dataDemonstracao(0, 8, 10);
    const chamado6Abertura = this.dataDemonstracao(4, 15, 20);
    const chamado6Atualizacao = this.dataDemonstracao(3, 11, 40);

    return [
      {
        id: 'demo-chamado-001',
        numero: 'CH-' + ano + '-0001',
        titulo: 'Notebook não liga',
        descricao: 'Equipamento do RH não liga após queda de energia. Colaboradora precisa acessar documentos de admissão.',
        categoria: 'Computador com problema',
        prioridade: 'Urgente',
        solicitanteId: ana.id,
        solicitante: ana.nome,
        setorSolicitante: ana.setor,
        setorDestino: 'TI',
        dataAbertura: chamado1Abertura,
        ultimaAtualizacao: chamado1Atualizacao,
        responsavel: 'Marcos Silva',
        sla: '8h',
        situacao: 'Em andamento',
        mensagens: [
          mensagem(ana.nome, 'Colaborador', 'O notebook não liga e preciso acessar os arquivos do setor.', chamado1Abertura),
          mensagem('Marcos Silva', 'Gestor', 'Chamado assumido. Vou verificar fonte, carregador e necessidade de troca do equipamento.', chamado1Atualizacao)
        ],
        observacoesInternas: [
          'Triagem inicial: possível falha de fonte. Verificar equipamento reserva.'
        ],
        arquivos: ['foto-notebook-rh.jpg']
      },
      {
        id: 'demo-chamado-002',
        numero: 'CH-' + ano + '-0002',
        titulo: 'Solicitação de acesso ao sistema de folha',
        descricao: 'Necessário liberar acesso de consulta ao sistema de folha para conferência mensal.',
        categoria: 'Solicitação de acesso',
        prioridade: 'Alta',
        solicitanteId: bruno.id,
        solicitante: bruno.nome,
        setorSolicitante: bruno.setor,
        setorDestino: 'TI',
        dataAbertura: chamado2Abertura,
        ultimaAtualizacao: chamado2Atualizacao,
        responsavel: 'Juliana Prado',
        sla: '24h',
        situacao: 'Aguardando colaborador',
        mensagens: [
          mensagem(bruno.nome, 'Colaborador', 'Solicito acesso de consulta ao sistema de folha.', chamado2Abertura),
          mensagem('Juliana Prado', 'Gestor', 'Por favor, envie o perfil de acesso necessário e aprovação do gestor do setor.', chamado2Atualizacao)
        ],
        observacoesInternas: [
          'Aguardar confirmação do nível de permissão antes de liberar.'
        ],
        arquivos: []
      },
      {
        id: 'demo-chamado-003',
        numero: 'CH-' + ano + '-0003',
        titulo: 'Dúvida sobre banco de horas',
        descricao: 'Colaboradora solicitou conferência de saldo de banco de horas referente ao último fechamento.',
        categoria: 'Banco de horas',
        prioridade: 'Média',
        solicitanteId: carla.id,
        solicitante: carla.nome,
        setorSolicitante: carla.setor,
        setorDestino: 'RH',
        dataAbertura: chamado3Abertura,
        ultimaAtualizacao: chamado3Atualizacao,
        responsavel: 'Patrícia Nunes',
        sla: '48h',
        situacao: 'Resolvido',
        mensagens: [
          mensagem(carla.nome, 'Colaborador', 'Gostaria de confirmar meu saldo de banco de horas.', chamado3Abertura),
          mensagem('Patrícia Nunes', 'Gestor', 'Saldo conferido e espelho enviado para validação.', chamado3Atualizacao)
        ],
        observacoesInternas: [],
        arquivos: ['espelho-banco-horas.pdf'],
        avaliacao: {
          nota: 5,
          resolvido: true,
          comentario: 'Atendimento rápido e esclarecedor.',
          data: chamado3Atualizacao
        }
      },
      {
        id: 'demo-chamado-004',
        numero: 'CH-' + ano + '-0004',
        titulo: 'Ar-condicionado da sala de treinamento',
        descricao: 'A sala de treinamento está com ar-condicionado sem refrigeração desde o início da manhã.',
        categoria: 'Ar-condicionado',
        prioridade: 'Baixa',
        solicitanteId: diego.id,
        solicitante: diego.nome,
        setorSolicitante: diego.setor,
        setorDestino: 'Facilities / Patrimônio',
        dataAbertura: chamado4Abertura,
        ultimaAtualizacao: chamado4Abertura,
        responsavel: '',
        sla: '72h',
        situacao: 'Aberto',
        mensagens: [
          mensagem(diego.nome, 'Colaborador', 'Solicito verificação do ar-condicionado da sala de treinamento.', chamado4Abertura)
        ],
        observacoesInternas: [],
        arquivos: []
      },
      {
        id: 'demo-chamado-005',
        numero: 'CH-' + ano + '-0005',
        titulo: 'Sistema interno fora do ar',
        descricao: 'Equipe comercial não consegue acessar o sistema interno de pedidos.',
        categoria: 'Sistema interno fora do ar',
        prioridade: 'Crítica',
        solicitanteId: fernanda.id,
        solicitante: fernanda.nome,
        setorSolicitante: fernanda.setor,
        setorDestino: 'TI',
        dataAbertura: chamado5Abertura,
        ultimaAtualizacao: chamado5Atualizacao,
        responsavel: 'Marcos Silva',
        sla: '4h',
        situacao: 'Em análise',
        mensagens: [
          mensagem(fernanda.nome, 'Colaborador', 'O sistema de pedidos está indisponível para toda a equipe comercial.', chamado5Abertura),
          mensagem('Marcos Silva', 'Gestor', 'Incidente em análise com prioridade crítica.', chamado5Atualizacao)
        ],
        observacoesInternas: [
          'Verificar integração com servidor de autenticação.'
        ],
        arquivos: ['erro-sistema-pedidos.png']
      },
      {
        id: 'demo-chamado-006',
        numero: 'CH-' + ano + '-0006',
        titulo: 'Reembolso de viagem',
        descricao: 'Solicitação de análise de comprovantes de deslocamento para visita técnica.',
        categoria: 'Reembolso',
        prioridade: 'Média',
        solicitanteId: rafael.id,
        solicitante: rafael.nome,
        setorSolicitante: rafael.setor,
        setorDestino: 'Financeiro',
        dataAbertura: chamado6Abertura,
        ultimaAtualizacao: chamado6Atualizacao,
        responsavel: 'Eduardo Almeida',
        sla: '48h',
        situacao: 'Resolvido',
        mensagens: [
          mensagem(rafael.nome, 'Colaborador', 'Encaminho comprovantes para reembolso da visita técnica.', chamado6Abertura),
          mensagem('Eduardo Almeida', 'Gestor', 'Reembolso validado e enviado para pagamento.', chamado6Atualizacao)
        ],
        observacoesInternas: [],
        arquivos: ['comprovantes-visita-tecnica.pdf'],
        avaliacao: {
          nota: 4,
          resolvido: true,
          comentario: 'Processo resolvido corretamente.',
          data: chamado6Atualizacao
        }
      }
    ];
  }

  private usuariosDemonstracaoTextilValeNorte() {
    return [
      {
        id: 'demo-usuario-001',
        nome: 'Marcos Silva',
        email: 'marcos.silva@textilvalenorte.com.br',
        login: 'marcos.silva',
        senhaTemporaria: 'TEMP-482915',
        perfil: 'Gestor',
        setor: 'TI',
        cargo: 'Coordenador de suporte',
        situacao: 'Ativo',
        permissoes: 'Atender chamados de TI, alterar prioridade e encerrar chamados.'
      },
      {
        id: 'demo-usuario-002',
        nome: 'Patrícia Nunes',
        email: 'patricia.nunes@textilvalenorte.com.br',
        login: 'patricia.nunes',
        senhaTemporaria: 'TEMP-739204',
        perfil: 'Gestor',
        setor: 'RH',
        cargo: 'Analista de RH',
        situacao: 'Ativo',
        permissoes: 'Atender chamados de RH e responder solicitações de colaboradores.'
      },
      {
        id: 'demo-usuario-003',
        nome: 'Eduardo Almeida',
        email: 'eduardo.almeida@textilvalenorte.com.br',
        login: 'eduardo.almeida',
        senhaTemporaria: 'TEMP-158640',
        perfil: 'Administrador',
        setor: 'Financeiro',
        cargo: 'Controller',
        situacao: 'Ativo',
        permissoes: 'Administrar usuários, setores e chamados financeiros.'
      }
    ];
  }

  private dataDemonstracao(diasAtras: number, hora: number, minuto: number): string {
    const data = new Date();
    data.setDate(data.getDate() - diasAtras);
    data.setHours(hora, minuto, 0, 0);

    return data.toISOString();
  }

  private empresaFoiRemovida(empresa: any): boolean {
    const id = empresa?.id;
    const nome = this.normalizarTexto(empresa?.nome || empresa?.nomeFantasia || empresa?.razaoSocial || '');

    return this.empresasRemovidas.includes(id)
      || this.nomesEmpresasRemovidas.includes(nome);
  }

  private normalizarTexto(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
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
