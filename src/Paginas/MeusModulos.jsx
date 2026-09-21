import { useState } from 'react'
import { buscarMeusModulos, buscarCertificado } from '../services/api'
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
  const [modalCertificado, setModalCertificado] = useState(null)
  const [carregandoCertificado, setCarregandoCertificado] = useState(false)
  const [erroCertificado, setErroCertificado] = useState('')

  if (!consulta.dados) return <EstadoConsulta consulta={consulta} />
  const { resumo, modulos } = consulta.dados

  async function abrirCertificado(certificadoId) {
    setCarregandoCertificado(true)
    setErroCertificado('')
    try {
      const dados = await buscarCertificado(certificadoId)
      setModalCertificado(dados)
    } catch (e) {
      setErroCertificado(e.message || 'Não foi possível carregar o certificado.')
    } finally {
      setCarregandoCertificado(false)
    }
  }

  return (
    <div>
      <div className="topline">
        <div className="resumo-trilha">
          <div className="ring" style={{ '--pct': resumo.progressoPercentual }}>
            <div className="ring-inner">
              <strong>{resumo.progressoPercentual}%</strong>
              <span>concluído</span>
            </div>
          </div>
          <div>
            <p>{usuario.empresa?.nome || 'Autoposto Rego & CIA'}</p>
            <h1>Olá, {usuario.nome}!</h1>
            <p>
              {resumo.totalModulos} módulos na sua trilha
              {resumo.moduloAtualOrdem ? ` · Módulo atual: ${resumo.moduloAtualOrdem}` : resumo.progressoPercentual === 100 ? ' · Trilha 100% Concluída' : ''}
            </p>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={consulta.recarregar}>Atualizar</button>
      </div>

      <h2>Trilha de integração</h2>
      {!modulos.length && <p className="aviso">Nenhum módulo atribuído a você.</p>}
      
      <div className="modules-list">
        {modulos.map(mod => (
          <div key={mod.id} className="card module-item">
            <div className="module-details">
              <div className="module-meta">{mod.ordem} · {mod.duracaoMinutos} min · {mod.tipo}</div>
              <h3>{mod.titulo}</h3>
              <span className={`pill ${mod.status === 'concluido' ? 'pill-done' : mod.status === 'em_andamento' ? 'pill-progress' : 'pill-locked'}`}>
                {rotulos[mod.status] || mod.status}
              </span>
            </div>
            {mod.status !== 'bloqueado' && (
              <button className="btn btn-primary" onClick={() => onVerModulo(mod.id)}>
                {mod.status === 'concluido' ? 'Revisar' : mod.status === 'em_andamento' ? 'Continuar' : 'Abrir'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Certificado de Conclusão exibido logo abaixo da trilha quando emitida/concluída */}
      {resumo.certificado && (
        <section className="card certificate-card">
          <div className="certificate-badge">🏆 Certificado Emitido</div>
          <div className="certificate-body">
            <div className="certificate-icon-box">
              <span className="certificate-seal">🎓</span>
            </div>
            <div className="certificate-info">
              <h3>Certificado de Conclusão da Trilha</h3>
              <p>
                Parabéns, <strong>{usuario.nome}</strong>! Você concluiu todos os {resumo.totalModulos} módulos de capacitação operacional do <strong>Autoposto Rego & CIA</strong>.
              </p>
              <div className="certificate-meta">
                <span>Emitido em: {new Date(resumo.certificado.emitidoEm).toLocaleDateString('pt-BR')}</span>
                <span className="certificate-code">Autenticidade: {resumo.certificado.id.substring(0, 8)}...</span>
              </div>
            </div>
            <div className="certificate-actions">
              <button
                className="btn btn-primary"
                disabled={carregandoCertificado}
                onClick={() => abrirCertificado(resumo.certificado.id)}
              >
                {carregandoCertificado ? 'Carregando…' : 'Visualizar Certificado'}
              </button>
            </div>
          </div>
          {erroCertificado && <p className="aviso erro" role="alert">{erroCertificado}</p>}
        </section>
      )}

      {/* Modal / Visualização de Impressão do Certificado Oficial */}
      {modalCertificado && (
        <div className="certificate-modal-backdrop" onClick={() => setModalCertificado(null)}>
          <div className="certificate-modal" onClick={e => e.stopPropagation()}>
            <div className="certificate-modal-toolbar">
              <span>Visualização do Certificado Oficial</span>
              <div className="certificate-modal-buttons">
                <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Imprimir / Salvar PDF</button>
                <button className="btn btn-ghost" onClick={() => setModalCertificado(null)}>Fechar ✕</button>
              </div>
            </div>

            <div className="certificate-diploma" id="certificate-print-area">
              <div className="diploma-border">
                <div className="diploma-inner">
                  <div className="diploma-header">
                    <div className="diploma-brand">
                      <div className="brand-mark" />
                      <div>
                        <div className="diploma-company">Autoposto Rego & CIA</div>
                        <div className="diploma-sub">Capacitação Operacional & Normas Regulamentadoras</div>
                      </div>
                    </div>
                    <div className="diploma-badge">CERTIFICADO OFICIAL</div>
                  </div>

                  <div className="diploma-content">
                    <div className="diploma-title">CERTIFICADO DE CONCLUSÃO</div>
                    <p className="diploma-lead">Certificamos para os devidos fins que</p>
                    <div className="diploma-name">{modalCertificado.participant_name || usuario.nome}</div>
                    <p className="diploma-text">
                      concluiu com êxito a <strong>{modalCertificado.title}</strong> do <strong>Autoposto Rego & CIA</strong>,
                      cumprindo integralmente a carga horária, checklists práticos e critérios de aprovação estabelecidos para a operação de pista e atendimento.
                    </p>

                    <div className="diploma-modules-box">
                      <div className="diploma-modules-title">Módulos Concluídos:</div>
                      <div className="diploma-modules-grid">
                        {modalCertificado.modules.map((modTitulo, idx) => (
                          <div key={idx} className="diploma-module-item">
                            ✓ {modTitulo}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="diploma-notice">
                      {modalCertificado.notice}
                    </div>

                    <div className="diploma-footer">
                      <div className="diploma-signature">
                        <div className="signature-line" />
                        <div className="signature-title">Gestão de Treinamento e Segurança</div>
                        <div className="signature-company">Autoposto Rego & CIA</div>
                      </div>
                      <div className="diploma-meta-info">
                        <div><strong>Data de Emissão:</strong> {new Date(modalCertificado.issued_at).toLocaleDateString('pt-BR')}</div>
                        <div><strong>Código de Autenticidade:</strong> {modalCertificado.id}</div>
                        <div><strong>Ciclo:</strong> #{modalCertificado.cycle}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
