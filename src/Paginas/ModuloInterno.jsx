import { useCallback, useState } from 'react'
import { buscarModulo, enviarRespostas, salvarChecklist, solicitarAjudaGestor } from '../services/api'
import useConsulta from '../hooks/useConsulta'
import EstadoConsulta from '../components/EstadoConsulta'

export default function ModuloInterno({ moduloId, onVoltar }) {
  const carregar = useCallback(async () => {
    const dados = await buscarModulo(moduloId)
    if (!dados?.id || !Array.isArray(dados.perguntas) || !Array.isArray(dados.checklist)) throw new Error('Resposta do módulo inválida.')
    return dados
  }, [moduloId])
  const consulta = useConsulta(carregar)
  return <div><button className="btn btn-ghost" onClick={onVoltar}>← Voltar para meus módulos</button>
    {!consulta.dados ? <EstadoConsulta consulta={consulta} /> : <Conteudo modulo={consulta.dados} />}
  </div>
}

function Conteudo({ modulo }) {
  const [respostas, setRespostas] = useState({})
  const [itens, setItens] = useState(modulo.checklist.map(i => ({ itemId: i.itemId, concluido: i.concluido })))
  const [status, setStatus] = useState(modulo.status)
  const [mensagem, setMensagem] = useState('')
  const [ocupado, setOcupado] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [videoErro, setVideoErro] = useState(false)
  async function executar(tipo, acao) {
    if (ocupado) return
    setOcupado(tipo); setErro(''); setSucesso('')
    try { await acao() } catch (e) { setErro(e.message) } finally { setOcupado('') }
  }
  function enviarQuiz(e) {
    e.preventDefault()
    executar('quiz', async () => {
      const dados = await enviarRespostas(modulo.id, modulo.perguntas.map(p => ({ perguntaId: p.id, alternativaId: respostas[p.id] })))
      if (!dados?.tentativaId || typeof dados.aprovado !== 'boolean' || !Number.isFinite(dados.nota)) throw new Error('O servidor não retornou o resultado da avaliação.')
      setStatus(dados.statusModulo)
      setSucesso(`Respostas registradas. Nota: ${dados.nota}. ${dados.aprovado ? 'Aprovado.' : 'Aprovação não atingida.'}`)
    })
  }
  function enviarChecklist(e) {
    e.preventDefault()
    executar('checklist', async () => {
      const dados = await salvarChecklist(modulo.id, itens)
      if (!Array.isArray(dados?.itens)) throw new Error('O servidor não confirmou o checklist.')
      setItens(dados.itens); setStatus(dados.statusModulo); setSucesso('Checklist salvo.')
    })
  }
  function enviarAjuda(e) {
    e.preventDefault()
    executar('ajuda', async () => {
      if (!mensagem.trim()) throw new Error('Descreva sua dúvida.')
      const dados = await solicitarAjudaGestor(modulo.id, mensagem.trim())
      if (!dados?.solicitacaoId) throw new Error('O servidor não confirmou a solicitação.')
      setMensagem(''); setSucesso(`Solicitação registrada: ${dados.solicitacaoId}.`)
    })
  }
  return <><div className="topline"><div><p>Módulo {modulo.ordem} de {modulo.totalModulos}</p><h1>{modulo.titulo}</h1><p>{modulo.duracaoMinutos} min · {modulo.tipo}</p><p>Status: {({ em_andamento: 'Em andamento', concluido: 'Concluído', nao_iniciado: 'Não iniciado', bloqueado: 'Bloqueado' })[status] || status}</p></div></div>
    {erro && <p className="aviso erro" role="alert">{erro}</p>}{sucesso && <p className="aviso sucesso" role="status">{sucesso}</p>}
    <div className="module-grid"><div>
      {modulo.video?.url ? <><h2>{modulo.video.titulo}</h2><video className="video-player" controls preload="metadata" src={modulo.video.url} onError={() => setVideoErro(true)}>Seu navegador não suporta vídeo.</video>{videoErro && <p className="aviso erro" role="alert">Não foi possível carregar o vídeo.</p>}</> : <p className="aviso">Este módulo não possui vídeo disponível.</p>}
      <form className="card quiz-box" onSubmit={enviarQuiz}><h2>Questionário de fixação</h2><fieldset disabled={Boolean(ocupado) || status === 'bloqueado'}>
        {modulo.perguntas.map((p, n) => <fieldset className="pergunta" key={p.id}><legend>{n + 1}. {p.texto}</legend><div className="radio-group">{p.alternativas.map(a => <label key={a.id}><input type="radio" name={`pergunta-${p.id}`} value={a.id} required checked={respostas[p.id] === a.id} onChange={() => setRespostas({ ...respostas, [p.id]: a.id })} /> {a.texto}</label>)}</div></fieldset>)}
        {modulo.perguntas.length ? <button className="btn btn-primary" type="submit">{ocupado === 'quiz' ? 'Enviando…' : 'Enviar respostas'}</button> : <p>Este módulo não possui questionário.</p>}
      </fieldset></form>
    </div><div>
      <form className="card checklist-box" onSubmit={enviarChecklist}><h2>Checklist da prática</h2><fieldset disabled={Boolean(ocupado) || status === 'bloqueado'}>
        {modulo.checklist.map(item => <label className="checklist-item" key={item.itemId}><input type="checkbox" checked={itens.find(i => i.itemId === item.itemId)?.concluido ?? false} onChange={e => setItens(itens.map(i => i.itemId === item.itemId ? { ...i, concluido: e.target.checked } : i))} />{item.texto}</label>)}
        {itens.length ? <button className="btn btn-primary" type="submit">{ocupado === 'checklist' ? 'Salvando…' : 'Salvar checklist'}</button> : <p>Este módulo não possui checklist.</p>}
      </fieldset></form>
      <form className="card checklist-box" onSubmit={enviarAjuda}><h2>Falar com o gestor</h2><fieldset disabled={Boolean(ocupado)}><div className="form-group"><label htmlFor="duvida">Descreva sua dúvida</label><textarea id="duvida" value={mensagem} onChange={e => setMensagem(e.target.value)} required maxLength={2000} /></div><button className="btn btn-primary" type="submit">{ocupado === 'ajuda' ? 'Enviando…' : 'Enviar solicitação'}</button></fieldset></form>
    </div></div></>
}
