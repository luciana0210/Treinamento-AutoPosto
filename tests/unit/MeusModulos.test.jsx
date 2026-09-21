import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MeusModulos from '../../src/Paginas/MeusModulos'
import * as api from '../../src/services/api'

vi.mock('../../src/services/api', () => ({
  buscarMeusModulos: vi.fn(),
  buscarCertificado: vi.fn(),
}))

describe('MeusModulos Component', () => {
  const usuarioMock = {
    id: '3',
    nome: 'Maria Silva',
    cargo: 'Operadora de caixa',
    empresa: { nome: 'Autoposto Rego & CIA' },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza resumo da trilha em andamento e lista de módulos', async () => {
    const onVerModuloMock = vi.fn()
    const user = userEvent.setup()

    api.buscarMeusModulos.mockResolvedValueOnce({
      resumo: {
        progressoPercentual: 14,
        moduloAtualId: '1:2',
        moduloAtualOrdem: 2,
        totalModulos: 7,
        concluido: false,
        status: 'em_dia',
        prazoLimite: '2026-10-05T00:00:00.000Z',
        atrasado: false,
        certificado: null,
      },
      modulos: [
        { id: '1:1', ordem: 1, titulo: 'Boas-vindas ao posto', duracaoMinutos: 8, tipo: 'Leitura + avaliação', status: 'concluido' },
        { id: '1:2', ordem: 2, titulo: 'Atendimento no caixa', duracaoMinutos: 15, tipo: 'Leitura + avaliação', status: 'em_andamento' },
        { id: '1:3', ordem: 3, titulo: 'Segurança com combustíveis', duracaoMinutos: 18, tipo: 'Leitura + avaliação', status: 'bloqueado' },
      ],
    })

    render(<MeusModulos usuario={usuarioMock} onVerModulo={onVerModuloMock} />)

    await waitFor(() => {
      expect(screen.getByText(/14%/i)).toBeInTheDocument()
      expect(screen.getByText(/Olá, Maria Silva!/i)).toBeInTheDocument()
      expect(screen.getByText(/Boas-vindas ao posto/i)).toBeInTheDocument()
      expect(screen.getByText(/Atendimento no caixa/i)).toBeInTheDocument()
      expect(screen.getByText(/Segurança com combustíveis/i)).toBeInTheDocument()
    })

    // Botões de ação para módulos liberados
    const btnRevisar = screen.getByRole('button', { name: /revisar/i })
    const btnContinuar = screen.getByRole('button', { name: /continuar/i })
    expect(btnRevisar).toBeInTheDocument()
    expect(btnContinuar).toBeInTheDocument()

    await user.click(btnContinuar)
    expect(onVerModuloMock).toHaveBeenCalledWith('1:2')
  })

  it('exibe alerta de prazo vencido quando o colaborador estiver atrasado', async () => {
    api.buscarMeusModulos.mockResolvedValueOnce({
      resumo: {
        progressoPercentual: 7,
        moduloAtualId: '2:1',
        moduloAtualOrdem: 1,
        totalModulos: 7,
        concluido: false,
        status: 'atrasado',
        prazoLimite: '2026-09-20T00:00:00.000Z',
        atrasado: true,
        certificado: null,
      },
      modulos: [
        { id: '2:1', ordem: 1, titulo: 'Boas-vindas ao posto', duracaoMinutos: 8, tipo: 'Leitura + avaliação', status: 'em_andamento' },
      ],
    })

    render(<MeusModulos usuario={{ ...usuarioMock, nome: 'Pedro Santos' }} onVerModulo={vi.fn()} />)

    await waitFor(() => {
      const alerta = screen.getByRole('alert')
      expect(alerta).toBeInTheDocument()
      expect(alerta).toHaveTextContent(/Atenção: Prazo Vencido/i)
      expect(alerta).toHaveTextContent(/prazo de conclusão expirado/i)
      expect(screen.getByText(/Atrasada/i)).toBeInTheDocument()
    })
  })

  it('exibe card de certificado e abre o modal oficial ao concluir 100% da trilha', async () => {
    const user = userEvent.setup()

    api.buscarMeusModulos.mockResolvedValueOnce({
      resumo: {
        progressoPercentual: 100,
        moduloAtualId: null,
        moduloAtualOrdem: null,
        totalModulos: 7,
        concluido: true,
        status: 'concluido',
        prazoLimite: '2026-10-10T00:00:00.000Z',
        atrasado: false,
        certificado: { id: 'uuid-1234-abcd', emitidoEm: '2026-09-21T18:00:00.000Z' },
      },
      modulos: [
        { id: '3:1', ordem: 1, titulo: 'Boas-vindas ao posto', duracaoMinutos: 8, tipo: 'Leitura + avaliação', status: 'concluido' },
      ],
    })

    api.buscarCertificado.mockResolvedValueOnce({
      id: 'uuid-1234-abcd',
      participant_name: 'João Souza',
      issued_at: '2026-09-21T18:00:00.000Z',
      cycle: 1,
      title: 'Certificado de conclusão — Trilha interna de integração',
      modules: ['Boas-vindas ao posto', 'Segurança no manuseio de combustíveis'],
      notice: 'Conteúdo interno e complementar do Autoposto Rego & CIA.',
    })

    render(<MeusModulos usuario={{ ...usuarioMock, nome: 'João Souza' }} onVerModulo={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/Certificado de Conclusão da Trilha/i)).toBeInTheDocument()
      expect(screen.getByText(/🏆 Certificado Emitido/i)).toBeInTheDocument()
    })

    const btnVisualizar = screen.getByRole('button', { name: /visualizar certificado/i })
    await user.click(btnVisualizar)

    await waitFor(() => {
      expect(screen.getByText(/Visualização do Certificado Oficial/i)).toBeInTheDocument()
    })

    expect(api.buscarCertificado).toHaveBeenCalledWith('uuid-1234-abcd')
    expect(screen.getAllByText(/CERTIFICADO DE CONCLUSÃO/i).length).toBeGreaterThanOrEqual(1)

    // Fechar modal
    const btnFechar = screen.getByRole('button', { name: /fechar/i })
    await user.click(btnFechar)
    expect(screen.queryByText(/Visualização do Certificado Oficial/i)).not.toBeInTheDocument()
  })
})
