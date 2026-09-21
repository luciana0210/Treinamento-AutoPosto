import { useState } from 'react'
import { fazerLogin, solicitarRecuperacaoSenha } from '../services/api'

export default function Login({ onLogin, aviso = '' }) {
  const [recuperar, setRecuperar] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  async function enviar(e) {
    e.preventDefault()
    if (ocupado) return
    const campos = new FormData(e.currentTarget)
    setOcupado(true); setErro(''); setMensagem('')
    try {
      const usuario = campos.get('usuario').trim()
      if (!usuario) throw new Error('Informe seu e-mail ou usuário.')
      if (recuperar) {
        const dados = await solicitarRecuperacaoSenha(usuario)
        if (!dados?.mensagem) throw new Error('Resposta de recuperação inválida.')
        setMensagem(dados.mensagem)
      } else {
        const dados = await fazerLogin({ usuario, senha: campos.get('senha'), manterConectado: campos.has('manterConectado') })
        if (!dados?.usuario?.id || !dados.usuario.nome) throw new Error('O servidor não retornou os dados do usuário.')
        onLogin(dados.usuario)
      }
    } catch (e) { setErro(e.message) } finally { setOcupado(false) }
  }
  return <div className="login-wrapper"><div className="login-container">
    <div className="login-info">
      <div className="login-brand">
        <div className="brand-mark" />
        <div>
          <div className="brand-name">Autoposto Rego & CIA</div>
          <div className="brand-sub">Portal de Treinamento & Capacitação</div>
        </div>
      </div>
      <h1>A rotina do posto, em módulos curtos.</h1>
      <p>Acesse sua trilha de treinamento operacional e acompanhe seu progresso.</p>
    </div>
    <div className="login-form-box card">
      <div className="login-form-header">
        <span className="login-tag">Autoposto Rego & CIA</span>
        <h2>{recuperar ? 'Recuperar senha' : 'Entrar'}</h2>
      </div>
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      {erro && <p className="aviso erro" role="alert">{erro}</p>}
      {mensagem && <p className="aviso sucesso" role="status">{mensagem}</p>}
      <form onSubmit={enviar}><fieldset disabled={ocupado}>
        <div className="form-group"><label htmlFor="usuario">E-mail ou usuário</label><input id="usuario" name="usuario" autoComplete="username" required /></div>
        {!recuperar && <><div className="form-group"><label htmlFor="senha">Senha</label><input id="senha" name="senha" type="password" autoComplete="current-password" required /></div>
          <label><input name="manterConectado" type="checkbox" /> Manter conectado</label></>}
        <button className="btn btn-primary btn-block" type="submit">{ocupado ? 'Aguarde…' : recuperar ? 'Enviar instruções' : 'Entrar'}</button>
        <button className="btn btn-ghost btn-block" type="button" onClick={() => { setRecuperar(!recuperar); setErro(''); setMensagem('') }}>{recuperar ? 'Voltar ao login' : 'Esqueci minha senha'}</button>
      </fieldset></form>
      <p>Primeiro acesso? Solicite seus dados de acesso ao gestor.</p>
    </div></div></div>
}
