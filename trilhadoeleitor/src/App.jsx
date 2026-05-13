import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './Login';
import Cadastro from './Cadastro';
import EditarPerfil from './EditarPerfil';
import './App.css';
import ConteudistaLayout from './components/Layout/ConteudistaLayout';
import GerenciarTrilhas from './pages/conteudista/GerenciarTrilhas';
import NovaTrilha from './pages/conteudista/NovaTrilha';
import EditarTrilha from './pages/conteudista/EditarTrilha';
import { limparSessaoAuth, obterSessaoAuth, salvarSessaoAuth } from './services/authService';

function CadastroRoute() {
  const navigate = useNavigate();
  return <Cadastro onSwitch={() => navigate('/login')} />;
}

function LoginRoute() {
  const navigate = useNavigate();

  return (
    <Login
      onSwitch={() => navigate('/signup')}
      onLoginSuccess={(payload) => {
        salvarSessaoAuth(payload);
        const tipo = payload?.user?.tipo_usuario;
        if (tipo === 'conteudista') {
          navigate('/conteudista/trilhas');
          return;
        }
        navigate('/perfil/editar');
      }}
    />
  );
}

function EditarPerfilRoute() {
  const navigate = useNavigate();
  const sessao = obterSessaoAuth();
  const email = sessao?.user?.email || '';
  return (
    <EditarPerfil
      emailUsuario={email}
      onVoltar={() => {
        limparSessaoAuth();
        navigate('/login');
      }}
    />
  );
}

function RotaProtegida() {
  const sessao = obterSessaoAuth();
  if (!sessao?.token || !sessao?.user?.email) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function RotaConteudista() {
  const sessao = obterSessaoAuth();
  if (!sessao?.token || !sessao?.user?.email) {
    return <Navigate to="/login" replace />;
  }
  if (sessao.user.tipo_usuario !== 'conteudista') {
    return <Navigate to="/perfil/editar" replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="/signup" element={<CadastroRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route element={<RotaProtegida />}>
          <Route path="/perfil/editar" element={<EditarPerfilRoute />} />
        </Route>

        <Route element={<RotaConteudista />}>
          <Route path="/conteudista" element={<ConteudistaLayout />}>
            <Route path="trilhas" element={<GerenciarTrilhas />} />
            <Route path="trilhas/nova" element={<NovaTrilha />} />
            <Route path="trilhas/:id/editar" element={<EditarTrilha />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
