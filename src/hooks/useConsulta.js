import { useCallback, useEffect, useState } from 'react'

export default function useConsulta(carregar) {
  const [estado, setEstado] = useState({ dados: null, erro: '', carregando: true })
  const [versao, setVersao] = useState(0)
  const recarregar = useCallback(() => {
    setEstado({ dados: null, erro: '', carregando: true })
    setVersao(v => v + 1)
  }, [])
  useEffect(() => {
    let atual = true
    Promise.resolve().then(carregar).then(dados => {
      if (atual) setEstado({ dados, erro: '', carregando: false })
    }).catch(erro => {
      if (atual) setEstado({ dados: null, erro: erro.message, carregando: false })
    })
    return () => { atual = false }
  }, [carregar, versao])
  return { ...estado, recarregar }
}
