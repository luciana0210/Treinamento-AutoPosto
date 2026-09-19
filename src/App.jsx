import { useEffect, useState } from 'react'
import Login from './Paginas/Login'
import PainelEquipe from './Paginas/PainelEquipe'
import MeusModulos from './Paginas/MeusModulos'
import ModuloInterno from './Paginas/ModuloInterno'
import { buscarUsuarioAtual, sair } from './services/api'

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [aviso, setAviso] = useState('')
  const [pagina, setPagina] = useState('modulos')
  const [moduloId, setModuloId] = useState(null)
  const [saindo, setSaindo] = useState(false)
  useEffect(() => {
    let atual = true
    const expirar = () => { setUsuario(null); setPagina('modulos'); setAviso('Entre para continuar.') }
    window.addEventListener('sessao-expirada', expirar)
    buscarUsuarioAtual().then(dados => {
      if (!dados?.usuario?.id || !dados.usuario.nome) throw new Error('Não foi possível recuperar os dados da sessão.')
      if (atual) { setUsuario(dados.usuario); setAviso('') }
    }).catch(e => { if (atual && e.status !== 401) setAviso(e.message) }).finally(() => { if (atual) setCarregando(false) })
    return () => { atual = false; window.removeEventListener('sessao-expirada', expirar) }
  }, [])
  async function encerrar() {
    setSaindo(true); setAviso('')
    try { await sair(); setUsuario(null); setPagina('modulos') }
    catch (e) { if (e.status !== 401) setAviso(e.message) }
    finally { setSaindo(false) }
  }
  if (carregando) return <div className="login-wrapper" role="status">Verificando sessão…</div>
  if (!usuario) return <Login aviso={aviso} onLogin={u => { setUsuario(u); setAviso(''); setPagina('modulos') }} />
  const iniciais = usuario.nome.split(/\s+/).slice(0, 2).map(n => n[0]).join('')
  return <div className="app"><aside className="sidebar">
    <div className="brand"><div className="brand-mark" /><div><div className="brand-name">Treinamento</div><div className="brand-sub">{usuario.empresa?.nome}</div></div></div>
    <nav className="nav">
      {usuario.perfil === 'gestor' && <button className={`nav-link ${pagina === 'painel' ? 'active' : ''}`} onClick={() => setPagina('painel')}>Painel da equipe</button>}
      <button className={`nav-link ${pagina !== 'painel' ? 'active' : ''}`} onClick={() => setPagina('modulos')}>Meus módulos</button>
      <button className="nav-link" disabled={saindo} onClick={encerrar}>{saindo ? 'Saindo…' : 'Sair'}</button>
    </nav>
    <div className="sidebar-foot"><div className="avatar">{iniciais}</div><div className="who"><div>{usuario.nome}</div><div className="role">{usuario.cargo}</div></div></div>
  </aside><main className="main">
    {aviso && <p className="aviso erro" role="alert">{aviso}</p>}
    {pagina === 'painel' && usuario.perfil === 'gestor' && <PainelEquipe />}
    {pagina === 'modulos' && <MeusModulos usuario={usuario} onVerModulo={id => { setModuloId(id); setPagina('aula') }} />}
    {pagina === 'aula' && <ModuloInterno key={moduloId} moduloId={moduloId} onVoltar={() => setPagina('modulos')} />}
  </main></div>
}
