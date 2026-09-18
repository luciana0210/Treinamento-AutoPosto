import React from 'react'

function MeusModulos({ onVerModulo }) {
  const modulos = [
    { id: '01', titulo: 'Boas-vindas ao posto', tempo: '8 min', tipo: 'Vídeo + leitura', status: 'Concluído', classe: 'pill-done' },
    { id: '02', titulo: 'Atendimento e vendas no caixa', tempo: '15 min', tipo: 'Vídeo + questionário', status: 'Concluído', classe: 'pill-done' },
    { id: '03', titulo: 'Segurança no manuseio de combustíveis', tempo: '18 min', tipo: 'Vídeo + checklist prático', status: 'Concluído', classe: 'pill-done' },
    { id: '04', titulo: 'Operação das bombas', tempo: '20 min', tipo: 'Vídeo + prática guiada', status: 'Em andamento', classe: 'pill-progress', ativo: true },
    { id: '05', titulo: 'Normas de segurança e saúde (NR-20)', tempo: '22 min', tipo: 'Vídeo + avaliação', status: 'Bloqueado', classe: 'pill-locked' },
    { id: '06', titulo: 'Fechamento de caixa e conferência', tempo: '12 min', tipo: 'Vídeo + questionário', status: 'Bloqueado', classe: 'pill-locked' },
    { id: '07', titulo: 'Avaliação final e certificado', tempo: '15 min', tipo: 'Prova final', status: 'Bloqueado', classe: 'pill-locked' },
  ]

  return (
    <div>
      <div className="topline">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="ring" style={{ '--pct': 58 }}>
            <div className="ring-inner">
              <strong>58%</strong>
              <span>concluído</span>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: '600' }}>Autoposto Rego & CIA</span>
            <h1 style={{ marginTop: '4px' }}>Olá, Mateus!</h1>
            <p style={{ color: 'var(--muted)', fontSize: '14.5px', marginTop: '4px' }}>
              Você está no módulo 4 de 7. No seu ritmo — cada módulo leva de 10 a 20 minutos.
            </p>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '20px', marginTop: '36px' }}>Trilha de integração</h2>
      
      <div className="modules-list">
        {modulos.map((mod) => (
          <div key={mod.id} className="card module-item" style={{ borderLeft: mod.ativo ? '4px solid var(--accent)' : '1px solid var(--line)' }}>
            <div className="module-details">
              <div className="module-meta">{mod.id} · {mod.tempo} · {mod.tipo}</div>
              <h3>{mod.titulo}</h3>
            </div>
            <div>
              {mod.ativo ? (
                <button className="btn btn-primary" onClick={onVerModulo}>Continuar</button>
              ) : (
                <span className={`pill ${mod.classe}`}>{mod.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MeusModulos
