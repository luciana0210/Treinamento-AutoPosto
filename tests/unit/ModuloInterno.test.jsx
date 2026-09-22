import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModuloInterno from '../../src/Paginas/ModuloInterno'
import * as api from '../../src/services/api'

vi.mock('../../src/services/api', () => ({
  buscarModulo: vi.fn(),
  enviarRespostas: vi.fn(),
  salvarChecklist: vi.fn(),
  solicitarAjudaGestor: vi.fn(),
}))

describe('ModuloInterno Component', () => {
  const moduloMock = {
    id: '1:1',
    ordem: 1,
    totalModulos: 7,
    titulo: 'Boas-vindas ao posto',
    duracaoMinutos: 8,
    tipo: 'Leitura + avaliação',
    status: 'em_andamento',
    video: null,
    perguntas: [
      {
        id: '11',
        texto: 'Qual é a primeira atitude no posto?',
        alternativas: [
          { id: '0', texto: 'Conhecer os procedimentos e pedir orientação' },
          { id: '1', texto: 'Operar bombas sozinho sem avisar' },
        ],
      },
    ],
    checklist: [
      { itemId: '1', texto: 'Leitura da rotina interna do posto', concluido: false },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    api.buscarModulo.mockResolvedValue(moduloMock)
  })

  it('renderiza o cabeçalho do módulo e permite voltar', async () => {
    const user = userEvent.setup()
    const onVoltarMock = vi.fn()

    render(<ModuloInterno moduloId="1:1" onVoltar={onVoltarMock} />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Boas-vindas ao posto/i })).toBeInTheDocument()
      expect(screen.getByText(/Módulo 1 de 7/i)).toBeInTheDocument()
    })

    const btnVoltar = screen.getByRole('button', { name: /voltar para meus módulos/i })
    await user.click(btnVoltar)
    expect(onVoltarMock).toHaveBeenCalledTimes(1)
  })

  it('permite marcar o checklist e salvar', async () => {
    const user = userEvent.setup()
    api.salvarChecklist.mockResolvedValueOnce({
      itens: [{ itemId: '1', concluido: true }],
      statusModulo: 'em_andamento',
    })

    render(<ModuloInterno moduloId="1:1" onVoltar={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/Leitura da rotina interna do posto/i)).toBeInTheDocument()
    })

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)
    expect(checkbox).toBeChecked()

    const btnSalvar = screen.getByRole('button', { name: /salvar checklist/i })
    await user.click(btnSalvar)

    await waitFor(() => {
      expect(api.salvarChecklist).toHaveBeenCalledWith('1:1', [{ itemId: '1', concluido: true }])
      expect(screen.getByRole('status')).toHaveTextContent(/checklist salvo/i)
    })
  })

  it('permite selecionar alternativas e enviar questionário de fixação', async () => {
    const user = userEvent.setup()
    api.enviarRespostas.mockResolvedValueOnce({
      tentativaId: '1:1:1',
      nota: 100,
      aprovado: true,
      statusModulo: 'concluido',
    })

    render(<ModuloInterno moduloId="1:1" onVoltar={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/Qual é a primeira atitude no posto\?/i)).toBeInTheDocument()
    })

    const radioOpcao1 = screen.getByLabelText(/Conhecer os procedimentos e pedir orientação/i)
    await user.click(radioOpcao1)
    expect(radioOpcao1).toBeChecked()

    const btnEnviarQuiz = screen.getByRole('button', { name: /enviar respostas/i })
    await user.click(btnEnviarQuiz)

    await waitFor(() => {
      expect(api.enviarRespostas).toHaveBeenCalledWith('1:1', [{ perguntaId: '11', alternativaId: '0' }])
      expect(screen.getByRole('status')).toHaveTextContent(/Respostas registradas\. Nota: 100\. Aprovado\./i)
    })
  })

  it('permite enviar dúvida ao gestor', async () => {
    const user = userEvent.setup()
    api.solicitarAjudaGestor.mockResolvedValueOnce({
      solicitacaoId: 'req-9876',
    })

    render(<ModuloInterno moduloId="1:1" onVoltar={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /falar com o gestor/i })).toBeInTheDocument()
    })

    const textarea = screen.getByLabelText(/descreva sua dúvida/i)
    await user.type(textarea, 'Como funciona a conferência do fechamento?')

    const btnEnviarAjuda = screen.getByRole('button', { name: /enviar solicitação/i })
    await user.click(btnEnviarAjuda)

    await waitFor(() => {
      expect(api.solicitarAjudaGestor).toHaveBeenCalledWith('1:1', 'Como funciona a conferência do fechamento?')
      expect(screen.getByRole('status')).toHaveTextContent(/solicitação registrada: req-9876/i)
      expect(textarea).toHaveValue('')
    })
  })
})
