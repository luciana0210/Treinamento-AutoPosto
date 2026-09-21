const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

async function requisicao(caminho, { method = 'GET', body, signal } = {}) {
  let resposta
  try { resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal: signal || AbortSignal.timeout(20000),
  })
  } catch (causa) {
    if (causa.name === 'AbortError') throw causa
    throw new Error(causa.name === 'TimeoutError' ? 'O servidor demorou para responder. Tente novamente.' : 'Não foi possível conectar ao servidor. Tente novamente mais tarde.', { cause: causa })
  }
  if (resposta.status === 401 && caminho !== '/auth/login' && caminho !== '/auth/recuperar-senha' && caminho !== '/auth/me') {
    window.dispatchEvent(new Event('sessao-expirada'))
  }
  if (resposta.status === 204) return null
  const texto = await resposta.text()
  let dados = null
  if (texto) {
    try { dados = JSON.parse(texto) } catch {
      const erro = new Error(`A API retornou conteúdo não JSON (HTTP ${resposta.status}). Confira a URL da API.`)
      erro.status = resposta.status
      throw erro
    }
  }
  if (!resposta.ok) {
    const erro = new Error(dados?.mensagem || `Erro HTTP ${resposta.status}`)
    erro.status = resposta.status
    erro.dados = dados
    throw erro
  }
  return dados
}

const id = (valor) => encodeURIComponent(String(valor))

// Login.jsx: credenciais capturadas pelo formulário.
export function fazerLogin({ usuario, senha, manterConectado = false }) {
  return requisicao('/auth/login', { method: 'POST', body: { usuario, senha, manterConectado } })
}

// App.jsx: recuperar identidade e perfil da sessão.
export function buscarUsuarioAtual() {
  return requisicao('/auth/me')
}

// MeusModulos.jsx: substituir a lista e o resumo fixos.
export function buscarMeusModulos() {
  return requisicao('/me/modulos')
}

// ModuloInterno.jsx: carregar o módulo selecionado.
export function buscarModulo(moduloId) {
  return requisicao(`/modulos/${id(moduloId)}`)
}

// Questionário. respostas: [{ perguntaId, alternativaId }].
export function enviarRespostas(moduloId, respostas) {
  return requisicao(`/modulos/${id(moduloId)}/respostas`, { method: 'POST', body: { respostas } })
}

// Salva o estado completo dos checkboxes. itens: [{ itemId, concluido }].
export function salvarChecklist(moduloId, itens) {
  return requisicao(`/modulos/${id(moduloId)}/checklist`, { method: 'PUT', body: { itens } })
}

// PainelEquipe.jsx: métricas e colaboradores visíveis ao gestor autenticado.
export function buscarPainelEquipe() {
  return requisicao('/equipe/painel')
}

// Sessão, recuperação e solicitação de ajuda.
export function sair() {
  return requisicao('/auth/logout', { method: 'POST' })
}

export function solicitarRecuperacaoSenha(usuario) {
  return requisicao('/auth/recuperar-senha', { method: 'POST', body: { usuario } })
}

// Registra a dúvida enviada pelo formulário de ajuda.
export function solicitarAjudaGestor(moduloId, mensagem) {
  return requisicao(`/modulos/${id(moduloId)}/ajuda`, { method: 'POST', body: { mensagem } })
}

// Busca dados completos do certificado emitido.
export function buscarCertificado(certificadoId) {
  return requisicao(`/certificates/${id(certificadoId)}`)
}

