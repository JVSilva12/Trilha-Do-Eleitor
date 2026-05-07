import { useState } from 'react';
import Login from './Login';
import Cadastro from './Cadastro';
import EditarPerfil from './EditarPerfil';
import './App.css';

export default function App() {
  const [mode, setMode] = useState('signup');
  const [userEmail, setUserEmail] = useState(''); 

  const navegarPara = (novoModo) => setMode(novoModo);

  if (mode === 'signup') {
    return <Cadastro onSwitch={() => navegarPara('login')} />;
  }

  if (mode === 'login') {
    return (
      <Login 
        onSwitch={() => navegarPara('signup')} 
        onLoginSuccess={(email) => {
          setUserEmail(email); 
          navegarPara('edit_profile');
        }} 
      />
    );
  }

  if (mode === 'edit_profile') {
    return <EditarPerfil emailUsuario={userEmail} onVoltar={() => navegarPara('login')} />;
  }

  return null;
}