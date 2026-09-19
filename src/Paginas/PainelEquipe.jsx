import { buscarPainelEquipe } from '../services/api'
import useConsulta from '../hooks/useConsulta'
import EstadoConsulta from '../components/EstadoConsulta'
async function carregar() {
  const dados = await buscarPainelEquipe()
  if (!dados?.metricas || !Array.isArray(dados.colaboradores)) throw new Error('Resposta do painel inválida.')
  return dados
}
const rotulos = { em_dia: 'Em dia', atrasado: 'Atrasado', concluido: 'Concluído' }
export default function PainelEquipe() {
  const consulta = useConsulta(carregar)
  if (!consulta.dados) return <EstadoConsulta consulta={consulta} />
  const { metricas: m, colaboradores, totalModulos } = consulta.dados
  return <div><div className="topline"><h1>Painel da equipe</h1><button className="btn btn-ghost" onClick={consulta.recarregar}>Atualizar</button></div>
    <p>Acompanhe o progresso de treinamento dos colaboradores.</p>
    <div className="metrics-grid">
      <div className="card metric-card"><h3>Colaboradores ativos</h3><div className="metric-value">{m.colaboradoresAtivos}</div><p>{m.novosColaboradoresMes} novos este mês</p></div>
      <div className="card metric-card"><h3>Conclusão média da trilha</h3><div className="metric-value">{m.conclusaoMediaPercentual}%</div><p>{m.variacaoConclusao14DiasPontosPercentuais} p.p. nas últimas 2 semanas</p></div>
      <div className="card metric-card"><h3>Treinamentos pendentes</h3><div className="metric-value">{m.treinamentosPendentes}</div><p>{m.pendentesVencendoEm7Dias} vencem em 7 dias</p></div>
    </div><h2>Colaboradores</h2><p>{totalModulos} módulos na trilha</p>
    {!colaboradores.length ? <p className="aviso">Nenhum colaborador encontrado.</p> : <div className="table-responsive"><table className="data-table"><thead><tr><th>Colaborador</th><th>Progresso</th><th>Módulo atual</th><th>Última atividade</th><th>Status</th></tr></thead><tbody>
      {colaboradores.map(c => <tr key={c.id}><td className="colab-info"><div>{c.nome}</div><span>{c.cargo}</span></td><td>{c.progressoPercentual}%<div className="bar"><span style={{ width: `${c.progressoPercentual}%` }} /></div></td><td>{c.moduloAtual?.titulo || (c.status === 'concluido' ? 'Trilha concluída' : 'Sem módulo atual')}</td><td>{c.ultimaAtividadeEm ? new Date(c.ultimaAtividadeEm).toLocaleString('pt-BR') : 'Sem atividade'}</td><td><span className={`pill ${c.status === 'atrasado' ? 'pill-locked' : 'pill-done'}`}>{rotulos[c.status] || c.status}</span></td></tr>)}
    </tbody></table></div>}
  </div>
}
