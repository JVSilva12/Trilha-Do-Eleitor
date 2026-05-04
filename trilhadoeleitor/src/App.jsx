import { useState } from 'react'
import './App.css'
import Login from './Login'
import Cadastro from './Cadastro'

function App() {
  const [verLogin, setVerLogin] = useState(true);

  return (
    <div className="App">
      <h1>Trilhado Eleitor</h1>
      
      {verLogin ? <Login /> : <Cadastro />}

      <button 
        onClick={() => setVerLogin(!verLogin)}
        style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
      >
        {verLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça Login"}
      </button>
    </div>
  )
}

export default App