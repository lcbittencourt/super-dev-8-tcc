import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
<<<<<<< Updated upstream
import { RouterLink } from '@angular/router';
=======
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
>>>>>>> Stashed changes

type FiltroChamado = 'Todos' | 'Abertos' | 'Em andamento' | 'Resolvidos';

interface EmpresaSelecionada {
  id: string;
  nome: string;
  cidade: string;
  logo: string;
}

interface ChamadoEmpresa {
  id: string;
  numero: string;
  titulo: string;
  categoria: string;
  prioridade: string;
  solicitante: string;
  setorSolicitante: string;
  dataAbertura: string;
  situacao: string;
  responsavel?: string;
  sla?: string;
}

@Component({
  selector: 'app-chamados',
  standalone: true,
<<<<<<< Updated upstream
  imports: [RouterLink],
=======
  imports: [FormsModule, RouterLink],
>>>>>>> Stashed changes
  templateUrl: './chamados.html',
  styleUrl: './chamados.css',
})
export class ChamadosComponent implements OnInit {
  empresaSelecionada: EmpresaSelecionada = {
    id: 'tx001',
    nome: 'Têxtil Vale Norte',
    cidade: 'Blumenau, SC',
    logo: 'TV',
  };

<<<<<<< Updated upstream
  filtros: FiltroChamado[] = ['Todos', 'Abertos', 'Em andamento', 'Resolvidos'];
  filtroSelecionado: FiltroChamado = 'Todos';
  chamados: ChamadoEmpresa[] = [];
=======
  perfil: PerfilChamado = '';
  mostrarEscolhaPerfil = true;
  pesquisaChamado = '';
  filtroSituacao = 'Todos';
  filtroPrioridade = 'Todas';
  filtroSetor = 'Todos';
  colaboradorAtualId = '';

  colaboradores: ColaboradorChamado[] = [];
  chamados: Chamado[] = [];
  usuariosSistema: UsuarioSistema[] = [];

  chamadoGestorSelecionado: Chamado | null = null;
  chamadoColaboradorSelecionado: Chamado | null = null;
  usuarioEmEdicao = false;

  respostaGestor = '';
  comentarioInterno = '';
  respostaColaborador = '';
  avaliacaoNota = 0;
  avaliacaoResolvido = true;
  avaliacaoComentario = '';

  situacoes: SituacaoChamado[] = [
    'Aberto',
    'Em análise',
    'Em andamento',
    'Aguardando colaborador',
    'Aguardando terceiro',
    'Resolvido',
    'Cancelado',
    'Reaberto',
  ];

  prioridades: PrioridadeChamado[] = ['Baixa', 'Média', 'Alta', 'Urgente', 'Crítica'];

  perfisUsuario: PerfilUsuarioSistema[] = ['Administrador', 'Gestor', 'Colaborador'];

  tiposPorSetor: TiposPorSetor[] = [
    {
      setor: 'TI',
      categorias: [
        'Computador com problema',
        'Internet lenta',
        'Solicitação de acesso',
        'Reset de senha',
        'Instalação de software',
        'E-mail corporativo',
        'Impressora',
        'VPN',
        'Sistema interno fora do ar',
        'Equipamento novo',
      ],
    },
    {
      setor: 'RH',
      categorias: [
        'Dúvida sobre folha de pagamento',
        'Solicitação de declaração',
        'Férias',
        'Banco de horas',
        'Benefícios',
        'Alteração cadastral',
        'Atestado médico',
        'Contracheque',
        'Admissão',
        'Desligamento',
      ],
    },
    {
      setor: 'Financeiro',
      categorias: [
        'Reembolso',
        'Adiantamento',
        'Prestação de contas',
        'Nota fiscal',
        'Pagamento pendente',
        'Correção de dados bancários',
        'Comprovante de pagamento',
      ],
    },
    {
      setor: 'Facilities / Patrimônio',
      categorias: [
        'Manutenção predial',
        'Ar-condicionado',
        'Mesa/cadeira',
        'Limpeza',
        'Iluminação',
        'Sala de reunião',
        'Crachá',
        'Controle de acesso',
        'Equipamentos danificados',
      ],
    },
    {
      setor: 'Compras',
      categorias: [
        'Solicitação de material',
        'Cotação',
        'Pedido de compra',
        'Fornecedor',
        'Acompanhamento de entrega',
        'Reposição de estoque',
      ],
    },
    {
      setor: 'Jurídico / Compliance',
      categorias: [
        'Análise de contrato',
        'Dúvida sobre política interna',
        'LGPD',
        'Código de conduta',
        'Canal de denúncia',
        'Conflito de interesse',
        'Solicitação de documento jurídico',
      ],
    },
    {
      setor: 'Marketing / Comunicação',
      categorias: [
        'Solicitação de arte',
        'Comunicado interno',
        'Divulgação de evento',
        'Atualização de material institucional',
        'Publicação em rede social',
      ],
    },
    {
      setor: 'Segurança do Trabalho',
      categorias: [
        'EPI',
        'Acidente/incidente',
        'Treinamento obrigatório',
        'Risco no ambiente',
        'DDS',
        'Inspeção de segurança',
      ],
    },
  ];

