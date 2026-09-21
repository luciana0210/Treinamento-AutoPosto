import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '../../src/Paginas/Login'
import * as api from '../../src/services/api'

vi.mock('../../src/services/api', () => ({
  fazerLogin: vi.fn(),
  solicitarRecuperacaoSenha: vi.fn(),
}))

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza os elementos principais da tela de login do Autoposto Rego & CIA', () => {
    render(<Login onLogin={vi.fn()} />)

    expect(screen.getAllByText(/Autoposto Rego & CIA/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { level: 2, name: /entrar/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail ou usuário/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/manter conectado/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^entrar$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /esqueci minha senha/i })).toBeInTheDocument()
  })

  it('alterna para o formulário de recuperar senha e volta ao login', async () => {
    const user = userEvent.setup()
    render(<Login onLogin={vi.fn()} />)

    const btnEsqueci = screen.getByRole('button', { name: /esqueci minha senha/i })
    await user.click(btnEsqueci)

    expect(screen.getByRole('heading', { level: 2, name: /recuperar senha/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/senha/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar instruções/i })).toBeInTheDocument()

    const btnVoltar = screen.getByRole('button', { name: /voltar ao login/i })
    await user.click(btnVoltar)

    expect(screen.getByRole('heading', { level: 2, name: /entrar/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
  })

  it('realiza login com sucesso e chama onLogin com dados do usuário', async () => {
    const user = userEvent.setup()
    const onLoginMock = vi.fn()
    const usuarioMock = { id: '1', nome: 'João Souza', cargo: 'Frentista', perfil: 'colaborador' }

    api.fazerLogin.mockResolvedValueOnce({
      usuario: usuarioMock,
    })

    render(<Login onLogin={onLoginMock} />)

    await user.type(screen.getByLabelText(/e-mail ou usuário/i), 'joao@rego.local')
    await user.type(screen.getByLabelText(/senha/i), 'Demo@12345')
    await user.click(screen.getByRole('button', { name: /^entrar$/i }))

    await waitFor(() => {
      expect(api.fazerLogin).toHaveBeenCalledWith({
        usuario: 'joao@rego.local',
        senha: 'Demo@12345',
        manterConectado: false,
      })
      expect(onLoginMock).toHaveBeenCalledWith(usuarioMock)
    })
  })

  it('exibe mensagem de erro quando o login falhar', async () => {
    const user = userEvent.setup()
    api.fazerLogin.mockRejectedValueOnce(new Error('E-mail ou senha inválidos.'))

    render(<Login onLogin={vi.fn()} />)

    await user.type(screen.getByLabelText(/e-mail ou usuário/i), 'usuario@errado.com')
    await user.type(screen.getByLabelText(/senha/i), 'senha123')
    await user.click(screen.getByRole('button', { name: /^entrar$/i }))

    await waitFor(() => {
      const alerta = screen.getByRole('alert')
      expect(alerta).toBeInTheDocument()
      expect(alerta).toHaveTextContent('E-mail ou senha inválidos.')
    })
  })

  it('solicita recuperação de senha com sucesso', async () => {
    const user = userEvent.setup()
    api.solicitarRecuperacaoSenha.mockResolvedValueOnce({
      mensagem: 'Instruções enviadas para o responsável pelo projeto.',
    })

    render(<Login onLogin={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /esqueci minha senha/i }))
    await user.type(screen.getByLabelText(/e-mail ou usuário/i), 'maria@rego.local')
    await user.click(screen.getByRole('button', { name: /enviar instruções/i }))

    await waitFor(() => {
      expect(api.solicitarRecuperacaoSenha).toHaveBeenCalledWith('maria@rego.local')
      expect(screen.getByRole('status')).toHaveTextContent('Instruções enviadas para o responsável pelo projeto.')
    })
  })
})
