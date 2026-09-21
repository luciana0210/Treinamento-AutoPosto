import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EstadoConsulta from '../../src/components/EstadoConsulta'

describe('EstadoConsulta Component', () => {
  it('exibe estado de carregamento quando consulta.carregando for verdadeiro', () => {
    render(<EstadoConsulta consulta={{ carregando: true, erro: null }} />)
    const status = screen.getByRole('status')
    expect(status).toBeInTheDocument()
    expect(status).toHaveTextContent('Carregando…')
  })

  it('exibe mensagem de erro e botão de tentar novamente quando houver erro', async () => {
    const user = userEvent.setup()
    const recarregarMock = vi.fn()
    
    render(
      <EstadoConsulta
        consulta={{ carregando: false, erro: 'Falha ao conectar com o servidor.', recarregar: recarregarMock }}
      />
    )

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent('Falha ao conectar com o servidor.')

    const btnTentar = screen.getByRole('button', { name: /tentar novamente/i })
    expect(btnTentar).toBeInTheDocument()

    await user.click(btnTentar)
    expect(recarregarMock).toHaveBeenCalledTimes(1)
  })

  it('não renderiza nada quando não há carregamento nem erro', () => {
    const { container } = render(<EstadoConsulta consulta={{ carregando: false, erro: null }} />)
    expect(container).toBeEmptyDOMElement()
  })
})
