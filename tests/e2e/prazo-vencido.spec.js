import { test, expect } from '@playwright/test'

test.describe('Fluxo de Prazo Vencido do Treinamento (E2E)', () => {
  test('exibe alerta de prazo expirado para colaborador em atraso', async ({ page }) => {
    // Login com Pedro Santos (prazo vencido)
    await page.goto('/')
    await page.fill('input[name="usuario"]', 'pedro@rego.local')
    await page.fill('input[name="senha"]', 'Demo@12345')
    await page.click('button[type="submit"]')

    await expect(page.locator('.sidebar-foot')).toContainText('Pedro Santos')

    // Valida o banner de alerta operacional de prazo vencido
    const alertaPrazo = page.locator('.deadline-alert')
    await expect(alertaPrazo).toBeVisible()
    await expect(alertaPrazo).toContainText('Atenção: Prazo Vencido')
    await expect(alertaPrazo).toContainText('prazo de conclusão expirado')
    await expect(alertaPrazo).toContainText('Autoposto Rego & CIA')

    // Valida a pílula de status no cabeçalho
    await expect(page.locator('.section-header')).toContainText('Atrasada')

    // Valida que o colaborador não é impedido de estudar e tem botão para prosseguir
    const btnContinuar = page.locator('.module-item button.btn-primary').first()
    await expect(btnContinuar).toBeVisible()
    await expect(btnContinuar).toBeEnabled()
  })
})
