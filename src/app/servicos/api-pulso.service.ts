import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface EmpresaApi {
  id: string;
  razaoSocial?: string;
  nome: string;
  nomeFantasia?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  cidade: string;
  setor?: string;
  responsavel?: string;
  email?: string;
  telefone?: string;
  plano: string;
  usuarios: number;
  modulos: number;
  situacao: string;
  logo: string;
}

export interface ModuloApi {
  id?: string;
  nome: string;
  descricao: string;
  ordem?: number;
  liberado: boolean;
}

export interface ColaboradorApi {
  id: string;
  empresaId?: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  departamento: string;
  nivel: string;
  admissao: string;
  salario: number;
  gestor: string;
  situacao: string;
  diasLicencaMedica: number;
  foto: string;
}

export interface DepartamentoApi {
  id: string;
  empresaId?: string;
  nome: string;
  codigo: string;
  responsavel: string;
  centroCusto: string;
  descricao: string;
  situacao: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiPulsoService {
  private readonly enderecoApi = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  listarEmpresas(): Observable<EmpresaApi[]> {
    return this.http.get<EmpresaApi[]>(this.enderecoApi + '/empresas');
  }

  obterEmpresa(id: string): Observable<EmpresaApi> {
    return this.http.get<EmpresaApi>(this.enderecoApi + '/empresas/' + id);
  }

  criarEmpresa(empresa: Partial<EmpresaApi>): Observable<EmpresaApi> {
    return this.http.post<EmpresaApi>(this.enderecoApi + '/empresas', empresa);
  }

  atualizarEmpresa(id: string, empresa: Partial<EmpresaApi>): Observable<EmpresaApi> {
    return this.http.put<EmpresaApi>(this.enderecoApi + '/empresas/' + id, empresa);
  }

  excluirEmpresa(id: string): Observable<void> {
    return this.http.delete<void>(this.enderecoApi + '/empresas/' + id);
  }

  listarModulosEmpresa(empresaId: string): Observable<ModuloApi[]> {
    return this.http.get<ModuloApi[]>(this.enderecoApi + '/empresas/' + empresaId + '/modulos');
  }

  salvarModulosEmpresa(empresaId: string, modulos: ModuloApi[]): Observable<ModuloApi[]> {
    return this.http.put<ModuloApi[]>(this.enderecoApi + '/empresas/' + empresaId + '/modulos', {
      modulos,
    });
  }

  listarColaboradores(empresaId: string): Observable<ColaboradorApi[]> {
    return this.http.get<ColaboradorApi[]>(
      this.enderecoApi + '/colaboradores?empresaId=' + encodeURIComponent(empresaId),
    );
  }

  criarColaborador(colaborador: Partial<ColaboradorApi>): Observable<ColaboradorApi> {
    return this.http.post<ColaboradorApi>(this.enderecoApi + '/colaboradores', colaborador);
  }

  atualizarColaborador(
    id: string,
    colaborador: Partial<ColaboradorApi>,
  ): Observable<ColaboradorApi> {
    return this.http.put<ColaboradorApi>(this.enderecoApi + '/colaboradores/' + id, colaborador);
  }

  excluirColaborador(id: string): Observable<void> {
    return this.http.delete<void>(this.enderecoApi + '/colaboradores/' + id);
  }

  listarDepartamentos(empresaId: string): Observable<DepartamentoApi[]> {
    return this.http.get<DepartamentoApi[]>(
      this.enderecoApi + '/departamentos?empresaId=' + encodeURIComponent(empresaId),
    );
  }

  criarDepartamento(departamento: Partial<DepartamentoApi>): Observable<DepartamentoApi> {
    return this.http.post<DepartamentoApi>(this.enderecoApi + '/departamentos', departamento);
  }

  atualizarDepartamento(
    id: string,
    departamento: Partial<DepartamentoApi>,
  ): Observable<DepartamentoApi> {
    return this.http.put<DepartamentoApi>(this.enderecoApi + '/departamentos/' + id, departamento);
  }

  excluirDepartamento(id: string): Observable<void> {
    return this.http.delete<void>(this.enderecoApi + '/departamentos/' + id);
  }

  obterDashboard(empresaId: string): Observable<any> {
    return this.http.get<any>(
      this.enderecoApi + '/dashboard?empresaId=' + encodeURIComponent(empresaId),
    );
  }

  listarUsuarios(empresaId: string): Observable<any[]> {
    return this.http.get<any[]>(
      this.enderecoApi + '/usuarios?empresaId=' + encodeURIComponent(empresaId),
    );
  }

  criarUsuario(usuario: any): Observable<any> {
    return this.http.post<any>(this.enderecoApi + '/usuarios', usuario);
  }

  atualizarUsuario(id: string, usuario: any): Observable<any> {
    return this.http.put<any>(this.enderecoApi + '/usuarios/' + id, usuario);
  }

  excluirUsuario(id: string): Observable<void> {
    return this.http.delete<void>(this.enderecoApi + '/usuarios/' + id);
  }

  listarRegistrosPonto(empresaId: string, data?: string): Observable<any[]> {
    const parametros = new URLSearchParams({ empresaId });

    if (data) {
      parametros.set('data', data);
    }

    return this.http.get<any[]>(this.enderecoApi + '/controle-ponto?' + parametros.toString());
  }

  salvarRegistroPonto(registro: any): Observable<any> {
    return this.http.post<any>(this.enderecoApi + '/controle-ponto', registro);
  }

  salvarRegistrosPonto(registros: any[]): Observable<any[]> {
    return this.http.put<any[]>(this.enderecoApi + '/controle-ponto', { registros });
  }

  excluirRegistroPonto(id: string): Observable<void> {
    return this.http.delete<void>(this.enderecoApi + '/controle-ponto/' + id);
  }

  listarFerias(empresaId: string): Observable<any[]> {
    return this.http.get<any[]>(
      this.enderecoApi + '/ferias?empresaId=' + encodeURIComponent(empresaId),
    );
  }

  criarFerias(solicitacao: any): Observable<any> {
    return this.http.post<any>(this.enderecoApi + '/ferias', solicitacao);
  }

  atualizarFerias(id: string, solicitacao: any): Observable<any> {
    return this.http.put<any>(this.enderecoApi + '/ferias/' + id, solicitacao);
  }

  excluirFerias(id: string): Observable<void> {
    return this.http.delete<void>(this.enderecoApi + '/ferias/' + id);
  }

  listarTreinamentos(empresaId: string): Observable<any> {
    return this.http.get<any>(
      this.enderecoApi + '/treinamentos?empresaId=' + encodeURIComponent(empresaId),
    );
  }

  criarCursoTreinamento(curso: any): Observable<any> {
    return this.http.post<any>(this.enderecoApi + '/treinamentos/cursos', curso);
  }

  atualizarCursoTreinamento(id: string, curso: any): Observable<any> {
    return this.http.put<any>(this.enderecoApi + '/treinamentos/cursos/' + id, curso);
  }

  excluirCursoTreinamento(id: string): Observable<void> {
    return this.http.delete<void>(this.enderecoApi + '/treinamentos/cursos/' + id);
  }

  criarAcompanhamentoTreinamento(acompanhamento: any): Observable<any> {
    return this.http.post<any>(
      this.enderecoApi + '/treinamentos/acompanhamentos',
      acompanhamento,
    );
  }

  atualizarAcompanhamentoTreinamento(id: string, acompanhamento: any): Observable<any> {
    return this.http.put<any>(
      this.enderecoApi + '/treinamentos/acompanhamentos/' + id,
      acompanhamento,
    );
  }

  excluirAcompanhamentoTreinamento(id: string): Observable<void> {
    return this.http.delete<void>(this.enderecoApi + '/treinamentos/acompanhamentos/' + id);
  }

  emitirCertificadoTreinamento(certificado: any): Observable<any> {
    return this.http.post<any>(this.enderecoApi + '/treinamentos/certificados', certificado);
  }

  enviarFeedbackTreinamento(feedback: any): Observable<any> {
    return this.http.post<any>(this.enderecoApi + '/treinamentos/feedbacks', feedback);
  }

  listarChamados(empresaId: string): Observable<any[]> {
    return this.http.get<any[]>(
      this.enderecoApi + '/chamados?empresaId=' + encodeURIComponent(empresaId),
    );
  }

  obterChamado(id: string): Observable<any> {
    return this.http.get<any>(this.enderecoApi + '/chamados/' + id);
  }

  criarChamado(chamado: any): Observable<any> {
    return this.http.post<any>(this.enderecoApi + '/chamados', chamado);
  }

  atualizarChamado(id: string, chamado: any): Observable<any> {
    return this.http.put<any>(this.enderecoApi + '/chamados/' + id, chamado);
  }

  excluirChamado(id: string): Observable<void> {
    return this.http.delete<void>(this.enderecoApi + '/chamados/' + id);
  }

  adicionarMensagemChamado(chamadoId: string, mensagem: any): Observable<any> {
    return this.http.post<any>(this.enderecoApi + '/chamados/' + chamadoId + '/mensagens', mensagem);
  }

  adicionarAnexoChamado(chamadoId: string, anexo: any): Observable<any> {
    return this.http.post<any>(this.enderecoApi + '/chamados/' + chamadoId + '/anexos', anexo);
  }

  listarFornecedores(empresaId: string): Observable<any> {
    return this.http.get<any>(
      this.enderecoApi + '/fornecedores?empresaId=' + encodeURIComponent(empresaId),
    );
  }

  criarFornecedor(fornecedor: any): Observable<any> {
    return this.http.post<any>(this.enderecoApi + '/fornecedores', fornecedor);
  }

  atualizarFornecedor(id: string, fornecedor: any): Observable<any> {
    return this.http.put<any>(this.enderecoApi + '/fornecedores/' + id, fornecedor);
  }

  excluirFornecedor(id: string): Observable<void> {
    return this.http.delete<void>(this.enderecoApi + '/fornecedores/' + id);
  }

  criarSolicitacaoFornecedor(solicitacao: any): Observable<any> {
    return this.http.post<any>(this.enderecoApi + '/fornecedores/solicitacoes', solicitacao);
  }

  atualizarSolicitacaoFornecedor(id: string, solicitacao: any): Observable<any> {
    return this.http.put<any>(
      this.enderecoApi + '/fornecedores/solicitacoes/' + id,
      solicitacao,
    );
  }

  excluirSolicitacaoFornecedor(id: string): Observable<void> {
    return this.http.delete<void>(this.enderecoApi + '/fornecedores/solicitacoes/' + id);
  }

  criarContratoFornecedor(contrato: any): Observable<any> {
    return this.http.post<any>(this.enderecoApi + '/fornecedores/contratos', contrato);
  }

  atualizarContratoFornecedor(id: string, contrato: any): Observable<any> {
    return this.http.put<any>(this.enderecoApi + '/fornecedores/contratos/' + id, contrato);
  }

  excluirContratoFornecedor(id: string): Observable<void> {
    return this.http.delete<void>(this.enderecoApi + '/fornecedores/contratos/' + id);
  }
}
