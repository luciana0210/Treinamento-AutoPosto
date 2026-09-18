import React from 'react'

function Login({ onLogin }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    onLogin() // Faz o login fictício e entra no app
  }

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-info">
          <h1>A rotina do posto, em módulos curtos.</h1>
          <p style={{ marginBottom: '24px', opacity: 0.8 }}>
            Atendimento, segurança no manuseio de combustíveis e operação de caixa — no seu ritmo, sem depender de alguém te acompanhando o tempo todo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><strong>7</strong> módulos na trilha</div>
            <div><strong>~15 min</strong> por módulo</div>
            <div><strong>NR-20</strong> conteúdo obrigatório</div>
          </div>
        </div>
        
        <div className="login-form-box card">
          <h2 style={{ marginBottom: '8px' }}>Entrar</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
            Use os dados enviados pelo seu gestor no primeiro dia.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>E-mail ou usuário</label>
              <input type="text" placeholder="seu@email.com" required />
            </div>
            
            <div className="form-group">
              <label>Senha</label>
              <input type="password" placeholder="••••••••" required />
            </div>
            
            <div className="login-links">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" /> Manter conectado
              </label>
              <a href="#esqueceu">Esqueci minha senha</a>
            </div>
            
            <button type="submit" className="btn btn-primary btn-block">Entrar</button>
          </form>
          
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '24px', textAlign: 'center' }}>
            Primeiro acesso? <a href="#gestor" style={{ color: 'var(--ink)', fontWeight: '600' }}>Fale com seu gestor para receber o convite.</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
