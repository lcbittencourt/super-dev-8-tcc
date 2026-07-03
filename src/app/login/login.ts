import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

type PerfilAcesso = 'gestor' | 'colaborador';

interface EmpresaSelecionada {
  id: string;
  nome: string;
  cidade: string;
  logo: string;
}

interface UsuarioSistema {
  id: string;
  nome: string;
  email: string;
  login: string;
  senhaTemporaria: string;
  perfil: 'Administrador' | 'Gestor' | 'Colaborador';
  setor: string;
  cargo: string;
  situacao: 'Ativo' | 'Inativo';
  permissoes: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit {
  perfil: PerfilAcesso = 'gestor';
  login = '';
  senha = '';
  mensagem = '';
  mostrarSenha = false;

  empresaSelecionada: EmpresaSelecionada = {
    id: 'tx001',
    nome: 'Têxtil Vale Norte',
    cidade: 'Blumenau, SC',
    logo: 'TV',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit() {
    const perfilRota = this.route.snapshot.paramMap.get('perfil');
    this.perfil = perfilRota === 'colaborador' ? 'colaborador' : 'gestor';

    if (!this.estaNoNavegador()) {
      return;
    }

    const empresaSalva = localStorage.getItem('empresaSelecionadaDashboard');

    if (empresaSalva) {
      this.empresaSelecionada = JSON.parse(empresaSalva);
    }
  }

  entrar() {
    this.mensagem = '';

    if (!this.login.trim() || !this.senha.trim()) {
      this.mensagem = 'Informe login e senha.';
      return;
    }

    const usuario = this.buscarUsuario();

    if (!usuario) {
      this.mensagem = 'Login, senha ou perfil inválido para esta empresa.';
      return;
    }

    if (usuario.situacao !== 'Ativo') {
      this.mensagem = 'Usuário inativo. Libere o acesso antes de continuar.';
      return;
    }

    localStorage.setItem('acessoGestorPulso', JSON.stringify({
      empresaId: this.empresaSelecionada.id,
      empresaNome: this.empresaSelecionada.nome,
      usuarioId: usuario.id,
      nome: usuario.nome,
      login: usuario.login,
      perfil: usuario.perfil,
      dataAcesso: new Date().toISOString(),
    }));

    this.router.navigate([this.perfil === 'gestor' ? '/gestor' : '/colaborador']);
  }

  tituloPerfil(): string {
    return this.perfil === 'gestor' ? 'Gestor' : 'Colaborador';
  }

  private buscarUsuario(): UsuarioSistema | null {
    if (!this.estaNoNavegador()) {
      return null;
    }

    const usuarios = this.lerJson('usuariosSistema:' + this.empresaSelecionada.id, []);
    const loginInformado = this.login.trim().toLowerCase();
    const senhaInformada = this.senha.trim();

    return usuarios.find((usuario: UsuarioSistema) => {
      const loginConfere = usuario.login.toLowerCase() === loginInformado;
      const senhaConfere = usuario.senhaTemporaria === senhaInformada;
      const perfilConfere = this.perfilPermitido(usuario);

      return loginConfere && senhaConfere && perfilConfere;
    }) || null;
  }

  private perfilPermitido(usuario: UsuarioSistema): boolean {
    if (this.perfil === 'gestor') {
      return usuario.perfil === 'Gestor' || usuario.perfil === 'Administrador';
    }

    return usuario.perfil === 'Colaborador';
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
