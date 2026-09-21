import { test, expect } from '@playwright/test'

test.describe('Fluxo do Certificado de Conclusão (E2E)', () => {
  test('exibe card de certificado e abre modal oficial para colaborador concluído', async ({ page }) => {
    // Login com João Souza (trilha 100% concluída)
    await page.goto('/')
    await page.fill('input[name="usuario"]', 'joao@rego.local')
    await page.fill('input[name="senha"]', 'Demo@12345')
    await page.click('button[type="submit"]')

    await expect(page.locator('.sidebar-foot')).toContainText('João Souza')
    await expect(page.locator('.ring-inner strong')).toHaveText('100%')
    await expect(page.locator('.section-header')).toContainText('100% Concluída')

    // Valida a presença do card de certificado
    const certificateCard = page.locator('.certificate-card')
    await expect(certificateCard).toBeVisible()
    await expect(certificateCard).toContainText('Certificado de Conclusão da Trilha')
    await expect(certificateCard).toContainText('🏆 Certificado Emitido')

    // Clica para visualizar o certificado oficial
    await page.click('button:has-text("Visualizar Certificado")')

    // Valida abertura e conteúdo do diploma
    const modal = page.locator('.certificate-modal')
    await expect(modal).toBeVisible()
    await expect(modal).toContainText('Autoposto Rego & CIA')
    await expect(modal).toContainText('CERTIFICADO DE CONCLUSÃO')
    await expect(modal).toContainText('João Souza')
    await expect(modal).toContainText(/Código de Autenticidade:/i)

    // Fecha o modal
    await page.click('button:has-text("Fechar ✕")')
    await expect(modal).not.toBeVisible()
  })
})
