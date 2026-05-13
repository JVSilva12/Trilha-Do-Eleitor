const AUTH_KEY = 'trilha_eleitor_auth';

export function salvarSessaoAuth(payload) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
}

export function obterSessaoAuth() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export function limparSessaoAuth() {
  localStorage.removeItem(AUTH_KEY);
}

export function usuarioAutenticado() {
  const sessao = obterSessaoAuth();
  return Boolean(sessao?.token && sessao?.user?.email);
}

export function usuarioEhConteudista() {
  const sessao = obterSessaoAuth();
  return sessao?.user?.tipo_usuario === 'conteudista';
}

export function emailUsuarioLogado() {
  const sessao = obterSessaoAuth();
  return sessao?.user?.email || '';
}
