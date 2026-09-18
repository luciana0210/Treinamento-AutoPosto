import React from 'react'

function ModuloInterno({ onVoltar }) {
  return (
    <div>
      <div className="topline">
        <div>
          <button onClick={onVoltar} className="eyebrow-link" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            ← Voltar para meus módulos
          </button>
          <span style={{ display: 'block', fontSize: '13px', color: 'var(--muted)', marginTop: '8px', fontWeight: '600' }}>Módulo 4 de 7</span>
          <h1 style={{ marginTop: '4px' }}>Operação das bombas</h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>20 min · Vídeo + prática guiada</p>
        </div>
      </div>

      <div className="module-grid">
        {/* Esquerda: Player e Conteúdo */}
        <div>
          <div className="video-placeholder">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>▶</div>
              <div>04:12 / 09:40 — Autorizando e liberando a bomba</div>
            </div>
          </div>

          <div className="card quiz-box">
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Questionário de fixação</h2>
            <div className="form-group">
              <label style={{ fontSize: '15px' }}>1. O que fazer antes de autorizar a bomba?</label>
              <div className="radio-group">
                <label style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="quiz1" /> Verificar se o cliente escolheu o combustível correto.
                </label>
                <label style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="quiz1" /> Confirmar o aterramento do veículo e posicionamento do bico.
                </label>
                <label style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="quiz1" /> Ligar a iluminação de segurança do box.
                </label>
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={() => alert('Respostas enviadas!')}>
              Enviar respostas
            </button>
          </div>
        </div>

        {/* Direita: Prática e Checklist */}
        <div>
          <div className="card checklist-box" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '14px' }}>Checklist da prática</h2>
            <div className="checklist-item">
              <input type="checkbox" id="item1" /> <label htmlFor="item1">Conferir lacre</label>
            </div>
            <div className="checklist-item">
              <input type="checkbox" id="item2" /> <label htmlFor="item2">Zerar o painel</label>
            </div>
            <div className="checklist-item">
              <input type="checkbox" id="item3" /> <label htmlFor="item3">Acoplar bico</label>
            </div>
          </div>

          <div className="card checklist-box" style={{ background: 'var(--ink)', color: 'var(--paper)', border: 'none' }}>
            <h3 style={{ fontSize: '14px', color: '#B9C2AF', marginBottom: '8px' }}>Dúvida sem resposta?</h3>
            <p style={{ fontSize: '13px', marginBottom: '16px', opacity: 0.9 }}>Chame seu gestor antes de seguir para a prática.</p>
            <button className="btn btn-ghost btn-block" style={{ color: '#fff', borderColor: 'var(--line-dark)' }} onClick={() => alert('Chamando gestor...')}>
              Falar com o gestor
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModuloInterno
