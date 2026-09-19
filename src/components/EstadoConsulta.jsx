export default function EstadoConsulta({ consulta }) {
  if (consulta.carregando) return <p role="status">Carregando…</p>
  if (consulta.erro) return <div className="aviso erro" role="alert"><p>{consulta.erro}</p><button className="btn btn-ghost" onClick={consulta.recarregar}>Tentar novamente</button></div>
  return null
}
