import { test, expect } from '@playwright/test'

test.describe('Fluxo de Autenticação e Sessão (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // Garante sessão limpa
    await page.goto('/')
  })

  test('exibe erro ao tentar entrar com senha incorreta', async ({ page }) => {
    await page.fill('input[name="usuario"]', 'maria@rego.local')
    await page.fill('input[name="senha"]', 'SenhaInvalida@999')
    await page.click('button[type="submit"]')

    const erro = page.locator('p.aviso.erro')
    await expect(erro).toBeVisible()
    await expect(erro).toContainText(/inválidos/i)
  })

  test('permite solicitar recuperação de senha institucional', async ({ page }) => {
    await page.click('button:has-text("Esqueci minha senha")')
    await expect(page.locator('h2')).toHaveText('Recuperar senha')

    await page.fill('input[name="usuario"]', 'maria@rego.local')
    await page.click('button[type="submit"]')

    const msg = page.locator('p.aviso.sucesso, p.aviso.erro')
    await expect(msg).toBeVisible()
    await expect(msg).toContainText(/instruções|responsável|recuperação/i)

    // Voltar para tela de login
    await page.click('button:has-text("Voltar ao login")')
    await expect(page.locator('h2')).toHaveText('Entrar')
  })

  test('realiza login com sucesso e efetua logout com segurança', async ({ page }) => {
    await page.fill('input[name="usuario"]', 'maria@rego.local')
    await page.fill('input[name="senha"]', 'Demo@12345')
    await page.click('button[type="submit"]')

    // Verifica entrada na aplicação interna
    await expect(page.locator('.brand-name')).toHaveText('Treinamento')
    await expect(page.locator('.brand-sub')).toContainText('Autoposto Rego & CIA')
    await expect(page.locator('.sidebar-foot')).toContainText('Maria Silva')

    // Realiza logout
    await page.click('button.nav-link:has-text("Sair")')

    // Deve retornar para o login
    await expect(page.locator('h2')).toHaveText('Entrar')
  })
})
