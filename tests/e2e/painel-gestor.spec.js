import { test, expect } from '@playwright/test'

test.describe('Fluxo do Painel da Gestão (E2E)', () => {
  test('permite ao gestor acompanhar métricas e status de colaboradores', async ({ page }) => {
    // Login com Gestor
    await page.goto('/')
    await page.fill('input[name="usuario"]', 'gestor@rego.local')
    await page.fill('input[name="senha"]', 'Demo@12345')
    await page.click('button[type="submit"]')

    await expect(page.locator('.sidebar-foot')).toContainText('Diogo Gestor')

    // Link exclusivo do painel
    const linkPainel = page.locator('button.nav-link:has-text("Painel da equipe")')
    await expect(linkPainel).toBeVisible()
    await linkPainel.click()

    // Validação da tela do painel
    await expect(page.locator('h1')).toHaveText('Painel da equipe')

    // Métricas operacionais
    await expect(page.locator('.metric-card:has-text("Colaboradores ativos")')).toBeVisible()
    await expect(page.locator('.metric-card:has-text("Conclusão média da trilha")')).toBeVisible()
    await expect(page.locator('.metric-card:has-text("Treinamentos pendentes")')).toBeVisible()

    // Tabela de colaboradores com os três status
    const tabela = page.locator('.data-table')
    await expect(tabela).toBeVisible()
    await expect(tabela).toContainText('João Souza')
    await expect(tabela).toContainText('Concluído')
    await expect(tabela).toContainText('Maria Silva')
    await expect(tabela).toContainText('Em dia')
    await expect(tabela).toContainText('Pedro Santos')
    await expect(tabela).toContainText('Atrasado')

    // Logout do gestor
    await page.click('button.nav-link:has-text("Sair")')
    await expect(page.locator('h2')).toHaveText('Entrar')
  })
})
