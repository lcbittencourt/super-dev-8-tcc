const express = require('express');
const fs = require('node:fs');
const path = require('node:path');

const PORTA = Number(process.env.API_PORT || 3000);
const ORIGENS_PERMITIDAS = (process.env.APP_ORIGIN ||
  'http://localhost:4200,http://127.0.0.1:4200,http://localhost:4203,http://127.0.0.1:4203')
  .split(',')
  .map((origem) => origem.trim())
  .filter(Boolean);

carregarVariaveisAmbiente();

const app = express();
let conexaoSql;

app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  const origem = req.headers.origin;
  const origemLiberada = !origem || ORIGENS_PERMITIDAS.includes(origem);

  if (origemLiberada) {
    res.setHeader('Access-Control-Allow-Origin', origem || ORIGENS_PERMITIDAS[0]);
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

app.get('/api/status', (req, res) => {
  res.json({
    api: 'online',
    bancoConfigurado: Boolean(process.env.DATABASE_URL),
  });
});

app.get('/api/status-banco', async (req, res) => {
  try {
    const sql = await obterSql();
    const resultado = await sql`
      select
        current_database() as banco,
        current_user as usuario,
        now() as data_servidor
    `;

    res.json({
      conectado: true,
      banco: resultado[0].banco,
      usuario: resultado[0].usuario,
      dataServidor: resultado[0].data_servidor,
    });
  } catch (erro) {
    res.status(500).json({
      conectado: false,
      mensagem: 'Nao foi possivel conectar ao Neon.',
      detalhe: erro.message,
    });
  }
});

app.get('/api/empresas', async (req, res) => {
  try {
    const sql = await obterSql();
    const empresas = await sql`
      select
        e.*,
        coalesce(c.total, 0)::int as usuarios,
        coalesce(m.total, 0)::int as modulos
      from empresas e
      left join (
        select empresa_id, count(*) as total
        from colaboradores
        group by empresa_id
      ) c on c.empresa_id = e.id
      left join (
        select empresa_id, count(*) as total
        from empresa_modulos
        where liberado = true
        group by empresa_id
      ) m on m.empresa_id = e.id
      order by e.nome
    `;

    res.json(empresas.map(mapearEmpresaBanco));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.get('/api/empresas/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const empresa = await buscarEmpresaPorId(sql, req.params.id);

    if (!empresa) {
      res.status(404).json({ mensagem: 'Empresa nao encontrada.' });
      return;
    }

    res.json(empresa);
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.post('/api/empresas', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarEmpresaEntrada(req.body);

    if (!dados.nome) {
      res.status(400).json({ mensagem: 'Informe o nome da empresa.' });
      return;
    }

    await sql`
      insert into empresas (
        id,
        razao_social,
        nome,
        nome_fantasia,
        cnpj,
        inscricao_estadual,
        cidade,
        setor,
        responsavel,
        email,
        telefone,
        plano,
        situacao,
        logo,
        limite_modulos
      ) values (
        ${dados.id},
        ${dados.razaoSocial},
        ${dados.nome},
        ${dados.nomeFantasia},
        ${dados.cnpj},
        ${dados.inscricaoEstadual},
        ${dados.cidade},
        ${dados.setor},
        ${dados.responsavel},
        ${dados.email},
        ${dados.telefone},
        ${dados.plano},
        ${dados.situacao},
        ${dados.logo},
        ${dados.limiteModulos}
      )
    `;

    await garantirModulosEmpresa(sql, dados.id);

    const empresa = await buscarEmpresaPorId(sql, dados.id);
    res.status(201).json(empresa);
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.put('/api/empresas/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarEmpresaEntrada({ ...req.body, id: req.params.id });

    if (!dados.nome) {
      res.status(400).json({ mensagem: 'Informe o nome da empresa.' });
      return;
    }

    const atualizada = await sql`
      update empresas
      set
        razao_social = ${dados.razaoSocial},
        nome = ${dados.nome},
        nome_fantasia = ${dados.nomeFantasia},
        cnpj = ${dados.cnpj},
        inscricao_estadual = ${dados.inscricaoEstadual},
        cidade = ${dados.cidade},
        setor = ${dados.setor},
        responsavel = ${dados.responsavel},
        email = ${dados.email},
        telefone = ${dados.telefone},
        plano = ${dados.plano},
        situacao = ${dados.situacao},
        logo = ${dados.logo},
        limite_modulos = ${dados.limiteModulos}
      where id = ${req.params.id}
      returning id
    `;

    if (atualizada.length === 0) {
      res.status(404).json({ mensagem: 'Empresa nao encontrada.' });
      return;
    }

    await garantirModulosEmpresa(sql, req.params.id);

    const empresa = await buscarEmpresaPorId(sql, req.params.id);
    res.json(empresa);
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.delete('/api/empresas/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const excluida = await sql`
      delete from empresas
      where id = ${req.params.id}
      returning id
    `;

    if (excluida.length === 0) {
      res.status(404).json({ mensagem: 'Empresa nao encontrada.' });
      return;
    }

    res.status(204).end();
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.get('/api/empresas/:id/modulos', async (req, res) => {
  try {
    const sql = await obterSql();
    await garantirModulosEmpresa(sql, req.params.id);
    const modulos = await listarModulosEmpresa(sql, req.params.id);
    res.json(modulos);
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.put('/api/empresas/:id/modulos', async (req, res) => {
  try {
    const sql = await obterSql();
    const empresa = await buscarEmpresaPorId(sql, req.params.id);

    if (!empresa) {
      res.status(404).json({ mensagem: 'Empresa nao encontrada.' });
      return;
    }

    const modulos = Array.isArray(req.body?.modulos) ? req.body.modulos : [];
    const totalLiberados = modulos.filter((modulo) => modulo.liberado).length;
    const limite = limiteModulosPorPlano(empresa.plano);

    if (totalLiberados > limite) {
      res.status(400).json({
        mensagem: 'O plano ' + empresa.plano + ' permite liberar somente ' + limite + ' modulo(s).',
      });
      return;
    }

    for (const modulo of modulos) {
      await sql`
        insert into empresa_modulos (empresa_id, modulo_id, liberado)
        values (${req.params.id}, ${idModulo(modulo)}, ${Boolean(modulo.liberado)})
        on conflict (empresa_id, modulo_id)
        do update set liberado = excluded.liberado, atualizado_em = now()
      `;
    }

    const modulosAtualizados = await listarModulosEmpresa(sql, req.params.id);
    res.json(modulosAtualizados);
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.get('/api/colaboradores', async (req, res) => {
  try {
    const sql = await obterSql();
    const empresaId = req.query.empresaId;

    if (!empresaId) {
      res.status(400).json({ mensagem: 'Informe o empresaId.' });
      return;
    }

    const colaboradores = await sql`
      select *
      from colaboradores
      where empresa_id = ${empresaId}
      order by nome
    `;

    res.json(colaboradores.map(mapearColaboradorBanco));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.post('/api/colaboradores', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarColaboradorEntrada(req.body);

    if (!dados.empresaId || !dados.nome) {
      res.status(400).json({ mensagem: 'Informe empresa e nome do colaborador.' });
      return;
    }

    const colaborador = await sql`
      insert into colaboradores (
        id,
        empresa_id,
        nome,
        email,
        telefone,
        cargo,
        departamento,
        nivel,
        data_admissao,
        salario,
        gestor_responsavel,
        situacao,
        dias_licenca_medica,
        foto
      ) values (
        ${dados.id},
        ${dados.empresaId},
        ${dados.nome},
        ${dados.email},
        ${dados.telefone},
        ${dados.cargo},
        ${dados.departamento},
        ${dados.nivel},
        ${dados.admissao || null},
        ${dados.salario},
        ${dados.gestor},
        ${dados.situacao},
        ${dados.diasLicencaMedica},
        ${dados.foto}
      )
      returning *
    `;

    res.status(201).json(mapearColaboradorBanco(colaborador[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.put('/api/colaboradores/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarColaboradorEntrada({ ...req.body, id: req.params.id });

    const colaborador = await sql`
      update colaboradores
      set
        nome = ${dados.nome},
        email = ${dados.email},
        telefone = ${dados.telefone},
        cargo = ${dados.cargo},
        departamento = ${dados.departamento},
        nivel = ${dados.nivel},
        data_admissao = ${dados.admissao || null},
        salario = ${dados.salario},
        gestor_responsavel = ${dados.gestor},
        situacao = ${dados.situacao},
        dias_licenca_medica = ${dados.diasLicencaMedica},
        foto = ${dados.foto}
      where id = ${req.params.id}
      returning *
    `;

    if (colaborador.length === 0) {
      res.status(404).json({ mensagem: 'Colaborador nao encontrado.' });
      return;
    }

    res.json(mapearColaboradorBanco(colaborador[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.delete('/api/colaboradores/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const excluido = await sql`
      delete from colaboradores
      where id = ${req.params.id}
      returning id
    `;

    if (excluido.length === 0) {
      res.status(404).json({ mensagem: 'Colaborador nao encontrado.' });
      return;
    }

    res.status(204).end();
  } catch (erro) {
    responderErro(res, erro);
  }
});

// APIs dos demais modulos
app.get('/api/dashboard', async (req, res) => {
  try {
    const sql = await obterSql();
    const empresaId = textoLimpo(req.query.empresaId);

    if (!empresaId) {
      res.status(400).json({ mensagem: 'Informe o empresaId.' });
      return;
    }

    const hoje = new Date().toISOString().slice(0, 10);

    const colaboradores = await sql`
      select
        count(*)::int as total,
        count(*) filter (where situacao = 'Ativo')::int as ativos,
        count(*) filter (where situacao = 'Férias')::int as ferias,
        count(*) filter (where situacao = 'Licença Médica/Atestado')::int as licenca_medica
      from colaboradores
      where empresa_id = ${empresaId}
    `;

    const ponto = await sql`
      select count(*)::int as presentes
      from registros_ponto
      where empresa_id = ${empresaId}
        and data_registro = ${hoje}
        and situacao = 'Completo'
    `;

    const ferias = await sql`
      select count(*)::int as pendentes
      from solicitacoes_ferias
      where empresa_id = ${empresaId}
        and situacao = 'Pendente'
    `;

    const treinamentos = await sql`
      select
        count(*) filter (where situacao <> 'Concluído')::int as pendentes,
        count(*) filter (
          where situacao <> 'Concluído'
            and data_inicio is not null
            and data_inicio <= current_date + interval '30 days'
        )::int as vencendo
      from acompanhamentos_treinamento
      where empresa_id = ${empresaId}
    `;

    const chamados = await sql`
      select
        count(*) filter (
          where situacao in (
            'Aberto',
            'Em análise',
            'Em andamento',
            'Aguardando colaborador',
            'Aguardando terceiro',
            'Reaberto'
          )
        )::int as abertos,
        count(*) filter (where prioridade in ('Urgente', 'Crítica'))::int as urgentes
      from chamados
      where empresa_id = ${empresaId}
    `;

    const chamadosPorCategoria = await sql`
      select coalesce(categoria, 'Sem categoria') as categoria, count(*)::int as total
      from chamados
      where empresa_id = ${empresaId}
      group by coalesce(categoria, 'Sem categoria')
      order by total desc, categoria
    `;

    res.json({
      empresaId,
      colaboradores: Number(colaboradores[0]?.total || 0),
      colaboradoresAtivos: Number(colaboradores[0]?.ativos || 0),
      presentesHoje: Number(ponto[0]?.presentes || 0),
      ferias: Number(colaboradores[0]?.ferias || 0),
      licencaMedica: Number(colaboradores[0]?.licenca_medica || 0),
      aniversariantes: 0,
      feriasPendentes: Number(ferias[0]?.pendentes || 0),
      treinamentosPendentes: Number(treinamentos[0]?.pendentes || 0),
      treinamentosVencendo: Number(treinamentos[0]?.vencendo || 0),
      chamadosAbertos: Number(chamados[0]?.abertos || 0),
      chamadosUrgentes: Number(chamados[0]?.urgentes || 0),
      chamadosPorCategoria: chamadosPorCategoria.map((item) => ({
        categoria: item.categoria,
        total: Number(item.total || 0),
      })),
    });
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.get('/api/usuarios', async (req, res) => {
  try {
    const sql = await obterSql();
    const empresaId = textoLimpo(req.query.empresaId);

    if (!empresaId) {
      res.status(400).json({ mensagem: 'Informe o empresaId.' });
      return;
    }

    const usuarios = await sql`
      select *
      from usuarios_sistema
      where empresa_id = ${empresaId}
      order by nome_completo
    `;

    res.json(usuarios.map(mapearUsuarioBanco));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.post('/api/usuarios', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarUsuarioEntrada(req.body);

    if (!dados.empresaId || !dados.nomeCompleto || !dados.login) {
      res.status(400).json({ mensagem: 'Informe empresa, nome e login.' });
      return;
    }

    const usuario = await sql`
      insert into usuarios_sistema (
        id,
        empresa_id,
        nome_completo,
        email,
        login,
        senha_temporaria,
        perfil,
        setor,
        cargo,
        situacao
      ) values (
        ${dados.id},
        ${dados.empresaId},
        ${dados.nomeCompleto},
        ${dados.email},
        ${dados.login},
        ${dados.senhaTemporaria},
        ${dados.perfil},
        ${dados.setor},
        ${dados.cargo},
        ${dados.situacao}
      )
      returning *
    `;

    res.status(201).json(mapearUsuarioBanco(usuario[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarUsuarioEntrada({ ...req.body, id: req.params.id });

    const usuario = await sql`
      update usuarios_sistema
      set
        nome_completo = ${dados.nomeCompleto},
        email = ${dados.email},
        login = ${dados.login},
        senha_temporaria = ${dados.senhaTemporaria},
        perfil = ${dados.perfil},
        setor = ${dados.setor},
        cargo = ${dados.cargo},
        situacao = ${dados.situacao}
      where id = ${req.params.id}
      returning *
    `;

    if (usuario.length === 0) {
      res.status(404).json({ mensagem: 'Usuario nao encontrado.' });
      return;
    }

    res.json(mapearUsuarioBanco(usuario[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const usuario = await sql`
      delete from usuarios_sistema
      where id = ${req.params.id}
      returning id
    `;

    if (usuario.length === 0) {
      res.status(404).json({ mensagem: 'Usuario nao encontrado.' });
      return;
    }

    res.status(204).end();
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.get('/api/controle-ponto', async (req, res) => {
  try {
    const sql = await obterSql();
    const empresaId = textoLimpo(req.query.empresaId);
    const data = textoLimpo(req.query.data);

    if (!empresaId) {
      res.status(400).json({ mensagem: 'Informe o empresaId.' });
      return;
    }

    const registros = data
      ? await sql`
          select
            rp.*,
            c.nome as colaborador_nome,
            c.cargo as colaborador_cargo,
            c.departamento as colaborador_departamento
          from registros_ponto rp
          left join colaboradores c on c.id = rp.colaborador_id
          where rp.empresa_id = ${empresaId}
            and rp.data_registro = ${data}
          order by c.nome, rp.data_registro desc
        `
      : await sql`
          select
            rp.*,
            c.nome as colaborador_nome,
            c.cargo as colaborador_cargo,
            c.departamento as colaborador_departamento
          from registros_ponto rp
          left join colaboradores c on c.id = rp.colaborador_id
          where rp.empresa_id = ${empresaId}
          order by rp.data_registro desc, c.nome
        `;

    res.json(registros.map(mapearRegistroPontoBanco));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.post('/api/controle-ponto', async (req, res) => {
  try {
    const sql = await obterSql();
    const registro = await salvarRegistroPonto(sql, req.body);
    res.status(201).json(mapearRegistroPontoBanco(registro));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.put('/api/controle-ponto', async (req, res) => {
  try {
    const sql = await obterSql();
    const registros = Array.isArray(req.body?.registros) ? req.body.registros : [];
    const salvos = [];

    for (const registro of registros) {
      salvos.push(await salvarRegistroPonto(sql, registro));
    }

    res.json(salvos.map(mapearRegistroPontoBanco));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.delete('/api/controle-ponto/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const registro = await sql`
      delete from registros_ponto
      where id = ${req.params.id}
      returning id
    `;

    if (registro.length === 0) {
      res.status(404).json({ mensagem: 'Registro de ponto nao encontrado.' });
      return;
    }

    res.status(204).end();
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.get('/api/ferias', async (req, res) => {
  try {
    const sql = await obterSql();
    const empresaId = textoLimpo(req.query.empresaId);

    if (!empresaId) {
      res.status(400).json({ mensagem: 'Informe o empresaId.' });
      return;
    }

    const solicitacoes = await sql`
      select sf.*, c.nome as colaborador_nome
      from solicitacoes_ferias sf
      left join colaboradores c on c.id = sf.colaborador_id
      where sf.empresa_id = ${empresaId}
      order by sf.data_solicitacao desc, sf.data_inicio desc
    `;

    res.json(solicitacoes.map(mapearFeriasBanco));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.post('/api/ferias', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarFeriasEntrada(req.body);

    if (!dados.empresaId || !dados.colaboradorId || !dados.inicio || !dados.fim) {
      res.status(400).json({ mensagem: 'Informe empresa, colaborador, inicio e fim.' });
      return;
    }

    const solicitacao = await inserirFerias(sql, dados);
    res.status(201).json(mapearFeriasBanco(solicitacao));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.put('/api/ferias/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarFeriasEntrada({ ...req.body, id: req.params.id });

    const solicitacao = await sql`
      update solicitacoes_ferias
      set
        colaborador_id = ${dados.colaboradorId},
        departamento = ${dados.departamento},
        data_inicio = ${dados.inicio},
        data_fim = ${dados.fim},
        quantidade_dias = ${dados.dias},
        data_solicitacao = ${dados.dataSolicitacao},
        situacao = ${dados.situacao},
        abono_pecuniario = ${dados.abonoPecuniario},
        substituto = ${dados.substituto},
        contato = ${dados.contato},
        observacao_colaborador = ${dados.observacaoColaborador},
        parecer_gestor = ${dados.parecerGestor},
        aprovador = ${dados.aprovador},
        data_aprovacao = ${dados.dataAprovacao || null},
        saldo_disponivel = ${dados.saldoDisponivel}
      where id = ${req.params.id}
      returning *
    `;

    if (solicitacao.length === 0) {
      res.status(404).json({ mensagem: 'Solicitacao de ferias nao encontrada.' });
      return;
    }

    res.json(mapearFeriasBanco(solicitacao[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.delete('/api/ferias/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const solicitacao = await sql`
      delete from solicitacoes_ferias
      where id = ${req.params.id}
      returning id
    `;

    if (solicitacao.length === 0) {
      res.status(404).json({ mensagem: 'Solicitacao de ferias nao encontrada.' });
      return;
    }

    res.status(204).end();
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.get('/api/treinamentos', async (req, res) => {
  try {
    const sql = await obterSql();
    const empresaId = textoLimpo(req.query.empresaId);

    if (!empresaId) {
      res.status(400).json({ mensagem: 'Informe o empresaId.' });
      return;
    }

    const cursos = await listarCursosTreinamento(sql, empresaId);
    const acompanhamentos = await sql`
      select at.*, c.nome as colaborador_nome, c.departamento, ct.nome as curso_nome
      from acompanhamentos_treinamento at
      left join colaboradores c on c.id = at.colaborador_id
      left join cursos_treinamento ct on ct.id = at.curso_id
      where at.empresa_id = ${empresaId}
      order by at.criado_em desc
    `;
    const certificados = await sql`
      select ce.*, c.nome as colaborador_nome, ct.nome as curso_nome
      from certificados_treinamento ce
      left join colaboradores c on c.id = ce.colaborador_id
      left join cursos_treinamento ct on ct.id = ce.curso_id
      where ce.empresa_id = ${empresaId}
      order by ce.data_emissao desc
    `;
    const feedbacks = await sql`
      select ft.*, c.nome as colaborador_nome, ct.nome as curso_nome
      from feedbacks_treinamento ft
      left join colaboradores c on c.id = ft.colaborador_id
      left join cursos_treinamento ct on ct.id = ft.curso_id
      where ft.empresa_id = ${empresaId}
      order by ft.criado_em desc
    `;

    res.json({
      cursos,
      acompanhamentos: acompanhamentos.map(mapearAcompanhamentoTreinamentoBanco),
      certificados: certificados.map(mapearCertificadoTreinamentoBanco),
      feedbacks: feedbacks.map(mapearFeedbackTreinamentoBanco),
    });
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.post('/api/treinamentos/cursos', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarCursoEntrada(req.body);

    if (!dados.empresaId || !dados.nome) {
      res.status(400).json({ mensagem: 'Informe empresa e nome do curso.' });
      return;
    }

    const curso = await sql`
      insert into cursos_treinamento (
        id,
        empresa_id,
        nome,
        categoria,
        descricao,
        objetivo,
        publico_alvo,
        carga_horaria,
        prazo_conclusao,
        validade_certificado,
        obrigatorio,
        situacao,
        instrutor
      ) values (
        ${dados.id},
        ${dados.empresaId},
        ${dados.nome},
        ${dados.categoria},
        ${dados.descricao},
        ${dados.objetivo},
        ${dados.publicoAlvo},
        ${dados.cargaHoraria},
        ${dados.prazoConclusao},
        ${dados.validadeCertificado},
        ${dados.obrigatorio},
        ${dados.situacao},
        ${dados.instrutor}
      )
      returning *
    `;

    await salvarEstruturaCurso(sql, curso[0].id, dados);
    const cursos = await listarCursosTreinamento(sql, dados.empresaId);
    res.status(201).json(cursos.find((item) => item.id === curso[0].id));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.put('/api/treinamentos/cursos/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarCursoEntrada({ ...req.body, id: req.params.id });

    const curso = await sql`
      update cursos_treinamento
      set
        nome = ${dados.nome},
        categoria = ${dados.categoria},
        descricao = ${dados.descricao},
        objetivo = ${dados.objetivo},
        publico_alvo = ${dados.publicoAlvo},
        carga_horaria = ${dados.cargaHoraria},
        prazo_conclusao = ${dados.prazoConclusao},
        validade_certificado = ${dados.validadeCertificado},
        obrigatorio = ${dados.obrigatorio},
        situacao = ${dados.situacao},
        instrutor = ${dados.instrutor}
      where id = ${req.params.id}
      returning *
    `;

    if (curso.length === 0) {
      res.status(404).json({ mensagem: 'Curso nao encontrado.' });
      return;
    }

    await salvarEstruturaCurso(sql, req.params.id, dados);
    const cursos = await listarCursosTreinamento(sql, curso[0].empresa_id);
    res.json(cursos.find((item) => item.id === req.params.id));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.delete('/api/treinamentos/cursos/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const curso = await sql`
      delete from cursos_treinamento
      where id = ${req.params.id}
      returning id
    `;

    if (curso.length === 0) {
      res.status(404).json({ mensagem: 'Curso nao encontrado.' });
      return;
    }

    res.status(204).end();
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.post('/api/treinamentos/acompanhamentos', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarAcompanhamentoEntrada(req.body);

    const acompanhamento = await sql`
      insert into acompanhamentos_treinamento (
        id,
        empresa_id,
        colaborador_id,
        curso_id,
        progresso,
        nota,
        situacao,
        data_inicio,
        data_conclusao
      ) values (
        ${dados.id},
        ${dados.empresaId},
        ${dados.colaboradorId || null},
        ${dados.cursoId || null},
        ${dados.progresso},
        ${dados.nota},
        ${dados.situacao},
        ${dados.dataInicio || null},
        ${dados.dataConclusao || null}
      )
      returning *
    `;

    res.status(201).json(mapearAcompanhamentoTreinamentoBanco(acompanhamento[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.put('/api/treinamentos/acompanhamentos/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarAcompanhamentoEntrada({ ...req.body, id: req.params.id });

    const acompanhamento = await sql`
      update acompanhamentos_treinamento
      set
        colaborador_id = ${dados.colaboradorId || null},
        curso_id = ${dados.cursoId || null},
        progresso = ${dados.progresso},
        nota = ${dados.nota},
        situacao = ${dados.situacao},
        data_inicio = ${dados.dataInicio || null},
        data_conclusao = ${dados.dataConclusao || null}
      where id = ${req.params.id}
      returning *
    `;

    if (acompanhamento.length === 0) {
      res.status(404).json({ mensagem: 'Acompanhamento nao encontrado.' });
      return;
    }

    res.json(mapearAcompanhamentoTreinamentoBanco(acompanhamento[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.delete('/api/treinamentos/acompanhamentos/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const acompanhamento = await sql`
      delete from acompanhamentos_treinamento
      where id = ${req.params.id}
      returning id
    `;

    if (acompanhamento.length === 0) {
      res.status(404).json({ mensagem: 'Acompanhamento nao encontrado.' });
      return;
    }

    res.status(204).end();
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.post('/api/treinamentos/certificados', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = req.body || {};
    const certificado = await sql`
      insert into certificados_treinamento (
        id,
        empresa_id,
        colaborador_id,
        curso_id,
        data_emissao,
        data_validade,
        arquivo_url,
        situacao
      ) values (
        ${textoLimpo(dados.id) || Date.now().toString()},
        ${textoLimpo(dados.empresaId)},
        ${textoLimpo(dados.colaboradorId) || null},
        ${textoLimpo(dados.cursoId) || null},
        ${textoLimpo(dados.dataEmissao) || new Date().toISOString().slice(0, 10)},
        ${textoLimpo(dados.dataValidade) || null},
        ${textoLimpo(dados.arquivoUrl)},
        ${textoLimpo(dados.situacao) || 'Emitido'}
      )
      returning *
    `;

    res.status(201).json(mapearCertificadoTreinamentoBanco(certificado[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.post('/api/treinamentos/feedbacks', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = req.body || {};
    const feedback = await sql`
      insert into feedbacks_treinamento (
        id,
        empresa_id,
        colaborador_id,
        curso_id,
        nota,
        conteudo_util,
        comentario
      ) values (
        ${textoLimpo(dados.id) || Date.now().toString()},
        ${textoLimpo(dados.empresaId)},
        ${textoLimpo(dados.colaboradorId) || null},
        ${textoLimpo(dados.cursoId) || null},
        ${Number(dados.nota || 0)},
        ${Boolean(dados.conteudoUtil)},
        ${textoLimpo(dados.comentario)}
      )
      returning *
    `;

    res.status(201).json(mapearFeedbackTreinamentoBanco(feedback[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.get('/api/chamados', async (req, res) => {
  try {
    const sql = await obterSql();
    const empresaId = textoLimpo(req.query.empresaId);

    if (!empresaId) {
      res.status(400).json({ mensagem: 'Informe o empresaId.' });
      return;
    }

    const chamados = await sql`
      select *
      from chamados
      where empresa_id = ${empresaId}
      order by data_abertura desc
    `;

    res.json(chamados.map(mapearChamadoBanco));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.get('/api/chamados/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const chamados = await sql`
      select *
      from chamados
      where id = ${req.params.id}
      limit 1
    `;

    if (chamados.length === 0) {
      res.status(404).json({ mensagem: 'Chamado nao encontrado.' });
      return;
    }

    const mensagens = await sql`
      select *
      from mensagens_chamado
      where chamado_id = ${req.params.id}
      order by criado_em
    `;
    const anexos = await sql`
      select *
      from anexos_chamado
      where chamado_id = ${req.params.id}
      order by criado_em
    `;

    res.json({
      ...mapearChamadoBanco(chamados[0]),
      mensagens: mensagens.map(mapearMensagemChamadoBanco),
      anexos: anexos.map(mapearAnexoChamadoBanco),
    });
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.post('/api/chamados', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarChamadoEntrada(req.body);

    if (!dados.empresaId || !dados.titulo) {
      res.status(400).json({ mensagem: 'Informe empresa e titulo do chamado.' });
      return;
    }

    const chamado = await sql`
      insert into chamados (
        id,
        empresa_id,
        numero,
        titulo,
        descricao,
        categoria,
        setor_solicitante,
        setor_destino,
        prioridade,
        solicitante_id,
        solicitante_nome,
        responsavel,
        sla,
        data_abertura,
        ultima_atualizacao,
        situacao
      ) values (
        ${dados.id},
        ${dados.empresaId},
        ${dados.numero},
        ${dados.titulo},
        ${dados.descricao},
        ${dados.categoria},
        ${dados.setorSolicitante},
        ${dados.setorDestino},
        ${dados.prioridade},
        ${dados.solicitanteId || null},
        ${dados.solicitanteNome},
        ${dados.responsavel},
        ${dados.sla},
        ${dados.dataAbertura},
        now(),
        ${dados.situacao}
      )
      returning *
    `;

    res.status(201).json(mapearChamadoBanco(chamado[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.put('/api/chamados/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarChamadoEntrada({ ...req.body, id: req.params.id });

    const chamado = await sql`
      update chamados
      set
        titulo = ${dados.titulo},
        descricao = ${dados.descricao},
        categoria = ${dados.categoria},
        setor_solicitante = ${dados.setorSolicitante},
        setor_destino = ${dados.setorDestino},
        prioridade = ${dados.prioridade},
        solicitante_id = ${dados.solicitanteId || null},
        solicitante_nome = ${dados.solicitanteNome},
        responsavel = ${dados.responsavel},
        sla = ${dados.sla},
        ultima_atualizacao = now(),
        situacao = ${dados.situacao},
        avaliacao_nota = ${dados.avaliacaoNota || null},
        avaliacao_resolvido = ${dados.avaliacaoResolvido},
        avaliacao_comentario = ${dados.avaliacaoComentario}
      where id = ${req.params.id}
      returning *
    `;

    if (chamado.length === 0) {
      res.status(404).json({ mensagem: 'Chamado nao encontrado.' });
      return;
    }

    res.json(mapearChamadoBanco(chamado[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.delete('/api/chamados/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const chamado = await sql`
      delete from chamados
      where id = ${req.params.id}
      returning id
    `;

    if (chamado.length === 0) {
      res.status(404).json({ mensagem: 'Chamado nao encontrado.' });
      return;
    }

    res.status(204).end();
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.post('/api/chamados/:id/mensagens', async (req, res) => {
  try {
    const sql = await obterSql();
    const mensagem = await sql`
      insert into mensagens_chamado (
        id,
        chamado_id,
        autor,
        perfil_autor,
        mensagem,
        interna
      ) values (
        ${textoLimpo(req.body?.id) || Date.now().toString()},
        ${req.params.id},
        ${textoLimpo(req.body?.autor) || 'Sistema'},
        ${textoLimpo(req.body?.perfilAutor)},
        ${textoLimpo(req.body?.mensagem)},
        ${Boolean(req.body?.interna)}
      )
      returning *
    `;

    await sql`
      update chamados
      set ultima_atualizacao = now()
      where id = ${req.params.id}
    `;

    res.status(201).json(mapearMensagemChamadoBanco(mensagem[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.post('/api/chamados/:id/anexos', async (req, res) => {
  try {
    const sql = await obterSql();
    const anexo = await sql`
      insert into anexos_chamado (
        id,
        chamado_id,
        nome_arquivo,
        tipo_arquivo,
        tamanho_bytes,
        arquivo_url,
        enviado_por
      ) values (
        ${textoLimpo(req.body?.id) || Date.now().toString()},
        ${req.params.id},
        ${textoLimpo(req.body?.nomeArquivo)},
        ${textoLimpo(req.body?.tipoArquivo)},
        ${Number(req.body?.tamanhoBytes || 0)},
        ${textoLimpo(req.body?.arquivoUrl)},
        ${textoLimpo(req.body?.enviadoPor)}
      )
      returning *
    `;

    res.status(201).json(mapearAnexoChamadoBanco(anexo[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.get('/api/fornecedores', async (req, res) => {
  try {
    const sql = await obterSql();
    const empresaId = textoLimpo(req.query.empresaId);

    if (!empresaId) {
      res.status(400).json({ mensagem: 'Informe o empresaId.' });
      return;
    }

    const fornecedores = await sql`
      select *
      from fornecedores
      where empresa_id = ${empresaId}
      order by nome
    `;
    const solicitacoes = await sql`
      select *
      from solicitacoes_fornecedor
      where empresa_id = ${empresaId}
      order by data_solicitacao desc
    `;
    const contratos = await sql`
      select cf.*, f.nome as fornecedor_nome
      from contratos_fornecedor cf
      left join fornecedores f on f.id = cf.fornecedor_id
      where cf.empresa_id = ${empresaId}
      order by cf.data_termino desc nulls last
    `;

    res.json({
      fornecedores: fornecedores.map(mapearFornecedorBanco),
      solicitacoes: solicitacoes.map(mapearSolicitacaoFornecedorBanco),
      contratos: contratos.map(mapearContratoFornecedorBanco),
    });
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.post('/api/fornecedores/solicitacoes', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarSolicitacaoFornecedorEntrada(req.body);
    const solicitacao = await sql`
      insert into solicitacoes_fornecedor (
        id,
        empresa_id,
        fornecedor_id,
        data_solicitacao,
        solicitante,
        fornecedor,
        categoria,
        motivo,
        status,
        retorno
      ) values (
        ${dados.id},
        ${dados.empresaId},
        ${dados.fornecedorId || null},
        ${dados.data},
        ${dados.solicitante},
        ${dados.fornecedor},
        ${dados.categoria},
        ${dados.motivo},
        ${dados.status},
        ${dados.retorno}
      )
      returning *
    `;

    res.status(201).json(mapearSolicitacaoFornecedorBanco(solicitacao[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.put('/api/fornecedores/solicitacoes/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarSolicitacaoFornecedorEntrada({ ...req.body, id: req.params.id });
    const solicitacao = await sql`
      update solicitacoes_fornecedor
      set
        fornecedor_id = ${dados.fornecedorId || null},
        data_solicitacao = ${dados.data},
        solicitante = ${dados.solicitante},
        fornecedor = ${dados.fornecedor},
        categoria = ${dados.categoria},
        motivo = ${dados.motivo},
        status = ${dados.status},
        retorno = ${dados.retorno}
      where id = ${req.params.id}
      returning *
    `;

    if (solicitacao.length === 0) {
      res.status(404).json({ mensagem: 'Solicitacao de fornecedor nao encontrada.' });
      return;
    }

    res.json(mapearSolicitacaoFornecedorBanco(solicitacao[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.delete('/api/fornecedores/solicitacoes/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const solicitacao = await sql`
      delete from solicitacoes_fornecedor
      where id = ${req.params.id}
      returning id
    `;

    if (solicitacao.length === 0) {
      res.status(404).json({ mensagem: 'Solicitacao de fornecedor nao encontrada.' });
      return;
    }

    res.status(204).end();
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.post('/api/fornecedores/contratos', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarContratoFornecedorEntrada(req.body);
    const contrato = await sql`
      insert into contratos_fornecedor (
        id,
        empresa_id,
        fornecedor_id,
        categoria,
        data_inicio,
        data_termino,
        valor_mensal,
        status
      ) values (
        ${dados.id},
        ${dados.empresaId},
        ${dados.fornecedorId || null},
        ${dados.categoria},
        ${dados.inicio || null},
        ${dados.termino || null},
        ${dados.valorMensal},
        ${dados.status}
      )
      returning *
    `;

    res.status(201).json(mapearContratoFornecedorBanco(contrato[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.put('/api/fornecedores/contratos/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarContratoFornecedorEntrada({ ...req.body, id: req.params.id });
    const contrato = await sql`
      update contratos_fornecedor
      set
        fornecedor_id = ${dados.fornecedorId || null},
        categoria = ${dados.categoria},
        data_inicio = ${dados.inicio || null},
        data_termino = ${dados.termino || null},
        valor_mensal = ${dados.valorMensal},
        status = ${dados.status}
      where id = ${req.params.id}
      returning *
    `;

    if (contrato.length === 0) {
      res.status(404).json({ mensagem: 'Contrato nao encontrado.' });
      return;
    }

    res.json(mapearContratoFornecedorBanco(contrato[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.delete('/api/fornecedores/contratos/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const contrato = await sql`
      delete from contratos_fornecedor
      where id = ${req.params.id}
      returning id
    `;

    if (contrato.length === 0) {
      res.status(404).json({ mensagem: 'Contrato nao encontrado.' });
      return;
    }

    res.status(204).end();
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.post('/api/fornecedores', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarFornecedorEntrada(req.body);

    if (!dados.empresaId || !dados.nome) {
      res.status(400).json({ mensagem: 'Informe empresa e nome do fornecedor.' });
      return;
    }

    const fornecedor = await sql`
      insert into fornecedores (
        id,
        empresa_id,
        nome,
        razao_social,
        categoria,
        cnpj,
        cidade,
        telefone,
        email,
        representante,
        status
      ) values (
        ${dados.id},
        ${dados.empresaId},
        ${dados.nome},
        ${dados.razaoSocial},
        ${dados.categoria},
        ${dados.cnpj},
        ${dados.cidade},
        ${dados.telefone},
        ${dados.email},
        ${dados.representante},
        ${dados.status}
      )
      returning *
    `;

    res.status(201).json(mapearFornecedorBanco(fornecedor[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.put('/api/fornecedores/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const dados = normalizarFornecedorEntrada({ ...req.body, id: req.params.id });
    const fornecedor = await sql`
      update fornecedores
      set
        nome = ${dados.nome},
        razao_social = ${dados.razaoSocial},
        categoria = ${dados.categoria},
        cnpj = ${dados.cnpj},
        cidade = ${dados.cidade},
        telefone = ${dados.telefone},
        email = ${dados.email},
        representante = ${dados.representante},
        status = ${dados.status}
      where id = ${req.params.id}
      returning *
    `;

    if (fornecedor.length === 0) {
      res.status(404).json({ mensagem: 'Fornecedor nao encontrado.' });
      return;
    }

    res.json(mapearFornecedorBanco(fornecedor[0]));
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.delete('/api/fornecedores/:id', async (req, res) => {
  try {
    const sql = await obterSql();
    const fornecedor = await sql`
      delete from fornecedores
      where id = ${req.params.id}
      returning id
    `;

    if (fornecedor.length === 0) {
      res.status(404).json({ mensagem: 'Fornecedor nao encontrado.' });
      return;
    }

    res.status(204).end();
  } catch (erro) {
    responderErro(res, erro);
  }
});

app.listen(PORTA, () => {
  console.log('API Pulso rodando em http://localhost:' + PORTA);
});

async function obterSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL nao foi configurada no arquivo .env.');
  }

  if (!conexaoSql) {
    const { neon } = await import('@neondatabase/serverless');
    conexaoSql = neon(process.env.DATABASE_URL);
  }

  return conexaoSql;
}

async function buscarEmpresaPorId(sql, id) {
  const empresas = await sql`
    select
      e.*,
      coalesce(c.total, 0)::int as usuarios,
      coalesce(m.total, 0)::int as modulos
    from empresas e
    left join (
      select empresa_id, count(*) as total
      from colaboradores
      group by empresa_id
    ) c on c.empresa_id = e.id
    left join (
      select empresa_id, count(*) as total
      from empresa_modulos
      where liberado = true
      group by empresa_id
    ) m on m.empresa_id = e.id
    where e.id = ${id}
    limit 1
  `;

  return empresas[0] ? mapearEmpresaBanco(empresas[0]) : null;
}

async function garantirModulosEmpresa(sql, empresaId) {
  const empresa = await buscarEmpresaPorId(sql, empresaId);

  if (!empresa) {
    return;
  }

  await sql`
    insert into empresa_modulos (empresa_id, modulo_id, liberado)
    select ${empresaId}, id, ordem <= ${limiteModulosPorPlano(empresa.plano)}
    from modulos_sistema
    where ativo = true
    on conflict (empresa_id, modulo_id) do nothing
  `;
}

async function listarModulosEmpresa(sql, empresaId) {
  const modulos = await sql`
    select
      m.id,
      m.nome,
      m.descricao,
      m.ordem,
      coalesce(em.liberado, false) as liberado
    from modulos_sistema m
    left join empresa_modulos em
      on em.modulo_id = m.id
      and em.empresa_id = ${empresaId}
    where m.ativo = true
    order by m.ordem
  `;

  return modulos.map(mapearModuloBanco);
}

function normalizarEmpresaEntrada(entrada) {
  const nome = textoLimpo(entrada.nome || entrada.nomeFantasia || entrada.razaoSocial);
  const plano = textoLimpo(entrada.plano) || 'Profissional';

  return {
    id: textoLimpo(entrada.id) || Date.now().toString(),
    razaoSocial: textoLimpo(entrada.razaoSocial) || nome,
    nome,
    nomeFantasia: textoLimpo(entrada.nomeFantasia) || nome,
    cnpj: textoLimpo(entrada.cnpj),
    inscricaoEstadual: textoLimpo(entrada.inscricaoEstadual),
    cidade: textoLimpo(entrada.cidade),
    setor: textoLimpo(entrada.setor),
    responsavel: textoLimpo(entrada.responsavel),
    email: textoLimpo(entrada.email),
    telefone: textoLimpo(entrada.telefone),
    plano,
    situacao: textoLimpo(entrada.situacao) || 'Trial',
    logo: textoLimpo(entrada.logo) || gerarLogo(nome),
    limiteModulos: limiteModulosPorPlano(plano),
  };
}

function normalizarColaboradorEntrada(entrada) {
  return {
    id: textoLimpo(entrada.id) || Date.now().toString(),
    empresaId: textoLimpo(entrada.empresaId || entrada.empresa_id),
    nome: textoLimpo(entrada.nome),
    email: textoLimpo(entrada.email),
    telefone: textoLimpo(entrada.telefone),
    cargo: textoLimpo(entrada.cargo),
    departamento: textoLimpo(entrada.departamento),
    nivel: textoLimpo(entrada.nivel) || 'Não se aplica',
    admissao: textoLimpo(entrada.admissao || entrada.dataAdmissao),
    salario: Number(entrada.salario || 0),
    gestor: textoLimpo(entrada.gestor || entrada.gestorResponsavel),
    situacao: textoLimpo(entrada.situacao) || 'Ativo',
    diasLicencaMedica: Number(entrada.diasLicencaMedica || 0),
    foto: entrada.foto || '',
  };
}

function mapearEmpresaBanco(empresa) {
  return {
    id: empresa.id,
    razaoSocial: empresa.razao_social || '',
    nome: empresa.nome || '',
    nomeFantasia: empresa.nome_fantasia || empresa.nome || '',
    cnpj: empresa.cnpj || '',
    inscricaoEstadual: empresa.inscricao_estadual || '',
    cidade: empresa.cidade || '',
    setor: empresa.setor || '',
    responsavel: empresa.responsavel || '',
    email: empresa.email || '',
    telefone: empresa.telefone || '',
    plano: empresa.plano || 'Profissional',
    usuarios: Number(empresa.usuarios || 0),
    modulos: Number(empresa.modulos || 0),
    situacao: empresa.situacao || 'Trial',
    logo: empresa.logo || gerarLogo(empresa.nome || ''),
  };
}

function mapearModuloBanco(modulo) {
  return {
    id: modulo.id,
    nome: modulo.nome,
    descricao: modulo.descricao || '',
    ordem: Number(modulo.ordem || 0),
    liberado: Boolean(modulo.liberado),
  };
}

function mapearColaboradorBanco(colaborador) {
  return {
    id: colaborador.id,
    empresaId: colaborador.empresa_id,
    nome: colaborador.nome || '',
    email: colaborador.email || '',
    telefone: colaborador.telefone || '',
    cargo: colaborador.cargo || '',
    departamento: colaborador.departamento || '',
    nivel: colaborador.nivel || 'Não se aplica',
    admissao: formatarData(colaborador.data_admissao),
    salario: Number(colaborador.salario || 0),
    gestor: colaborador.gestor_responsavel || '',
    situacao: colaborador.situacao || 'Ativo',
    diasLicencaMedica: Number(colaborador.dias_licenca_medica || 0),
    foto: colaborador.foto || '',
  };
}

function idModulo(modulo) {
  const valor = removerAcentos(String(modulo.id || modulo.nome || '')).toLowerCase();
  const mapa = {
    dashboard: 'dashboard',
    colaboradores: 'colaboradores',
    'controle de ponto': 'controle-ponto',
    'controle-ponto': 'controle-ponto',
    'ferias e afastamentos': 'ferias',
    ferias: 'ferias',
    treinamentos: 'treinamentos',
    chamados: 'chamados',
    comunicados: 'comunicados',
    eventos: 'eventos',
    fornecedores: 'fornecedores',
    relatorios: 'relatorios',
  };

  return mapa[valor] || valor.replace(/\s+/g, '-');
}

function limiteModulosPorPlano(plano) {
  if (plano === 'Inicial') {
    return 4;
  }

  if (plano === 'Profissional') {
    return 7;
  }

  return 10;
}

function textoLimpo(valor) {
  if (valor === null || valor === undefined) {
    return '';
  }

  return String(valor).trim();
}

async function salvarRegistroPonto(sql, entrada) {
  const dados = normalizarRegistroPontoEntrada(entrada);

  if (!dados.empresaId || !dados.colaboradorId || !dados.data) {
    throw new Error('Informe empresa, colaborador e data do ponto.');
  }

  const registros = await sql`
    insert into registros_ponto (
      id,
      empresa_id,
      colaborador_id,
      data_registro,
      entrada,
      saida_almoco,
      retorno,
      saida,
      situacao,
      observacoes,
      ajustado_por,
      ajustado_em
    ) values (
      ${dados.id},
      ${dados.empresaId},
      ${dados.colaboradorId},
      ${dados.data},
      ${dados.entrada || null},
      ${dados.saidaAlmoco || null},
      ${dados.retorno || null},
      ${dados.saida || null},
      ${dados.situacao},
      ${dados.observacoes},
      ${dados.ajustadoPor},
      ${dados.ajustadoPor ? new Date().toISOString() : null}
    )
    on conflict (empresa_id, colaborador_id, data_registro)
    do update set
      entrada = excluded.entrada,
      saida_almoco = excluded.saida_almoco,
      retorno = excluded.retorno,
      saida = excluded.saida,
      situacao = excluded.situacao,
      observacoes = excluded.observacoes,
      ajustado_por = excluded.ajustado_por,
      ajustado_em = excluded.ajustado_em,
      atualizado_em = now()
    returning *
  `;

  return registros[0];
}

async function inserirFerias(sql, dados) {
  const solicitacao = await sql`
    insert into solicitacoes_ferias (
      id,
      empresa_id,
      colaborador_id,
      departamento,
      data_inicio,
      data_fim,
      quantidade_dias,
      data_solicitacao,
      situacao,
      abono_pecuniario,
      substituto,
      contato,
      observacao_colaborador,
      parecer_gestor,
      aprovador,
      data_aprovacao,
      saldo_disponivel
    ) values (
      ${dados.id},
      ${dados.empresaId},
      ${dados.colaboradorId},
      ${dados.departamento},
      ${dados.inicio},
      ${dados.fim},
      ${dados.dias},
      ${dados.dataSolicitacao},
      ${dados.situacao},
      ${dados.abonoPecuniario},
      ${dados.substituto},
      ${dados.contato},
      ${dados.observacaoColaborador},
      ${dados.parecerGestor},
      ${dados.aprovador},
      ${dados.dataAprovacao || null},
      ${dados.saldoDisponivel}
    )
    returning *
  `;

  return solicitacao[0];
}

async function listarCursosTreinamento(sql, empresaId) {
  const cursos = await sql`
    select *
    from cursos_treinamento
    where empresa_id = ${empresaId}
    order by nome
  `;
  const modulos = await sql`
    select mc.*
    from modulos_treinamento mc
    join cursos_treinamento ct on ct.id = mc.curso_id
    where ct.empresa_id = ${empresaId}
    order by mc.ordem, mc.titulo
  `;
  const perguntas = await sql`
    select pt.*
    from perguntas_treinamento pt
    join cursos_treinamento ct on ct.id = pt.curso_id
    where ct.empresa_id = ${empresaId}
    order by pt.ordem, pt.pergunta
  `;

  return cursos.map((curso) =>
    mapearCursoTreinamentoBanco(
      curso,
      modulos.filter((modulo) => modulo.curso_id === curso.id),
      perguntas.filter((pergunta) => pergunta.curso_id === curso.id),
    ),
  );
}

async function salvarEstruturaCurso(sql, cursoId, dados) {
  await sql`
    delete from modulos_treinamento
    where curso_id = ${cursoId}
  `;
  await sql`
    delete from perguntas_treinamento
    where curso_id = ${cursoId}
  `;

  const modulos = Array.isArray(dados.modulos) ? dados.modulos : [];
  const perguntas = Array.isArray(dados.perguntas) ? dados.perguntas : [];

  for (const [indice, modulo] of modulos.entries()) {
    await sql`
      insert into modulos_treinamento (
        id,
        curso_id,
        titulo,
        formato,
        conteudo_texto,
        arquivo_url,
        link_externo,
        ordem
      ) values (
        ${textoLimpo(modulo.id) || cursoId + '-modulo-' + indice},
        ${cursoId},
        ${textoLimpo(modulo.titulo) || 'Módulo ' + (indice + 1)},
        ${textoLimpo(modulo.formato) || 'Vídeo'},
        ${textoLimpo(modulo.conteudoTexto)},
        ${textoLimpo(modulo.arquivoUrl)},
        ${textoLimpo(modulo.linkExterno)},
        ${indice + 1}
      )
    `;
  }

  for (const [indice, pergunta] of perguntas.entries()) {
    await sql`
      insert into perguntas_treinamento (
        id,
        curso_id,
        pergunta,
        resposta_correta,
        peso,
        ordem
      ) values (
        ${textoLimpo(pergunta.id) || cursoId + '-pergunta-' + indice},
        ${cursoId},
        ${textoLimpo(pergunta.pergunta)},
        ${textoLimpo(pergunta.respostaCorreta)},
        ${Number(pergunta.peso || 0)},
        ${indice + 1}
      )
    `;
  }
}

function normalizarUsuarioEntrada(entrada) {
  return {
    id: textoLimpo(entrada.id) || Date.now().toString(),
    empresaId: textoLimpo(entrada.empresaId || entrada.empresa_id),
    nomeCompleto: textoLimpo(entrada.nomeCompleto || entrada.nome_completo || entrada.nome),
    email: textoLimpo(entrada.email),
    login: textoLimpo(entrada.login),
    senhaTemporaria: textoLimpo(entrada.senhaTemporaria || entrada.senha_temporaria),
    perfil: textoLimpo(entrada.perfil) || 'Colaborador',
    setor: textoLimpo(entrada.setor),
    cargo: textoLimpo(entrada.cargo),
    situacao: textoLimpo(entrada.situacao) || 'Ativo',
  };
}

function normalizarRegistroPontoEntrada(entrada) {
  return {
    id: textoLimpo(entrada.id) || Date.now().toString(),
    empresaId: textoLimpo(entrada.empresaId || entrada.empresa_id),
    colaboradorId: textoLimpo(entrada.colaboradorId || entrada.colaborador_id),
    data: textoLimpo(entrada.data || entrada.dataRegistro || entrada.data_registro),
    entrada: textoLimpo(entrada.entrada),
    saidaAlmoco: textoLimpo(entrada.saidaAlmoco || entrada.saida_almoco),
    retorno: textoLimpo(entrada.retorno),
    saida: textoLimpo(entrada.saida),
    situacao: textoLimpo(entrada.situacao) || 'Sem registro',
    observacoes: textoLimpo(entrada.observacoes),
    ajustadoPor: textoLimpo(entrada.ajustadoPor || entrada.ajustado_por),
  };
}

function normalizarFeriasEntrada(entrada) {
  return {
    id: textoLimpo(entrada.id) || Date.now().toString(),
    empresaId: textoLimpo(entrada.empresaId || entrada.empresa_id),
    colaboradorId: textoLimpo(entrada.colaboradorId || entrada.colaborador_id),
    departamento: textoLimpo(entrada.departamento),
    inicio: textoLimpo(entrada.inicio || entrada.dataInicio || entrada.data_inicio),
    fim: textoLimpo(entrada.fim || entrada.dataFim || entrada.data_fim),
    dias: Number(entrada.dias || entrada.quantidadeDias || entrada.quantidade_dias || 0),
    dataSolicitacao:
      textoLimpo(entrada.dataSolicitacao || entrada.data_solicitacao) ||
      new Date().toISOString().slice(0, 10),
    situacao: textoLimpo(entrada.situacao) || 'Pendente',
    abonoPecuniario: Boolean(entrada.abonoPecuniario || entrada.abono_pecuniario),
    substituto: textoLimpo(entrada.substituto),
    contato: textoLimpo(entrada.contato),
    observacaoColaborador: textoLimpo(
      entrada.observacaoColaborador || entrada.observacao_colaborador,
    ),
    parecerGestor: textoLimpo(entrada.parecerGestor || entrada.parecer_gestor),
    aprovador: textoLimpo(entrada.aprovador),
    dataAprovacao: textoLimpo(entrada.dataAprovacao || entrada.data_aprovacao),
    saldoDisponivel: Number(entrada.saldoDisponivel || entrada.saldo_disponivel || 30),
  };
}

function normalizarCursoEntrada(entrada) {
  return {
    id: textoLimpo(entrada.id) || Date.now().toString(),
    empresaId: textoLimpo(entrada.empresaId || entrada.empresa_id),
    nome: textoLimpo(entrada.nome),
    categoria: textoLimpo(entrada.categoria),
    descricao: textoLimpo(entrada.descricao),
    objetivo: textoLimpo(entrada.objetivo),
    publicoAlvo: textoLimpo(entrada.publicoAlvo || entrada.publico_alvo),
    cargaHoraria: textoLimpo(entrada.cargaHoraria || entrada.carga_horaria),
    prazoConclusao: textoLimpo(entrada.prazoConclusao || entrada.prazo_conclusao),
    validadeCertificado: textoLimpo(
      entrada.validadeCertificado || entrada.validade_certificado,
    ),
    obrigatorio: Boolean(entrada.obrigatorio),
    situacao: textoLimpo(entrada.situacao) || 'Ativo',
    instrutor: textoLimpo(entrada.instrutor),
    modulos: Array.isArray(entrada.modulos) ? entrada.modulos : [],
    perguntas: Array.isArray(entrada.perguntas) ? entrada.perguntas : [],
  };
}

function normalizarAcompanhamentoEntrada(entrada) {
  return {
    id: textoLimpo(entrada.id) || Date.now().toString(),
    empresaId: textoLimpo(entrada.empresaId || entrada.empresa_id),
    colaboradorId: textoLimpo(entrada.colaboradorId || entrada.colaborador_id),
    cursoId: textoLimpo(entrada.cursoId || entrada.curso_id),
    progresso: Number(entrada.progresso || 0),
    nota: Number(entrada.nota || 0),
    situacao: textoLimpo(entrada.situacao) || 'Pendente',
    dataInicio: textoLimpo(entrada.dataInicio || entrada.data_inicio),
    dataConclusao: textoLimpo(entrada.dataConclusao || entrada.data_conclusao),
  };
}

function normalizarChamadoEntrada(entrada) {
  return {
    id: textoLimpo(entrada.id) || Date.now().toString(),
    empresaId: textoLimpo(entrada.empresaId || entrada.empresa_id),
    numero: textoLimpo(entrada.numero) || Date.now().toString(),
    titulo: textoLimpo(entrada.titulo || entrada.assunto),
    descricao: textoLimpo(entrada.descricao),
    categoria: textoLimpo(entrada.categoria),
    setorSolicitante: textoLimpo(entrada.setorSolicitante || entrada.setor_solicitante),
    setorDestino: textoLimpo(entrada.setorDestino || entrada.setor_destino),
    prioridade: textoLimpo(entrada.prioridade) || 'Média',
    solicitanteId: textoLimpo(entrada.solicitanteId || entrada.solicitante_id),
    solicitanteNome: textoLimpo(
      entrada.solicitanteNome || entrada.solicitante_nome || entrada.solicitante,
    ),
    responsavel: textoLimpo(entrada.responsavel),
    sla: textoLimpo(entrada.sla),
    dataAbertura:
      textoLimpo(entrada.dataAbertura || entrada.data_abertura) || new Date().toISOString(),
    situacao: textoLimpo(entrada.situacao || entrada.status) || 'Aberto',
    avaliacaoNota: Number(entrada.avaliacaoNota || entrada.avaliacao_nota || 0),
    avaliacaoResolvido:
      entrada.avaliacaoResolvido === undefined && entrada.avaliacao_resolvido === undefined
        ? null
        : Boolean(entrada.avaliacaoResolvido || entrada.avaliacao_resolvido),
    avaliacaoComentario: textoLimpo(
      entrada.avaliacaoComentario || entrada.avaliacao_comentario,
    ),
  };
}

function normalizarFornecedorEntrada(entrada) {
  return {
    id: textoLimpo(entrada.id) || Date.now().toString(),
    empresaId: textoLimpo(entrada.empresaId || entrada.empresa_id),
    nome: textoLimpo(entrada.nome),
    razaoSocial: textoLimpo(entrada.razaoSocial || entrada.razao_social),
    categoria: textoLimpo(entrada.categoria),
    cnpj: textoLimpo(entrada.cnpj),
    cidade: textoLimpo(entrada.cidade),
    telefone: textoLimpo(entrada.telefone),
    email: textoLimpo(entrada.email),
    representante: textoLimpo(entrada.representante),
    status: textoLimpo(entrada.status) || 'Pendente',
  };
}

function normalizarSolicitacaoFornecedorEntrada(entrada) {
  return {
    id: textoLimpo(entrada.id) || Date.now().toString(),
    empresaId: textoLimpo(entrada.empresaId || entrada.empresa_id),
    fornecedorId: textoLimpo(entrada.fornecedorId || entrada.fornecedor_id),
    data: textoLimpo(entrada.data || entrada.dataSolicitacao) || new Date().toISOString().slice(0, 10),
    solicitante: textoLimpo(entrada.solicitante),
    fornecedor: textoLimpo(entrada.fornecedor),
    categoria: textoLimpo(entrada.categoria),
    motivo: textoLimpo(entrada.motivo),
    status: textoLimpo(entrada.status) || 'Pendente',
    retorno: textoLimpo(entrada.retorno),
  };
}

function normalizarContratoFornecedorEntrada(entrada) {
  return {
    id: textoLimpo(entrada.id) || Date.now().toString(),
    empresaId: textoLimpo(entrada.empresaId || entrada.empresa_id),
    fornecedorId: textoLimpo(entrada.fornecedorId || entrada.fornecedor_id),
    categoria: textoLimpo(entrada.categoria),
    inicio: textoLimpo(entrada.inicio || entrada.dataInicio),
    termino: textoLimpo(entrada.termino || entrada.dataTermino),
    valorMensal: Number(String(entrada.valorMensal || 0).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0,
    status: textoLimpo(entrada.status) || 'Vigente',
  };
}

function mapearUsuarioBanco(usuario) {
  return {
    id: usuario.id,
    empresaId: usuario.empresa_id,
    nomeCompleto: usuario.nome_completo || '',
    email: usuario.email || '',
    login: usuario.login || '',
    senhaTemporaria: usuario.senha_temporaria || '',
    perfil: usuario.perfil || 'Colaborador',
    setor: usuario.setor || '',
    cargo: usuario.cargo || '',
    situacao: usuario.situacao || 'Ativo',
  };
}

function mapearRegistroPontoBanco(registro) {
  return {
    id: registro.id,
    empresaId: registro.empresa_id,
    colaboradorId: registro.colaborador_id,
    nome: registro.colaborador_nome || registro.nome || '',
    cargo: registro.colaborador_cargo || '',
    departamento: registro.colaborador_departamento || '',
    data: formatarData(registro.data_registro),
    entrada: formatarHora(registro.entrada),
    saidaAlmoco: formatarHora(registro.saida_almoco),
    retorno: formatarHora(registro.retorno),
    saida: formatarHora(registro.saida),
    situacao: registro.situacao || 'Sem registro',
    observacoes: registro.observacoes || '',
    ajustadoPor: registro.ajustado_por || '',
    ajustadoEm: formatarDataHora(registro.ajustado_em),
  };
}

function mapearFeriasBanco(solicitacao) {
  return {
    id: solicitacao.id,
    empresaId: solicitacao.empresa_id,
    colaboradorId: solicitacao.colaborador_id,
    colaborador: solicitacao.colaborador_nome || solicitacao.colaborador || '',
    departamento: solicitacao.departamento || '',
    inicio: formatarData(solicitacao.data_inicio),
    fim: formatarData(solicitacao.data_fim),
    dias: Number(solicitacao.quantidade_dias || 0),
    dataSolicitacao: formatarData(solicitacao.data_solicitacao),
    situacao: solicitacao.situacao || 'Pendente',
    abonoPecuniario: Boolean(solicitacao.abono_pecuniario),
    substituto: solicitacao.substituto || '',
    contato: solicitacao.contato || '',
    observacaoColaborador: solicitacao.observacao_colaborador || '',
    parecerGestor: solicitacao.parecer_gestor || '',
    aprovador: solicitacao.aprovador || '',
    dataAprovacao: formatarData(solicitacao.data_aprovacao),
    saldoDisponivel: Number(solicitacao.saldo_disponivel || 30),
  };
}

function mapearCursoTreinamentoBanco(curso, modulos, perguntas) {
  return {
    id: curso.id,
    empresaId: curso.empresa_id,
    nome: curso.nome || '',
    categoria: curso.categoria || '',
    descricao: curso.descricao || '',
    objetivo: curso.objetivo || '',
    publicoAlvo: curso.publico_alvo || '',
    cargaHoraria: curso.carga_horaria || '',
    prazoConclusao: curso.prazo_conclusao || '',
    validadeCertificado: curso.validade_certificado || '',
    obrigatorio: Boolean(curso.obrigatorio),
    situacao: curso.situacao || 'Ativo',
    instrutor: curso.instrutor || '',
    modulos: modulos.map((modulo) => ({
      id: modulo.id,
      titulo: modulo.titulo || '',
      formato: modulo.formato || 'Vídeo',
      concluido: false,
      conteudoTexto: modulo.conteudo_texto || '',
      arquivoUrl: modulo.arquivo_url || '',
      linkExterno: modulo.link_externo || '',
    })),
    perguntas: perguntas.map((pergunta) => ({
      id: pergunta.id,
      pergunta: pergunta.pergunta || '',
      alternativas: '',
      respostaCorreta: pergunta.resposta_correta || '',
      peso: Number(pergunta.peso || 0),
    })),
  };
}

function mapearAcompanhamentoTreinamentoBanco(acompanhamento) {
  return {
    id: acompanhamento.id,
    empresaId: acompanhamento.empresa_id,
    colaboradorId: acompanhamento.colaborador_id || '',
    colaborador: acompanhamento.colaborador_nome || '',
    departamento: acompanhamento.departamento || '',
    cursoId: acompanhamento.curso_id || '',
    curso: acompanhamento.curso_nome || '',
    progresso: Number(acompanhamento.progresso || 0),
    nota: Number(acompanhamento.nota || 0),
    situacao: acompanhamento.situacao || 'Pendente',
    dataInicio: formatarData(acompanhamento.data_inicio),
    dataConclusao: formatarData(acompanhamento.data_conclusao),
  };
}

function mapearCertificadoTreinamentoBanco(certificado) {
  return {
    id: certificado.id,
    empresaId: certificado.empresa_id,
    colaboradorId: certificado.colaborador_id || '',
    colaborador: certificado.colaborador_nome || '',
    cursoId: certificado.curso_id || '',
    curso: certificado.curso_nome || '',
    dataEmissao: formatarData(certificado.data_emissao),
    dataValidade: formatarData(certificado.data_validade),
    arquivoUrl: certificado.arquivo_url || '',
    situacao: certificado.situacao || 'Emitido',
  };
}

function mapearFeedbackTreinamentoBanco(feedback) {
  return {
    id: feedback.id,
    empresaId: feedback.empresa_id,
    colaboradorId: feedback.colaborador_id || '',
    colaborador: feedback.colaborador_nome || '',
    cursoId: feedback.curso_id || '',
    curso: feedback.curso_nome || '',
    nota: Number(feedback.nota || 0),
    conteudoUtil: Boolean(feedback.conteudo_util),
    comentario: feedback.comentario || '',
  };
}

function mapearChamadoBanco(chamado) {
  return {
    id: chamado.id,
    empresaId: chamado.empresa_id,
    numero: chamado.numero || '',
    titulo: chamado.titulo || '',
    assunto: chamado.titulo || '',
    descricao: chamado.descricao || '',
    categoria: chamado.categoria || '',
    setorSolicitante: chamado.setor_solicitante || '',
    setorDestino: chamado.setor_destino || '',
    prioridade: chamado.prioridade || 'Média',
    solicitanteId: chamado.solicitante_id || '',
    solicitante: chamado.solicitante_nome || '',
    solicitanteNome: chamado.solicitante_nome || '',
    responsavel: chamado.responsavel || '',
    sla: chamado.sla || '',
    dataAbertura: formatarDataHora(chamado.data_abertura),
    data: formatarData(chamado.data_abertura),
    ultimaAtualizacao: formatarDataHora(chamado.ultima_atualizacao),
    situacao: chamado.situacao || 'Aberto',
    status: chamado.situacao || 'Aberto',
    avaliacaoNota: Number(chamado.avaliacao_nota || 0),
    avaliacaoResolvido: chamado.avaliacao_resolvido,
    avaliacaoComentario: chamado.avaliacao_comentario || '',
  };
}

function mapearMensagemChamadoBanco(mensagem) {
  return {
    id: mensagem.id,
    chamadoId: mensagem.chamado_id,
    autor: mensagem.autor || '',
    perfilAutor: mensagem.perfil_autor || '',
    mensagem: mensagem.mensagem || '',
    interna: Boolean(mensagem.interna),
    criadoEm: formatarDataHora(mensagem.criado_em),
  };
}

function mapearAnexoChamadoBanco(anexo) {
  return {
    id: anexo.id,
    chamadoId: anexo.chamado_id,
    nomeArquivo: anexo.nome_arquivo || '',
    tipoArquivo: anexo.tipo_arquivo || '',
    tamanhoBytes: Number(anexo.tamanho_bytes || 0),
    arquivoUrl: anexo.arquivo_url || '',
    enviadoPor: anexo.enviado_por || '',
    criadoEm: formatarDataHora(anexo.criado_em),
  };
}

function mapearFornecedorBanco(fornecedor) {
  return {
    id: fornecedor.id,
    empresaId: fornecedor.empresa_id,
    nome: fornecedor.nome || '',
    razaoSocial: fornecedor.razao_social || '',
    categoria: fornecedor.categoria || '',
    cnpj: fornecedor.cnpj || '',
    cidade: fornecedor.cidade || '',
    telefone: fornecedor.telefone || '',
    email: fornecedor.email || '',
    representante: fornecedor.representante || '',
    status: fornecedor.status || 'Pendente',
  };
}

function mapearSolicitacaoFornecedorBanco(solicitacao) {
  return {
    id: solicitacao.id,
    empresaId: solicitacao.empresa_id,
    fornecedorId: solicitacao.fornecedor_id || '',
    data: formatarData(solicitacao.data_solicitacao),
    solicitante: solicitacao.solicitante || '',
    fornecedor: solicitacao.fornecedor || '',
    categoria: solicitacao.categoria || '',
    motivo: solicitacao.motivo || '',
    status: solicitacao.status || 'Pendente',
    retorno: solicitacao.retorno || '',
  };
}

function mapearContratoFornecedorBanco(contrato) {
  return {
    id: contrato.id,
    empresaId: contrato.empresa_id,
    fornecedorId: contrato.fornecedor_id || '',
    fornecedor: contrato.fornecedor_nome || contrato.fornecedor || '',
    categoria: contrato.categoria || '',
    inicio: formatarData(contrato.data_inicio),
    termino: formatarData(contrato.data_termino),
    valorMensal: Number(contrato.valor_mensal || 0),
    status: contrato.status || 'Vigente',
  };
}

function formatarHora(valor) {
  if (!valor) {
    return '';
  }

  return String(valor).slice(0, 5);
}

function formatarDataHora(valor) {
  if (!valor) {
    return '';
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return String(valor);
  }

  return data.toISOString();
}

function gerarLogo(nome) {
  const partes = textoLimpo(nome).split(' ').filter(Boolean).slice(0, 2);

  if (partes.length === 0) {
    return 'NE';
  }

  return partes.map((parte) => parte[0]).join('').toUpperCase();
}

function formatarData(valor) {
  if (!valor) {
    return '';
  }

  return String(valor).slice(0, 10);
}

function removerAcentos(valor) {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function responderErro(res, erro) {
  console.error(erro);
  res.status(500).json({
    mensagem: 'Erro interno na API.',
    detalhe: erro.message,
  });
}

function carregarVariaveisAmbiente() {
  const caminhoEnv = path.resolve(__dirname, '../../.env');

  if (!fs.existsSync(caminhoEnv)) {
    return;
  }

  const linhas = fs.readFileSync(caminhoEnv, 'utf8').split(/\r?\n/);

  for (const linha of linhas) {
    const conteudo = linha.trim();

    if (!conteudo || conteudo.startsWith('#')) {
      continue;
    }

    const posicaoIgual = conteudo.indexOf('=');

    if (posicaoIgual === -1) {
      continue;
    }

    const chave = conteudo.slice(0, posicaoIgual).trim();
    let valor = conteudo.slice(posicaoIgual + 1).trim();

    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }

    if (!process.env[chave]) {
      process.env[chave] = valor;
    }
  }
}