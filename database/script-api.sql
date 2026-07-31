
create extension if not exists pgcrypto;

create table if not exists empresas (
  id text primary key default gen_random_uuid()::text,
  razao_social varchar(180),
  nome varchar(180) not null,
  nome_fantasia varchar(180),
  cnpj varchar(20),
  inscricao_estadual varchar(40),
  cidade varchar(120),
  setor varchar(120),
  responsavel varchar(160),
  email varchar(160),
  telefone varchar(30),
  plano varchar(40) not null default 'Profissional',
  situacao varchar(40) not null default 'Trial',
  logo varchar(8),
  limite_modulos integer not null default 7,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index if not exists empresas_cnpj_unico
  on empresas (cnpj)
  where cnpj is not null and cnpj <> '';

create table if not exists modulos_sistema (
  id text primary key,
  nome varchar(80) not null unique,
  descricao text,
  ordem integer not null default 0,
  ativo boolean not null default true
);

create table if not exists empresa_modulos (
  empresa_id text not null references empresas(id) on delete cascade,
  modulo_id text not null references modulos_sistema(id) on delete cascade,
  liberado boolean not null default false,
  atualizado_em timestamptz not null default now(),
  primary key (empresa_id, modulo_id)
);

create table if not exists usuarios_sistema (
  id text primary key default gen_random_uuid()::text,
  empresa_id text not null references empresas(id) on delete cascade,
  nome_completo varchar(180) not null,
  email varchar(180),
  login varchar(80) not null,
  senha_temporaria text,
  perfil varchar(40) not null default 'Colaborador',
  setor varchar(120),
  cargo varchar(120),
  situacao varchar(30) not null default 'Ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, login)
);

create table if not exists departamentos (
  id text primary key default gen_random_uuid()::text,
  empresa_id text not null references empresas(id) on delete cascade,
  nome varchar(160) not null,
  codigo varchar(30),
  responsavel varchar(180),
  centro_custo varchar(80),
  descricao text,
  situacao varchar(30) not null default 'Ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists departamentos_empresa_idx on departamentos (empresa_id);

create table if not exists colaboradores (
  id text primary key default gen_random_uuid()::text,
  empresa_id text not null references empresas(id) on delete cascade,
  usuario_id text references usuarios_sistema(id) on delete set null,
  nome varchar(180) not null,
  email varchar(180),
  telefone varchar(30),
  cargo varchar(120),
  departamento varchar(120),
  nivel varchar(40) not null default 'Não se aplica',
  data_admissao date,
  salario numeric(12, 2) not null default 0,
  gestor_responsavel varchar(180),
  situacao varchar(40) not null default 'Ativo',
  dias_licenca_medica integer not null default 0,
  foto text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists colaboradores_empresa_idx on colaboradores (empresa_id);
create index if not exists colaboradores_situacao_idx on colaboradores (empresa_id, situacao);

create table if not exists registros_ponto (
  id text primary key default gen_random_uuid()::text,
  empresa_id text not null references empresas(id) on delete cascade,
  colaborador_id text not null references colaboradores(id) on delete cascade,
  data_registro date not null,
  entrada time,
  saida_almoco time,
  retorno time,
  saida time,
  situacao varchar(30) not null default 'Sem registro',
  observacoes text,
  ajustado_por varchar(180),
  ajustado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, colaborador_id, data_registro)
);

create index if not exists registros_ponto_empresa_data_idx
  on registros_ponto (empresa_id, data_registro);

create table if not exists solicitacoes_ferias (
  id text primary key default gen_random_uuid()::text,
  empresa_id text not null references empresas(id) on delete cascade,
  colaborador_id text not null references colaboradores(id) on delete cascade,
  departamento varchar(120),
  data_inicio date not null,
  data_fim date not null,
  quantidade_dias integer not null default 0,
  data_solicitacao date not null default current_date,
  situacao varchar(40) not null default 'Pendente',
  abono_pecuniario boolean not null default false,
  substituto varchar(180),
  contato varchar(120),
  observacao_colaborador text,
  parecer_gestor text,
  aprovador varchar(180),
  data_aprovacao date,
  saldo_disponivel integer not null default 30,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists ferias_empresa_situacao_idx
  on solicitacoes_ferias (empresa_id, situacao);

create table if not exists cursos_treinamento (
  id text primary key default gen_random_uuid()::text,
  empresa_id text not null references empresas(id) on delete cascade,
  nome varchar(180) not null,
  categoria varchar(120),
  descricao text,
  objetivo text,
  publico_alvo text,
  carga_horaria varchar(40),
  prazo_conclusao varchar(80),
  validade_certificado varchar(80),
  obrigatorio boolean not null default false,
  situacao varchar(30) not null default 'Ativo',
  instrutor varchar(160),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists cursos_empresa_idx on cursos_treinamento (empresa_id);

create table if not exists modulos_treinamento (
  id text primary key default gen_random_uuid()::text,
  curso_id text not null references cursos_treinamento(id) on delete cascade,
  titulo varchar(180) not null,
  formato varchar(60) not null default 'Vídeo',
  conteudo_texto text,
  arquivo_url text,
  link_externo text,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);

create table if not exists perguntas_treinamento (
  id text primary key default gen_random_uuid()::text,
  curso_id text not null references cursos_treinamento(id) on delete cascade,
  pergunta text not null,
  resposta_correta text,
  peso numeric(8, 2) not null default 0,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);

create table if not exists alternativas_treinamento (
  id text primary key default gen_random_uuid()::text,
  pergunta_id text not null references perguntas_treinamento(id) on delete cascade,
  alternativa text not null,
  correta boolean not null default false,
  ordem integer not null default 0
);

create table if not exists acompanhamentos_treinamento (
  id text primary key default gen_random_uuid()::text,
  empresa_id text not null references empresas(id) on delete cascade,
  colaborador_id text references colaboradores(id) on delete cascade,
  curso_id text references cursos_treinamento(id) on delete cascade,
  progresso integer not null default 0,
  nota numeric(8, 2) not null default 0,
  situacao varchar(40) not null default 'Pendente',
  data_inicio date,
  data_conclusao date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists acompanhamentos_empresa_idx
  on acompanhamentos_treinamento (empresa_id);

create table if not exists certificados_treinamento (
  id text primary key default gen_random_uuid()::text,
  empresa_id text not null references empresas(id) on delete cascade,
  colaborador_id text references colaboradores(id) on delete cascade,
  curso_id text references cursos_treinamento(id) on delete cascade,
  data_emissao date not null default current_date,
  data_validade date,
  arquivo_url text,
  situacao varchar(30) not null default 'Emitido',
  criado_em timestamptz not null default now()
);

create table if not exists feedbacks_treinamento (
  id text primary key default gen_random_uuid()::text,
  empresa_id text not null references empresas(id) on delete cascade,
  colaborador_id text references colaboradores(id) on delete set null,
  curso_id text references cursos_treinamento(id) on delete cascade,
  nota integer,
  conteudo_util boolean,
  comentario text,
  criado_em timestamptz not null default now()
);

create table if not exists chamados (
  id text primary key default gen_random_uuid()::text,
  empresa_id text not null references empresas(id) on delete cascade,
  numero varchar(40) not null,
  titulo varchar(180) not null,
  descricao text,
  categoria varchar(120),
  setor_solicitante varchar(120),
  setor_destino varchar(120),
  prioridade varchar(30) not null default 'Média',
  solicitante_id text references colaboradores(id) on delete set null,
  solicitante_nome varchar(180),
  responsavel varchar(180),
  sla varchar(60),
  data_abertura timestamptz not null default now(),
  ultima_atualizacao timestamptz not null default now(),
  situacao varchar(40) not null default 'Aberto',
  avaliacao_nota integer,
  avaliacao_resolvido boolean,
  avaliacao_comentario text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, numero)
);

create index if not exists chamados_empresa_situacao_idx
  on chamados (empresa_id, situacao);

create table if not exists mensagens_chamado (
  id text primary key default gen_random_uuid()::text,
  chamado_id text not null references chamados(id) on delete cascade,
  autor varchar(180) not null,
  perfil_autor varchar(40),
  mensagem text not null,
  interna boolean not null default false,
  criado_em timestamptz not null default now()
);

create table if not exists anexos_chamado (
  id text primary key default gen_random_uuid()::text,
  chamado_id text not null references chamados(id) on delete cascade,
  nome_arquivo varchar(220),
  tipo_arquivo varchar(120),
  tamanho_bytes integer,
  arquivo_url text,
  enviado_por varchar(180),
  criado_em timestamptz not null default now()
);

create table if not exists fornecedores (
  id text primary key default gen_random_uuid()::text,
  empresa_id text not null references empresas(id) on delete cascade,
  nome varchar(180) not null,
  razao_social varchar(180),
  categoria varchar(120),
  cnpj varchar(20),
  cidade varchar(120),
  telefone varchar(30),
  email varchar(180),
  representante varchar(180),
  status varchar(30) not null default 'Pendente',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index if not exists fornecedores_empresa_cnpj_unico
  on fornecedores (empresa_id, cnpj)
  where cnpj is not null and cnpj <> '';

create table if not exists solicitacoes_fornecedor (
  id text primary key default gen_random_uuid()::text,
  empresa_id text not null references empresas(id) on delete cascade,
  fornecedor_id text references fornecedores(id) on delete set null,
  data_solicitacao date not null default current_date,
  solicitante varchar(180),
  fornecedor varchar(180),
  categoria varchar(120),
  motivo text,
  status varchar(30) not null default 'Pendente',
  retorno text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists contratos_fornecedor (
  id text primary key default gen_random_uuid()::text,
  empresa_id text not null references empresas(id) on delete cascade,
  fornecedor_id text references fornecedores(id) on delete cascade,
  categoria varchar(120),
  data_inicio date,
  data_termino date,
  valor_mensal numeric(12, 2) not null default 0,
  status varchar(30) not null default 'Vigente',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists documentos_fornecedor (
  id text primary key default gen_random_uuid()::text,
  fornecedor_id text not null references fornecedores(id) on delete cascade,
  tipo_documento varchar(80) not null,
  nome_arquivo varchar(220),
  arquivo_url text,
  criado_em timestamptz not null default now()
);

create or replace function atualizar_campo_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'empresas',
    'usuarios_sistema',
    'departamentos',
    'colaboradores',
    'registros_ponto',
    'solicitacoes_ferias',
    'cursos_treinamento',
    'acompanhamentos_treinamento',
    'chamados',
    'fornecedores',
    'solicitacoes_fornecedor',
    'contratos_fornecedor'
  ]
  loop
    execute format('drop trigger if exists %I_atualizado_em on %I', tabela, tabela);
    execute format(
      'create trigger %I_atualizado_em before update on %I for each row execute function atualizar_campo_atualizado_em()',
      tabela,
      tabela
    );
  end loop;
end $$;

insert into modulos_sistema (id, nome, descricao, ordem, ativo) values
  ('dashboard', 'Dashboard', 'Painel geral com indicadores', 1, true),
  ('colaboradores', 'Colaboradores e departamentos', 'Cadastro de pessoas, áreas e responsáveis', 2, true),
  ('controle-ponto', 'Controle de ponto', 'Jornada, banco de horas e exceções', 3, true),
  ('ferias', 'Férias e afastamentos', 'Solicitações, aprovações e calendário', 4, true),
  ('treinamentos', 'Treinamentos', 'NRs, compliance e capacitações', 5, true),
  ('chamados', 'Chamados', 'TI, manutenção e atendimento interno', 6, true),
  ('comunicados', 'Comunicados', 'Mural e avisos corporativos', 7, true),
  ('eventos', 'Eventos', 'Confraternizações e datas importantes', 8, true),
  ('fornecedores', 'Fornecedores', 'Cadastro e contratos', 9, true),
  ('relatorios', 'Relatórios', 'Exportações e análises customizadas', 10, true)
on conflict (id) do update set
  nome = excluded.nome,
  descricao = excluded.descricao,
  ordem = excluded.ordem,
  ativo = excluded.ativo;

update modulos_sistema
set ativo = false
where id = 'departamentos';

insert into empresas (
  id,
  razao_social,
  nome,
  nome_fantasia,
  cidade,
  plano,
  situacao,
  logo,
  limite_modulos
) values (
  'tx001',
  'Têxtil Vale Norte',
  'Têxtil Vale Norte',
  'Têxtil Vale Norte',
  'Blumenau, SC',
  'Empresarial',
  'Ativa',
  'TV',
  10
)
on conflict (id) do nothing;

insert into empresa_modulos (empresa_id, modulo_id, liberado)
select 'tx001', id, true
from modulos_sistema
where ativo = true
on conflict (empresa_id, modulo_id) do nothing;
