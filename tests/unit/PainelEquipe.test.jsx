import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PainelEquipe from '../../src/Paginas/PainelEquipe'
import * as api from '../../src/services/api'

vi.mock('../../src/services/api', () => ({
  buscarPainelEquipe: vi.fn(),
}))

describe('PainelEquipe Component', () => {
  const painelMock = {
    totalModulos: 7,
    metricas: {
      colaboradoresAtivos: 3,
      novosColaboradoresMes: 2,
      conclusaoMediaPercentual: 40,
      variacaoConclusao14DiasPontosPercentuais: null,
      treinamentosPendentes: 2,
      pendentesVencendoEm7Dias: 1,
    },
    colaboradores: [
      {
        id: '5',
        nome: 'João Souza',
        cargo: 'Frentista',
        ativo: true,
        progressoPercentual: 100,
        moduloAtual: null,
        ultimaAtividadeEm: '2026-09-21T18:00:00.000Z',
        status: 'concluido',
      },
      {
        id: '3',
        nome: 'Maria Silva',
        cargo: 'Operadora de caixa',
        ativo: true,
        progressoPercentual: 14,
        moduloAtual: { titulo: 'Atendimento no caixa' },
        ultimaAtividadeEm: '2026-09-21T18:30:00.000Z',
        status: 'em_dia',
      },
      {
        id: '4',
        nome: 'Pedro Santos',
        cargo: 'Frentista',
        ativo: true,
        progressoPercentual: 7,
        moduloAtual: { titulo: 'Boas-vindas ao posto' },
        ultimaAtividadeEm: '2026-09-20T12:00:00.000Z',
        status: 'atrasado',
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    api.buscarPainelEquipe.mockResolvedValue(painelMock)
  })

  it('renderiza os 3 cards de métricas operacionais do gestor', async () => {
    render(<PainelEquipe />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /painel da equipe/i })).toBeInTheDocument()
      expect(screen.getByText(/Colaboradores ativos/i)).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText(/Conclusão média da trilha/i)).toBeInTheDocument()
      expect(screen.getByText('40%')).toBeInTheDocument()
      expect(screen.getByText(/Treinamentos pendentes/i)).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  it('renderiza a tabela de colaboradores com progresso e status de cada um', async () => {
    render(<PainelEquipe />)

    await waitFor(() => {
      expect(screen.getByText('João Souza')).toBeInTheDocument()
      expect(screen.getByText('Maria Silva')).toBeInTheDocument()
      expect(screen.getByText('Pedro Santos')).toBeInTheDocument()
      expect(screen.getByText(/Trilha concluída/i)).toBeInTheDocument()
      expect(screen.getByText(/Atendimento no caixa/i)).toBeInTheDocument()
      expect(screen.getByText(/Boas-vindas ao posto/i)).toBeInTheDocument()
      expect(screen.getByText(/Concluído/i)).toBeInTheDocument()
      expect(screen.getByText(/Em dia/i)).toBeInTheDocument()
      expect(screen.getByText(/Atrasado/i)).toBeInTheDocument()
    })
  })

  it('permite recarregar os dados ao clicar no botão Atualizar', async () => {
    const user = userEvent.setup()
    render(<PainelEquipe />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /painel da equipe/i })).toBeInTheDocument()
    })

    const btnAtualizar = screen.getByRole('button', { name: /atualizar/i })
    await user.click(btnAtualizar)

    expect(api.buscarPainelEquipe).toHaveBeenCalledTimes(2)
  })
})
