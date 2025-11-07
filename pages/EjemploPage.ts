import { Page } from "playwright";

export class EjemploPage {
  constructor(private page: Page) {}

  async navegar() {
    await this.page.goto("https://www.google.com");
  }

  async buscar(termino: string) {
    await this.page.fill('textarea[name="q"]', termino);
    await this.page.keyboard.press("Enter");
  }

  async obtenerContenido() {
    return this.page.textContent("body");
  }
}