  novoChamado = this.criarChamadoVazio();
  usuarioEmCadastro = this.criarUsuarioVazio();
>>>>>>> Stashed changes

  constructor(
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit() {
    this.aplicarPerfilDaRota();

    if (!this.estaNoNavegador()) {
      return;
    }

    this.carregarEmpresaSelecionada();
    this.carregarChamadosDaEmpresa();
  }

  selecionarFiltro(filtro: FiltroChamado) {
    this.filtroSelecionado = filtro;
  }

<<<<<<< Updated upstream
  chamadosFiltrados(): ChamadoEmpresa[] {
    return this.filtrarChamados(this.filtroSelecionado);
=======
  private aplicarPerfilDaRota() {
    const perfil = this.route.snapshot.queryParamMap.get('perfil');

    if (perfil === 'gestor' || perfil === 'colaborador') {
      this.escolherPerfil(perfil);
    }
  }

  chamadosFiltrados(): Chamado[] {
    const pesquisa = this.pesquisaChamado.trim().toLowerCase();

    return this.chamados.filter((chamado) => {
      const texto = [
        chamado.numero,
        chamado.titulo,
        chamado.solicitante,
        chamado.setorSolicitante,
        chamado.setorDestino,
        chamado.categoria,
        chamado.responsavel,
        chamado.situacao,
        chamado.prioridade,
      ]
        .join(' ')
        .toLowerCase();

      const combinaPesquisa = !pesquisa || texto.includes(pesquisa);
      const combinaSituacao =
        this.filtroSituacao === 'Todos' || chamado.situacao === this.filtroSituacao;
      const combinaPrioridade =
        this.filtroPrioridade === 'Todas' || chamado.prioridade === this.filtroPrioridade;
      const combinaSetor =
        this.filtroSetor === 'Todos' || chamado.setorDestino === this.filtroSetor;

      return combinaPesquisa && combinaSituacao && combinaPrioridade && combinaSetor;
    });
>>>>>>> Stashed changes
  }

  private filtrarChamados(filtro: FiltroChamado): ChamadoEmpresa[] {
    if (filtro === 'Todos') {
      return this.chamados;
    }

<<<<<<< Updated upstream
    if (filtro === 'Abertos') {
      return this.chamados.filter((chamado) =>
        ['Aberto', 'Em análise', 'Aguardando colaborador', 'Aguardando terceiro', 'Reaberto'].includes(
          chamado.situacao,
        ),
      );
=======
    if (!this.colaboradorAtualId) {
      return [];
    }

    return this.chamados.filter((chamado) => chamado.solicitanteId === this.colaboradorAtualId);
  }

  chamadosDoColaboradorFiltrados(): Chamado[] {
    const pesquisa = this.pesquisaChamado.trim().toLowerCase();

    return this.chamadosDoColaborador().filter((chamado) => {
      const texto = [
        chamado.numero,
        chamado.titulo,
        chamado.setorDestino,
        chamado.categoria,
        chamado.situacao,
      ]
        .join(' ')
        .toLowerCase();

      return !pesquisa || texto.includes(pesquisa);
    });
  }

  chamadosAbertos(): number {
    return this.chamados.filter((chamado) => this.chamadoAberto(chamado)).length;
  }

  chamadosEmAndamento(): number {
    return this.chamados.filter((chamado) => chamado.situacao === 'Em andamento').length;
  }

  aguardandoColaborador(): number {
    return this.chamados.filter((chamado) => chamado.situacao === 'Aguardando colaborador').length;
  }

  resolvidosHoje(): number {
    const hoje = this.dataHoje();

    return this.chamados.filter(
      (chamado) =>
        chamado.situacao === 'Resolvido' &&
        this.dataParaCampo(new Date(chamado.ultimaAtualizacao)) === hoje,
    ).length;
  }

  tempoMedioResposta(): string {
    const tempos = this.chamados
      .map((chamado) => {
        const primeiraResposta = chamado.mensagens.find(
          (mensagem) => mensagem.perfil === 'Gestor' && !mensagem.interna,
        );

        if (!primeiraResposta) {
          return 0;
        }

        return new Date(primeiraResposta.data).getTime() - new Date(chamado.dataAbertura).getTime();
      })
      .filter((tempo) => tempo > 0);

    if (!tempos.length) {
      return '0h00';
    }

    const media = tempos.reduce((total, tempo) => total + tempo, 0) / tempos.length;
    const horas = Math.floor(media / 3600000);
    const minutos = Math.round((media % 3600000) / 60000);

    return horas + 'h' + String(minutos).padStart(2, '0');
  }

  chamadosUrgentes(): number {
    return this.chamados.filter(
      (chamado) =>
        this.chamadoAberto(chamado) && ['Urgente', 'Crítica'].includes(chamado.prioridade),
    ).length;
  }

  meusChamadosAbertos(): number {
    return this.chamadosDoColaborador().filter((chamado) => this.chamadoAberto(chamado)).length;
  }

  meusChamadosEmAndamento(): number {
    return this.chamadosDoColaborador().filter((chamado) => chamado.situacao === 'Em andamento')
      .length;
  }

  meusChamadosResolvidos(): number {
    return this.chamadosDoColaborador().filter((chamado) => chamado.situacao === 'Resolvido')
      .length;
  }

  aguardandoMinhaResposta(): number {
    return this.chamadosDoColaborador().filter(
      (chamado) => chamado.situacao === 'Aguardando colaborador',
    ).length;
  }

  setores(): string[] {
    return this.tiposPorSetor.map((item) => item.setor);
  }

  categoriasDoSetor(setor = this.novoChamado.setorDestino): string[] {
    return this.tiposPorSetor.find((item) => item.setor === setor)?.categorias || [];
  }

  categoriasMaisAbertas(): { categoria: string; total: number }[] {
    const contagem = new Map<string, number>();

    this.chamados.forEach((chamado) => {
      contagem.set(chamado.categoria, (contagem.get(chamado.categoria) || 0) + 1);
    });

    return Array.from(contagem.entries())
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }

  resumoPorSetor(): { setor: string; abertos: number; resolvidos: number }[] {
    return this.setores().map((setor) => ({
      setor,
      abertos: this.chamados.filter(
        (chamado) => chamado.setorDestino === setor && this.chamadoAberto(chamado),
      ).length,
      resolvidos: this.chamados.filter(
        (chamado) => chamado.setorDestino === setor && chamado.situacao === 'Resolvido',
      ).length,
    }));
  }

  abrirDetalheGestor(chamado: Chamado) {
    this.chamadoGestorSelecionado = chamado;
    this.respostaGestor = '';
    this.comentarioInterno = '';
  }

  abrirDetalheColaborador(chamado: Chamado) {
    this.chamadoColaboradorSelecionado = chamado;
    this.respostaColaborador = '';
    this.avaliacaoNota = chamado.avaliacao?.nota || 0;
    this.avaliacaoResolvido = chamado.avaliacao?.resolvido ?? true;
    this.avaliacaoComentario = chamado.avaliacao?.comentario || '';
  }

  fecharDetalhes() {
    this.chamadoGestorSelecionado = null;
    this.chamadoColaboradorSelecionado = null;
  }

  enviarChamado() {
    this.novoChamado.solicitanteId = this.colaboradorAtualId;
    const solicitante = this.solicitanteFormulario();

    if (
      !solicitante ||
      !this.novoChamado.setorDestino ||
      !this.novoChamado.categoria ||
      !this.novoChamado.titulo ||
      !this.novoChamado.descricao
    ) {
      alert('Preencha setor, categoria, assunto e descrição.');
      return;
    }

    const data = this.dataHoraAtual();
    const colaborador = this.colaboradores.find(
      (item) => item.id === this.novoChamado.solicitanteId,
    );
    const novo: Chamado = {
      id: Date.now().toString(),
      numero: this.gerarNumeroChamado(),
      titulo: this.novoChamado.titulo,
      descricao: this.novoChamado.descricao,
      categoria: this.novoChamado.categoria,
      prioridade: this.novoChamado.prioridade,
      solicitanteId: this.novoChamado.solicitanteId,
      solicitante,
      setorSolicitante: colaborador?.departamento || this.novoChamado.setorSolicitante || '-',
      setorDestino: this.novoChamado.setorDestino,
      dataAbertura: data,
      ultimaAtualizacao: data,
      responsavel: '',
      sla: this.slaPorPrioridade(this.novoChamado.prioridade),
      situacao: 'Aberto',
      mensagens: [
        {
          autor: solicitante,
          perfil: 'Colaborador',
          texto: this.novoChamado.descricao,
          data,
          interna: false,
        },
      ],
      observacoesInternas: [],
      arquivos: this.novoChamado.arquivo ? [this.novoChamado.arquivo] : [],
    };

    this.chamados = [novo, ...this.chamados];
    this.colaboradorAtualId = novo.solicitanteId || this.colaboradorAtualId;
    this.salvarDados();
    this.novoChamado = this.criarChamadoVazio();
    this.novoChamado.solicitanteId = this.colaboradorAtualId;
    alert('Chamado enviado com sucesso.');
  }

  salvarAlteracoesChamado(chamado: Chamado) {
    chamado.ultimaAtualizacao = this.dataHoraAtual();
    chamado.sla = this.slaPorPrioridade(chamado.prioridade);
    this.salvarDados();
    alert('Chamado atualizado.');
  }

  responderChamado() {
    if (!this.chamadoGestorSelecionado || !this.respostaGestor.trim()) {
      return;
    }

    this.adicionarMensagem(this.chamadoGestorSelecionado, 'Gestor', this.respostaGestor, false);

    if (['Aberto', 'Em análise', 'Reaberto'].includes(this.chamadoGestorSelecionado.situacao)) {
      this.chamadoGestorSelecionado.situacao = 'Em andamento';
    }

    this.respostaGestor = '';
    this.salvarDados();
  }

  adicionarObservacaoInterna() {
    if (!this.chamadoGestorSelecionado || !this.comentarioInterno.trim()) {
      return;
    }

    const data = this.formatarDataHora(this.dataHoraAtual());
    this.chamadoGestorSelecionado.observacoesInternas.push(
      data + ' - ' + this.comentarioInterno.trim(),
    );
    this.chamadoGestorSelecionado.ultimaAtualizacao = this.dataHoraAtual();
    this.comentarioInterno = '';
    this.salvarDados();
  }

  solicitarInformacoes() {
    if (!this.chamadoGestorSelecionado) {
      return;
    }

    this.chamadoGestorSelecionado.situacao = 'Aguardando colaborador';

    if (this.respostaGestor.trim()) {
      this.adicionarMensagem(this.chamadoGestorSelecionado, 'Gestor', this.respostaGestor, false);
      this.respostaGestor = '';
    }

    this.salvarAlteracoesChamado(this.chamadoGestorSelecionado);
  }

  marcarResolvido() {
    if (!this.chamadoGestorSelecionado) {
      return;
    }

    this.chamadoGestorSelecionado.situacao = 'Resolvido';
    this.salvarAlteracoesChamado(this.chamadoGestorSelecionado);
  }

  reabrirChamado(chamado: Chamado | null) {
    if (!chamado) {
      return;
    }

    chamado.situacao = 'Reaberto';
    chamado.ultimaAtualizacao = this.dataHoraAtual();
    this.salvarDados();
  }

  cancelarChamado(chamado: Chamado | null) {
    if (!chamado) {
      return;
    }

    chamado.situacao = 'Cancelado';
    chamado.ultimaAtualizacao = this.dataHoraAtual();
    this.salvarDados();
  }

  responderComoColaborador() {
    if (!this.chamadoColaboradorSelecionado || !this.respostaColaborador.trim()) {
      return;
    }

    this.adicionarMensagem(
      this.chamadoColaboradorSelecionado,
      'Colaborador',
      this.respostaColaborador,
      false,
    );

    if (this.chamadoColaboradorSelecionado.situacao === 'Aguardando colaborador') {
      this.chamadoColaboradorSelecionado.situacao = 'Em andamento';
    }

    this.respostaColaborador = '';
    this.salvarDados();
  }

  avaliarAtendimento() {
    if (
      !this.chamadoColaboradorSelecionado ||
      this.chamadoColaboradorSelecionado.situacao !== 'Resolvido'
    ) {
      return;
    }

    this.chamadoColaboradorSelecionado.avaliacao = {
      nota: Number(this.avaliacaoNota || 0),
      resolvido: this.avaliacaoResolvido,
      comentario: this.avaliacaoComentario,
      data: this.dataHoraAtual(),
    };

    this.salvarDados();
    alert('Avaliação registrada.');
  }

  capturarArquivo(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0];

    this.novoChamado.arquivo = arquivo?.name || '';
  }

  anexarNoChamado(evento: Event, chamado: Chamado | null) {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0];

    if (!arquivo || !chamado) {
      return;
    }

    chamado.arquivos.push(arquivo.name);
    chamado.ultimaAtualizacao = this.dataHoraAtual();
    this.salvarDados();
  }

  salvarUsuario() {
    if (
      !this.usuarioEmCadastro.nome ||
      !this.usuarioEmCadastro.email ||
      !this.usuarioEmCadastro.login
    ) {
      alert('Preencha nome, e-mail e login.');
      return;
    }

    if (this.usuarioEmEdicao) {
      this.usuariosSistema = this.usuariosSistema.map((usuario) =>
        usuario.id === this.usuarioEmCadastro.id ? { ...this.usuarioEmCadastro } : usuario,
      );
    } else {
      this.usuariosSistema = [
        {
          ...this.usuarioEmCadastro,
          id: Date.now().toString(),
          senhaTemporaria: this.usuarioEmCadastro.senhaTemporaria || this.gerarSenhaTemporaria(),
        },
        ...this.usuariosSistema,
      ];
>>>>>>> Stashed changes
    }

    if (filtro === 'Resolvidos') {
      return this.chamados.filter((chamado) => chamado.situacao === 'Resolvido');
    }

    return this.chamados.filter((chamado) => chamado.situacao === 'Em andamento');
  }

  totalPorFiltro(filtro: FiltroChamado): number {
    return this.filtrarChamados(filtro).length;
  }

  iniciais(nome: string): string {
    return (nome || '-')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte.charAt(0))
      .join('')
      .toUpperCase();
  }

