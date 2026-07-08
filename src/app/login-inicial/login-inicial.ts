import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

type DestinoAcesso = '/admin' | '/gestor' | '/colaborador';

interface AcessoTeste {
  login: string;
  senha: string;
  perfil: string;
  destino: DestinoAcesso;
}

@Component({
  selector: 'app-login-inicial',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login-inicial.html',
  styleUrl: './login-inicial.css',
})
export class LoginInicialComponent {
  login = '';
  senha = '';
  mensagem = '';
  mostrarSenha = false;

  private acessosTeste: AcessoTeste[] = [
    {
      login: 'teste01',
      senha: 'teste01',
      perfil: 'Administrador',
      destino: '/admin',
    },
    {
      login: 'teste02',
      senha: 'teste02',
      perfil: 'Gestor',
      destino: '/gestor',
    },
    {
      login: 'teste03',
      senha: 'teste03',
      perfil: 'Colaborador',
      destino: '/colaborador',
    },
  ];

  constructor(private router: Router) {}

  entrar() {
    this.mensagem = '';

    const loginInformado = this.login.trim().toLowerCase();
    const senhaInformada = this.senha.trim();

    if (!loginInformado || !senhaInformada) {
      this.mensagem = 'Informe login e senha.';
      return;
    }

    const acesso = this.acessosTeste.find((item) => {
      return item.login === loginInformado && item.senha === senhaInformada;
    });

    if (!acesso) {
      this.mensagem = 'Login ou senha inválidos.';
      return;
    }

    this.registrarAcesso(acesso);
    this.router.navigate([acesso.destino]);
  }

  private registrarAcesso(acesso: AcessoTeste) {
    localStorage.setItem(
      'acessoInicialPulso',
      JSON.stringify({
        login: acesso.login,
        perfil: acesso.perfil,
        destino: acesso.destino,
        dataAcesso: new Date().toISOString(),
      }),
    );
  }
}
