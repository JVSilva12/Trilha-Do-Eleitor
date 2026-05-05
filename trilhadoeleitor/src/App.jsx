import { useState } from 'react';
import Login from './Login';
import Cadastro from './Cadastro';
import './App.css';

export default function App() {
  const [mode, setMode] = useState('signup');
  return mode === 'signup'
    ? <Cadastro onSwitch={() => setMode('login')} />
    : <Login onSwitch={() => setMode('signup')} />;
}