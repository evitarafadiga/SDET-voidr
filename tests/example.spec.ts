import { test, expect } from "@playwright/test";
import path from "path";
import { chromium } from 'playwright';

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

test("has title", async ({ page }) => {
  await page.goto("https://www.saucedemo.com/");

  await expect(page).toHaveTitle(/Swag Labs/);
});

test("auth", async ({ page }) => {
  await page.goto("https://www.saucedemo.com/");

  await page.locator('[data-test="username"]').fill("standard_user");
  await page.locator('[data-test="password"]').fill("secret_sauce");

  await page.locator('[data-test="login-button"]').click();

  await expect(await page.url()).toBe(
    "https://www.saucedemo.com/inventory.html"
  );

  const buttonTitle = await page.locator(".inventory_item_price").nth(0);

  await expect(buttonTitle).toHaveText("$29.99");

  await page.context().storageState({ path: authFile });
});

test("incorrect auth", async ({ page }) => {
  await page.goto("https://www.saucedemo.com/");

  await page.locator('[data-test="username"]').fill("incorrect_user");
  await page.locator('[data-test="password"]').fill("incorrect_sauce");

  await page.locator('[data-test="login-button"]').click();

  await expect(await page.url()).toBe("https://www.saucedemo.com/");

  await page.context().storageState({ path: authFile });
});

test("sql injection auth", async ({ page }) => {
  await page.goto("https://www.saucedemo.com/");

  await page.locator('[data-test="username"]').fill("standard_user'--");
  await page.locator('[data-test="password"]').fill("secret_sauce'--");

  await page.locator('[data-test="login-button"]').click();

  await expect(await page.url()).toBe("https://www.saucedemo.com/");

  await page.context().storageState({ path: authFile });
});

test("add to cart", async ({ page }) => {
  await page.goto("https://www.saucedemo.com/");

  await page.locator('[data-test="username"]').fill("standard_user");
  await page.locator('[data-test="password"]').fill("secret_sauce");

  await page.locator('[data-test="login-button"]').click();

  await expect(await page.url()).toBe(
    "https://www.saucedemo.com/inventory.html"
  );

  const buttonTitle = await page.locator(".inventory_item_price").nth(0);

  await expect(buttonTitle).toHaveText("$29.99");

  await page.context().storageState({ path: authFile });

  await page
    .locator('[data-test="add-to-cart-sauce-labs-backpack"]')
    .click({ timeout: 15_000 });

  await page
    .locator('[data-test="shopping-cart-link"]')
    .click({ timeout: 15_000 });

  const cartQuantity = await page.locator(".cart_quantity").nth(0);
  await expect(cartQuantity).toHaveText("1");

  await expect(await page.url()).toBe("https://www.saucedemo.com/cart.html");
});

test("add then remove from cart", async ({ page }) => {
  await page.goto("https://www.saucedemo.com/");

  await page.locator('[data-test="username"]').fill("standard_user");
  await page.locator('[data-test="password"]').fill("secret_sauce");

  await page.locator('[data-test="login-button"]').click();

  await expect(await page.url()).toBe(
    "https://www.saucedemo.com/inventory.html"
  );

  const buttonTitle = await page.locator(".inventory_item_price").nth(0);

  await expect(buttonTitle).toHaveText("$29.99");

  await page.context().storageState({ path: authFile });

  await page
    .locator('[data-test="add-to-cart-sauce-labs-backpack"]')
    .click({ timeout: 15_000 });

  await page
    .locator('[data-test="shopping-cart-link"]')
    .click({ timeout: 15_000 });

  const cartQuantity = await page.locator(".cart_quantity").nth(0);
  await expect(cartQuantity).toHaveText("1");

  await page
    .locator('[data-test="remove-sauce-labs-backpack"]')
    .click({ timeout: 15_000 });

  const removedCartItem = await page.locator(".removed_cart_item").nth(0);

  await expect(cartQuantity).toHaveCount(0);
  await expect(removedCartItem).toHaveCount(1);

  await expect(await page.url()).toBe("https://www.saucedemo.com/cart.html");
});

test("add all products with regExp", async ({ page }) => {
  await page.goto("https://www.saucedemo.com/");

  await page.locator('[data-test="username"]').fill("standard_user");
  await page.locator('[data-test="password"]').fill("secret_sauce");

  await page.locator('[data-test="login-button"]').click();

  await expect(await page.url()).toBe(
    "https://www.saucedemo.com/inventory.html"
  );

  await page.context().storageState({ path: authFile });

  let i = 0;
  while (i < (await page.locator('[data-test^="add-to-cart-"]').count())) {
    await page
      .locator('[data-test^="add-to-cart-"]')
      .nth(i)
      .click({ timeout: 8_000 });
    console.debug("%ctestsexample.spec.ts:134 i", "color: #007acc;", i);
    i++;
  }

  const cartBadge = await page.locator(".shopping_cart_link > span");
  await expect(cartBadge).toHaveText(
    (await page.locator('[data-test^="add-to-cart-"]').count()).toString(),
    { timeout: 8_000 }
  );
});

test("sum all products values with regExp", async ({ page }) => {
  await page.goto("https://www.saucedemo.com/");

  await page.locator('[data-test="username"]').fill("standard_user");
  await page.locator('[data-test="password"]').fill("secret_sauce");

  await page.locator('[data-test="login-button"]').click();

  await expect(await page.url()).toBe(
    "https://www.saucedemo.com/inventory.html"
  );

  await page.context().storageState({ path: authFile });

  let sum = 0;
  let i = 0;
  while (
    i < (await page.locator('[data-test^="inventory-item-price"]').count())
  ) {
    await page
      .locator('[data-test^="inventory-item-price"]')
      .nth(i)
      .click({ timeout: 8_000 });

    const buttonTitle = await page.locator(".inventory_item_price").nth(i);
    sum += parseFloat(
      (await !buttonTitle.textContent()).toString().replace("$", "")
    );
    i++;
  }
});

test("get cookies", async ({ page }) => {

  let cookies = [];
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto('https://www.saucedemo.com/');

    await page.locator('[data-test="username"]').fill("standard_user");
    await page.locator('[data-test="password"]').fill("secret_sauce");
  
    await page.locator('[data-test="login-button"]').click();

    const cookies = await context.cookies();
    console.log('Cookies after logging in:', cookies);

  } catch (err) {
    await browser.close();
    throw new Error(err.message);
  
  } 
  console.log('%ctests\example.spec.ts:213 cookies', 'color: #007acc;', cookies);  
});

test("log out", async ({ page }) => {
  await page.goto("https://www.saucedemo.com/");

  await page.locator('[data-test="username"]').fill("standard_user");
  await page.locator('[data-test="password"]').fill("secret_sauce");

  await page.locator('[data-test="login-button"]').click();

  await expect(await page.url()).toBe(
    "https://www.saucedemo.com/inventory.html"
  );

  await page.locator('.bm-burger-button > button').click();

  await page.locator('[data-test=logout-sidebar-link]').click();
});