  formatarData(data: string): string {
    if (!data) {
      return '-';
    }

<<<<<<< Updated upstream
    const dataConvertida = new Date(data);

    if (Number.isNaN(dataConvertida.getTime())) {
      return data;
    }

    return dataConvertida.toLocaleDateString('pt-BR');
  }

  classePrioridade(prioridade: string): string {
    if (['Alta', 'Urgente', 'Crítica'].includes(prioridade)) {
      return 'erro';
    }

    if (prioridade === 'Média') {
      return 'alerta';
    }
=======
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(data));
  }

  private adicionarMensagem(
    chamado: Chamado,
    perfil: 'Gestor' | 'Colaborador',
    texto: string,
    interna: boolean,
  ) {
    const data = this.dataHoraAtual();

    chamado.mensagens.push({
      autor:
        perfil === 'Gestor' ? chamado.responsavel || 'Gestor responsável' : chamado.solicitante,
      perfil,
      texto: texto.trim(),
      data,
      interna,
    });
>>>>>>> Stashed changes

    return 'informativo';
  }

  classeSituacao(situacao: string): string {
    if (situacao === 'Resolvido') {
      return 'sucesso';
    }

    if (['Aberto', 'Reaberto'].includes(situacao)) {
      return 'alerta';
    }

    if (situacao === 'Cancelado') {
      return 'erro';
    }

    return 'informativo';
  }

  private carregarEmpresaSelecionada() {
    const empresaSalva = this.lerJson('empresaSelecionadaDashboard', null);

<<<<<<< Updated upstream
    if (!empresaSalva) {
      return;
    }

    this.empresaSelecionada = {
      ...this.empresaSelecionada,
      ...empresaSalva,
      logo: empresaSalva.logo || this.empresaSelecionada.logo,
    };
  }

  private carregarChamadosDaEmpresa() {
    const chamados = this.lerJson(this.chaveChamados(), []);

    this.chamados = Array.isArray(chamados)
      ? chamados.map((chamado) => this.normalizarChamado(chamado))
      : [];
=======
    if (empresaSalva) {
      this.empresaSelecionada = JSON.parse(empresaSalva);
    }
  }

  private carregarColaboradores() {
    const colaboradoresSalvos = localStorage.getItem(this.chaveColaboradores());
    const colaboradores = colaboradoresSalvos ? JSON.parse(colaboradoresSalvos) : [];

    this.colaboradores = colaboradores.map((colaborador: any) => ({
      id: colaborador.id,
      nome: colaborador.nome,
      departamento: colaborador.departamento || '-',
      cargo: colaborador.cargo || '-',
      situacao: colaborador.situacao || 'Ativo',
    }));
  }

  private carregarDados() {
    this.chamados = this.lerJson(this.chaveChamados(), []).map((chamado: any) =>
      this.normalizarChamado(chamado),
    );
    this.usuariosSistema = this.lerJson(this.chaveUsuarios(), []).map((usuario: any) =>
      this.normalizarUsuario(usuario),
    );
    this.salvarDados();
    this.salvarUsuarios();
  }

  private definirColaboradorAtual() {
    this.colaboradorAtualId = this.colaboradores[0]?.id || '';
    this.novoChamado.solicitanteId = this.colaboradorAtualId;
  }

  private salvarDados() {
    if (!this.estaNoNavegador()) {
      return;
    }

    localStorage.setItem(this.chaveChamados(), JSON.stringify(this.chamados));
  }

  private salvarUsuarios() {
    if (!this.estaNoNavegador()) {
      return;
    }

    localStorage.setItem(this.chaveUsuarios(), JSON.stringify(this.usuariosSistema));
  }

  private criarChamadoVazio() {
    return {
      solicitanteId: '',
      solicitanteNome: '',
      setorSolicitante: '',
      setorDestino: '',
      categoria: '',
      titulo: '',
      descricao: '',
      prioridade: 'Média' as PrioridadeChamado,
      arquivo: '',
    };
  }

  private criarUsuarioVazio(): UsuarioSistema {
    return {
      id: '',
      nome: '',
      email: '',
      login: '',
      senhaTemporaria: '',
      perfil: 'Colaborador',
      setor: '',
      cargo: '',
      situacao: 'Ativo',
      permissoes: '',
    };
>>>>>>> Stashed changes
  }

  private normalizarChamado(chamado: any): ChamadoEmpresa {
    return {
      id: chamado.id || chamado.numero || String(Date.now()),
      numero: chamado.numero || chamado.id || '-',
      titulo: chamado.titulo || chamado.assunto || 'Chamado sem assunto',
      categoria: chamado.categoria || chamado.setorDestino || '-',
      prioridade: chamado.prioridade || 'Média',
      solicitante: chamado.solicitante || chamado.solicitanteNome || '-',
      setorSolicitante: chamado.setorSolicitante || chamado.departamento || '-',
      dataAbertura: chamado.dataAbertura || chamado.data || '',
      situacao: chamado.situacao || chamado.status || 'Aberto',
<<<<<<< Updated upstream
      responsavel: chamado.responsavel || '',
      sla: chamado.sla || '-',
    };
  }

  private chaveChamados(): string {
    return 'chamados:' + this.empresaSelecionada.id;
=======
      mensagens: chamado.mensagens || [],
      observacoesInternas: chamado.observacoesInternas || [],
      arquivos: chamado.arquivos || [],
      avaliacao: chamado.avaliacao,
    };
  }

  private normalizarUsuario(usuario: any): UsuarioSistema {
    return {
      id: usuario.id || Date.now().toString(),
      nome: usuario.nome || '',
      email: usuario.email || '',
      login: usuario.login || '',
      senhaTemporaria: usuario.senhaTemporaria || '',
      perfil: usuario.perfil || 'Colaborador',
      setor: usuario.setor || '',
      cargo: usuario.cargo || '',
      situacao: usuario.situacao || 'Ativo',
      permissoes: usuario.permissoes || '',
    };
  }

  private solicitanteFormulario(): string {
    const colaborador = this.colaboradores.find(
      (item) => item.id === this.novoChamado.solicitanteId,
    );
    return colaborador?.nome || this.novoChamado.solicitanteNome.trim() || 'Colaborador logado';
  }

  private gerarNumeroChamado(): string {
    const ano = new Date().getFullYear();
    const proximoNumero = this.chamados.length + 1;

    return 'CH-' + ano + '-' + String(proximoNumero).padStart(4, '0');
  }

  private gerarSenhaTemporaria(): string {
    return 'TEMP-' + String(Date.now()).slice(-6);
  }

  private slaPorPrioridade(prioridade: PrioridadeChamado): string {
    const horasPorPrioridade: Record<PrioridadeChamado, number> = {
      Baixa: 72,
      Média: 48,
      Alta: 24,
      Urgente: 8,
      Crítica: 4,
    };

    return horasPorPrioridade[prioridade] + 'h';
  }

  private chamadoAberto(chamado: Chamado): boolean {
    return !['Resolvido', 'Cancelado'].includes(chamado.situacao);
>>>>>>> Stashed changes
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
}
