import React from 'react'

function PainelEquipe() {
  const colaboradores = [
    { nome: 'Maria', cargo: 'Operadora de caixa', progresso: 58, modulo: 'Operação das bombas', atividade: 'Hoje, 09:40', status: 'Em dia', classe: 'pill-done' },
    { nome: 'João', cargo: 'Frentista', progresso: 100, modulo: 'Trilha concluída', atividade: 'Ontem, 17:15', status: 'Concluído', classe: 'pill-done' },
    { nome: 'Pedro', cargo: 'Operador de caixa', progresso: 22, modulo: 'Segurança no manuseio', atividade: 'Há 4 dias', status: 'Atrasado', classe: 'pill-locked' },
    { nome: 'Rafael', cargo: 'Frentista', progresso: 71, modulo: 'Normas e NR-20', atividade: 'Hoje, 08:02', status: 'Em dia', classe: 'pill-done' },
  ]

  return (
    <div>
      <div className="topline">
        <div>
          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: '600' }}>Treinamento Rego › Painel do gestor(a)</span>
          <h1 style={{ marginTop: '4px' }}>Painel da equipe</h1>
        </div>
      </div>
      <p style={{ color: 'var(--muted)', marginBottom: '28px' }}>Acompanhe o progresso de treinamento dos colaboradores do posto.</p>

      {/* Grid de Métricas */}
      <div className="metrics-grid">
        <div className="card metric-card">
          <h3>Colaboradores ativos</h3>
          <div className="metric-value">8</div>
          <div className="metric-sub">+2 este mês</div>
        </div>
        <div className="card metric-card">
          <h3>Conclusão média da trilha</h3>
          <div className="metric-value">64%</div>
          <div className="metric-sub">+11% nas últimas 2 semanas</div>
        </div>
        <div className="card metric-card">
          <h3>Treinamentos pendentes</h3>
          <div className="metric-value">5</div>
          <div className="metric-sub alert">Vencem em 7 dias</div>
        </div>
      </div>

      {/* Tabela de Colaboradores */}
      <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>Colaboradores</h2>
      <p style={{ color: 'var(--muted)', fontSize: '14px' }}>7 módulos na trilha de integração</p>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Progresso</th>
              <th>Módulo atual</th>
              <th>Última atividade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {colaboradores.map((colab, index) => (
              <tr key={index}>
                <td className="colab-info">
                  <div>{colab.nome}</div>
                  <span>{colab.cargo}</span>
                </td>
                <td style={{ width: '180px' }}>
                  <div style={{ display: 'flex', justifyInterventions: 'space-between', fontSize: '13px', fontWeight: '600' }}>
                    <span>{colab.progresso}%</span>
                  </div>
                  <div className={`bar ${colab.progresso === 100 ? 'is-done' : ''}`}>
                    <span style={{ width: `${colab.progresso}%` }}></span>
                  </div>
                </td>
                <td>{colab.modulo}</td>
                <td style={{ color: 'var(--muted)' }}>{colab.atividade}</td>
                <td>
                  <span className={`pill ${colab.status === 'Atrasado' ? 'pill-locked' : 'pill-done'}`}>
                    {colab.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PainelEquipe
