import { useState } from 'react'
import Login from './Paginas/Login'
import PainelEquipe from './Paginas/PainelEquipe'
import MeusModulos from './Paginas/MeusModulos'
import ModuloInterno from './Paginas/ModuloInterno'

function App() {
  const [logado, setLogado] = useState(false)
  const [paginaAtual, setPaginaAtual] = useState('modulos') // 'painel', 'modulos', 'aula'

  // Se o usuário não estiver logado, exibe apenas a tela de Login
  if (!logado) {
    return <Login onLogin={() => setLogado(true)} />
  }

  return (
    <div className="app">
      {/* MENU LATERAL (SIDEBAR) */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"></div>
          <div>
            <div className="brand-name">Treinamento Rego</div>
            <div className="brand-sub">Autoposto Rego & CIA</div>
          </div>
        </div>

        <nav className="nav">
          <button 
            className={`nav-link ${paginaAtual === 'painel' ? 'active' : ''}`}
            onClick={() => setPaginaAtual('painel')}
          >
            <span>Painel da equipe</span>
          </button>
          <button 
            className={`nav-link ${(paginaAtual === 'modulos' || paginaAtual === 'aula') ? 'active' : ''}`}
            onClick={() => setPaginaAtual('modulos')}
          >
            <span>Meus módulos</span>
          </button>
        </nav>

        <div className="sidebar-foot">
          <div className="avatar">MS</div>
          <div className="who">
            <div>Mateus Silva</div>
            <div className="role">Frentista</div>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO DINÂMICO PRINCIPAL */}
      <main className="main">
        {paginaAtual === 'painel' && <PainelEquipe />}
        {paginaAtual === 'modulos' && <MeusModulos onVerModulo={() => setPaginaAtual('aula')} />}
        {paginaAtual === 'aula' && <ModuloInterno onVoltar={() => setPaginaAtual('modulos')} />}
      </main>
    </div>
  )
}

export default App
