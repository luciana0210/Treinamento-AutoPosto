import { buscarMeusModulos } from '../services/api'
import useConsulta from '../hooks/useConsulta'
import EstadoConsulta from '../components/EstadoConsulta'
const rotulos = { nao_iniciado: 'Não iniciado', em_andamento: 'Em andamento', concluido: 'Concluído', bloqueado: 'Bloqueado' }
async function carregar() {
  const dados = await buscarMeusModulos()
  if (!Array.isArray(dados?.modulos) || !dados.resumo || !Number.isFinite(dados.resumo.progressoPercentual)) throw new Error('Resposta da trilha inválida.')
  return dados
}
export default function MeusModulos({ usuario, onVerModulo }) {
  const consulta = useConsulta(carregar)
  if (!consulta.dados) return <EstadoConsulta consulta={consulta} />
  const { resumo, modulos } = consulta.dados
  return <div><div className="topline"><div className="resumo-trilha">
    <div className="ring" style={{ '--pct': resumo.progressoPercentual }}><div className="ring-inner"><strong>{resumo.progressoPercentual}%</strong><span>concluído</span></div></div>
    <div><p>{usuario.empresa?.nome}</p><h1>Olá, {usuario.nome}!</h1><p>{resumo.totalModulos} módulos na sua trilha{resumo.moduloAtualOrdem ? ` · Módulo atual: ${resumo.moduloAtualOrdem}` : ''}</p></div>
  </div><button className="btn btn-ghost" onClick={consulta.recarregar}>Atualizar</button></div>
  <h2>Trilha de integração</h2>
  {!modulos.length && <p className="aviso">Nenhum módulo atribuído a você.</p>}
  <div className="modules-list">{modulos.map(mod => <div key={mod.id} className="card module-item">
    <div className="module-details"><div className="module-meta">{mod.ordem} · {mod.duracaoMinutos} min · {mod.tipo}</div><h3>{mod.titulo}</h3>
      <span className={`pill ${mod.status === 'concluido' ? 'pill-done' : mod.status === 'em_andamento' ? 'pill-progress' : 'pill-locked'}`}>{rotulos[mod.status] || mod.status}</span></div>
    {mod.status !== 'bloqueado' && <button className="btn btn-primary" onClick={() => onVerModulo(mod.id)}>{mod.status === 'concluido' ? 'Revisar' : mod.status === 'em_andamento' ? 'Continuar' : 'Abrir'}</button>}
  </div>)}</div></div>
}
