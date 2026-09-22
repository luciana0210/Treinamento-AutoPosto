import { test, expect } from '@playwright/test'

test.describe('Fluxo da Trilha do Colaborador (E2E)', () => {
  test('navega pelos módulos, realiza checklist e envia dúvida ao gestor', async ({ page }) => {
    // Login com Maria (em andamento)
    await page.goto('/')
    await page.fill('input[name="usuario"]', 'maria@rego.local')
    await page.fill('input[name="senha"]', 'Demo@12345')
    await page.click('button[type="submit"]')

    await expect(page.locator('.sidebar-foot')).toContainText('Maria Silva')
    await expect(page.locator('h1')).toContainText('Olá, Maria Silva!')

    // Abre o módulo em andamento ou liberado (Continuar ou Abrir) para testar checklist e dúvida
    const btnModuloAtivo = page.locator('.module-item button').filter({ hasText: /Continuar|Abrir/ }).first()
    await btnModuloAtivo.click()

    // Valida que entrou na tela do módulo interno
    await expect(page.locator('button:has-text("Voltar para meus módulos")')).toBeVisible()
    await expect(page.locator('h2:has-text("Checklist da prática")')).toBeVisible()

    // 1. Checklist
    const checklistCheckbox = page.locator('.checklist-item input[type="checkbox"]').first()
    if (await checklistCheckbox.isVisible()) {
      await checklistCheckbox.check()
      await page.click('button:has-text("Salvar checklist")')
      await expect(page.locator('p.aviso.sucesso')).toContainText(/checklist salvo/i)
    }

    // 2. Dúvida com o gestor
    const campoDuvida = page.locator('#duvida')
    await campoDuvida.fill('Dúvida de teste operacional sobre o procedimento de pista.')
    await page.click('button:has-text("Enviar solicitação")')
    await expect(page.locator('p.aviso.sucesso')).toContainText(/solicitação registrada/i)

    // 3. Voltar para a lista de módulos
    await page.click('button:has-text("Voltar para meus módulos")')
    await expect(page.locator('h1')).toContainText('Olá, Maria Silva!')
  })
})
