import { Given, When, Then, After, setDefaultTimeout } from "@cucumber/cucumber";
import { chromium, Browser, Page } from "playwright";
import assert from "assert";

setDefaultTimeout(60_000); // timeout global para pasos

let browser: Browser | undefined;
let page: Page | undefined;

async function cerrarPopups(p: Page) {
  await p.waitForTimeout(800);

  const posiblesSelectores = [
    'button[aria-label="Close"]',
    'button[title="Close"]',
    'button.close',
    'button:has-text("Close")',
    'button:has-text("Cerrar")',
    'button:has-text("OK")',
    'button:has-text("Ok")',
    'button:has-text("Aceptar")',
    '.modal .close',
    '.modal button[aria-label="close"]',
    'button:has-text("×")',
    'button:has-text("X")'
  ];

  for (const sel of posiblesSelectores) {
    try {
      const loc = p.locator(sel);
      const cnt = await loc.count();
      for (let i = 0; i < cnt; i++) {
        const el = loc.nth(i);
        if (await el.isVisible()) {
          await el.click().catch(() => {});
          await p.waitForTimeout(400);
        }
      }
    } catch {
      // seguir con el siguiente selector
    }
  }

  // intentar cerrar por roles con nombres comunes
  const nombresRol = [/close/i, /cerrar/i, /ok/i, /acepto/i, /aceptar/i, /×|x/];
  for (const re of nombresRol) {
    try {
      const btn = p.getByRole('button', { name: re });
      const cnt = await btn.count();
      for (let i = 0; i < cnt; i++) {
        const el = btn.nth(i);
        if (await el.isVisible()) {
          await el.click().catch(() => {});
          await p.waitForTimeout(400);
        }
      }
    } catch {
      // ignore
    }
  }
}

Given("que abro el portal del empleado", async function () {
  browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  page = await context.newPage();
  await page.goto("https://misdatos.manpower.com.co/sse_generico/generico_login.jsp#", { waitUntil: "networkidle", timeout: 60_000 });
  try { await cerrarPopups(page); } catch (e) { console.warn("cerrarPopups fallo:", String(e)); }
});

When("hago clic en el enlace de Coillas de pago", async function () {
  if (!page) throw new Error("Page no inicializada");
  const enlace = page.getByRole('link', { name: /colillas? de pago/i });
  await enlace.waitFor({ state: 'visible', timeout: 20_000 });
  await enlace.click();
  // esperar que modal/inputs carguen
  await page.waitForTimeout(600);
});

When("ingreso el número de documento {string}", async function (documento: string) {
  if (!page) throw new Error("Page no inicializada");
  const input = page.getByRole('spinbutton');
  await input.waitFor({ state: 'visible', timeout: 20_000 });
  await input.fill(documento);
  // no cerrar aquí; el clic de confirmar se hace en el step correspondiente o con botón genérico
});

When("acepto el tratamiento de datos", async function () {
  if (!page) throw new Error("Page no inicializada");
  const btn = page.getByRole('button', { name: /acepto|aceptar/i });
  await btn.waitFor({ state: 'visible', timeout: 10_000 });
  await btn.click();
  await page.waitForTimeout(400);
});

When("marco la casilla No soy un robot", async function () {
  if (!page) throw new Error("Page no inicializada");

  // Saltar reCAPTCHA si se define la variable de entorno SKIP_RECAPTCHA=true
  if (process.env.SKIP_RECAPTCHA === "true") {
    console.log("SKIP_RECAPTCHA=true -> omitiendo reCAPTCHA");
    return;
  }

  try {
    const frameLocator = page.frameLocator('iframe[name^="a-"], iframe[src*="recaptcha"]');
    const checkbox = frameLocator.getByRole('checkbox', { name: /no soy un robot/i });
    await checkbox.waitFor({ state: 'visible', timeout: 10_000 });
    await checkbox.check();
    await page.waitForTimeout(400);
  } catch (err) {
    console.warn("No se pudo marcar reCAPTCHA/checkbox automáticamente:", String(err));
    console.log("Para omitir reCAPTCHA define la variable de entorno SKIP_RECAPTCHA=true antes de ejecutar los tests.");
  }
});

When("selecciono el periodo de pago {string}", async function (periodo: string) {
  if (!page) throw new Error("Page no inicializada");
  const combo = page.getByRole('combobox');
  await combo.waitFor({ state: 'visible', timeout: 15_000 });
  await combo.selectOption({ label: periodo }).catch(async () => {
    // fallback: seleccionar por valor si existe alguna diferencia
    const options = await combo.locator('option').allTextContents();
    const index = options.findIndex(opt => opt.trim() === periodo);
    if (index >= 0) {
      const value = await combo.locator('option').nth(index).getAttribute('value');
      if (value) await combo.selectOption({ value });
    }
  });
  await page.waitForTimeout(300);
  const ok = page.getByRole('button', { name: /ok|aceptar/i });
  if (await ok.count() > 0 && await ok.first().isVisible()) await ok.first().click();
});

Then("debería ver el mensaje de éxito", async function () {
  if (!page) throw new Error("Page no inicializada");
  const mensaje = page.getByText(/¡?éxito\b/i);
  await mensaje.waitFor({ state: 'visible', timeout: 20_000 });
  const text = await mensaje.textContent();
  assert.ok(text && /éxito/i.test(text), "No se mostró el mensaje de éxito");
  const ok = page.getByRole('button', { name: /ok|aceptar/i });
  if (await ok.count() > 0 && await ok.first().isVisible()) await ok.first().click();
});

When("hago clic en el botón {string}", async function (nombre: string) {
  if (!page) throw new Error("Page no inicializada");
  const btn = page.getByRole('button', { name: new RegExp(nombre, 'i') });
  await btn.waitFor({ state: 'visible', timeout: 10_000 });
  await btn.click();
  await page.waitForTimeout(300);
});

Then("debería ver el mensaje de error {string}", async function (mensajeEsperado: string) {
  if (!page) throw new Error("Page no inicializada");
  const error = page.getByText(new RegExp(mensajeEsperado, 'i'));
  await error.waitFor({ state: 'visible', timeout: 10_000 });
  const texto = await error.textContent();
  assert.ok(texto && texto.toLowerCase().includes(mensajeEsperado.toLowerCase()), `No se encontró el mensaje de error: ${mensajeEsperado}`);
});

Then("debería volver a la página principal", async function () {
  if (!page) throw new Error("Page no inicializada");
  const titulo = page.getByText(/portal del empleado/i);
  await titulo.waitFor({ state: 'visible', timeout: 15_000 });
  const exists = await titulo.isVisible();
  assert.ok(exists, "No se volvió a la página principal");
});

After(async function () {
  if (browser) {
    try { await browser.close(); } catch (e) { /* ignore */ }
    browser = undefined;
    page = undefined;
  }
});