import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';


const auditEnabled = process.env.UX_AUDIT === '1';
const auditDir = path.resolve('ux-artifacts-v2');

async function auditShot(page: Page, info: TestInfo, name: string, fullPage = false) {
  if (!auditEnabled) return;
  await mkdir(auditDir, { recursive: true });
  await page.screenshot({
    path: path.join(auditDir, `${info.project.name}-${name}.png`),
    fullPage,
  });
}

async function reset(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('button', { name: '2분 취향 찾기' })).toBeVisible();
}

async function choose(page: Page, side: 'a' | 'b' = 'a') {
  const button = page.getByTestId(`choice-${side}`);
  await expect(button).toBeEnabled();
  await button.click();
  await page.waitForTimeout(205);
}

async function assertMobileQuality(page: Page) {
  const metrics = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    failedImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).length,
    smallButtons: [...document.querySelectorAll('button')]
      .filter((button) => {
        const style = getComputedStyle(button);
        const rect = button.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
      })
      .map((button) => ({ text: button.textContent?.trim(), width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })),
  }));
  expect(metrics.overflow).toBe(false);
  expect(metrics.failedImages).toBe(0);
  expect(metrics.smallButtons, JSON.stringify(metrics.smallButtons)).toEqual([]);
}

test.describe('Ring Pick v2 production-ready journey', () => {
  test('quick 18 + personalized 16 completes on every supported mobile engine', async ({ page }, info: TestInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => consoleErrors.push(error.message));
    await reset(page);
    await auditShot(page, info, '01-landing', true);
    await page.getByRole('button', { name: '2분 취향 찾기' }).click();
    await auditShot(page, info, '02-diagnostic');
    for (let index = 0; index < 18; index += 1) await choose(page, index % 3 === 0 ? 'b' : 'a');
    await expect(page.getByText('내 취향에 가까운')).toBeVisible();
    await auditShot(page, info, '03-personalized-tournament');
    for (let index = 0; index < 15; index += 1) await choose(page, index % 4 === 0 ? 'b' : 'a');
    await expect(page).toHaveURL(/\/result$/);
    await expect(page.getByText('내 웨딩밴드 취향은')).toBeVisible();
    await auditShot(page, info, '04-result-top');
    await auditShot(page, info, '05-result-full', true);
    await assertMobileQuality(page);
    await page.getByRole('button', { name: '착용 모습' }).click();
    await expect(page.getByAltText('내 취향 우승 웨딩밴드 착용 이미지')).toBeVisible();
    await auditShot(page, info, '06-result-worn');
    await page.getByRole('button', { name: '반지만' }).click();
    await expect(page.getByAltText('내 취향 우승 웨딩밴드 이미지')).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test('diagnostic refresh, undo, landing resume and zoom are safe', async ({ page }, info: TestInfo) => {
    test.skip(info.project.name !== 'mobile-390');
    await reset(page);
    await page.getByRole('button', { name: '2분 취향 찾기' }).click();
    for (let index = 0; index < 6; index += 1) await choose(page, index % 2 ? 'b' : 'a');
    await page.reload();
    await expect(page.locator('.header-title')).toContainText('취향 찾기 · 7/18');
    await page.getByRole('button', { name: '이전 선택으로 돌아가기' }).click();
    await expect(page.locator('.header-title')).toContainText('취향 찾기 · 6/18');
    await page.getByRole('button', { name: '위 반지 크게 보기' }).click();
    await expect(page.getByRole('dialog', { name: '반지 확대 보기' })).toBeVisible();
    await page.getByRole('button', { name: '확대 보기 닫기' }).click();
    await page.goto('/');
    await expect(page.getByRole('button', { name: '취향 찾기 이어서 하기' })).toBeVisible();
    await auditShot(page, info, '07-resume');
  });

  test('full mode records exactly 63 choices and survives a round-boundary undo', async ({ page }, info: TestInfo) => {
    test.skip(info.project.name !== 'mobile-390');
    await reset(page);
    await page.getByRole('button', { name: '64강으로 끝까지 고르기' }).click();
    await page.getByRole('button', { name: '64강 시작' }).click();
    await expect(page.locator('.header-title')).toContainText('64강 · 1/32');
    await auditShot(page, info, '08-full-64-start');
    for (let index = 0; index < 32; index += 1) await choose(page, index % 5 ? 'a' : 'b');
    await expect(page.locator('.header-title')).toContainText('32강 · 1/16');
    await page.getByRole('button', { name: '이전 선택으로 돌아가기' }).click();
    await expect(page.locator('.header-title')).toContainText('64강 · 32/32');
    await choose(page, 'a');
    for (let index = 32; index < 63; index += 1) await choose(page, index % 5 ? 'a' : 'b');
    await expect(page).toHaveURL(/\/result$/);
    await auditShot(page, info, '09-full-64-result', true);
    const historyLength = await page.evaluate(() => JSON.parse(localStorage.getItem('ringpick.session.v2') ?? '{}')?.tournament?.history?.length);
    expect(historyLength).toBe(63);
  });

  test('result copy, PNG export, share URL and malformed URL work', async ({ page, context }, info: TestInfo) => {
    test.skip(info.project.name !== 'mobile-390');
    await reset(page);
    await auditShot(page, info, '01-landing', true);
    await page.getByRole('button', { name: '2분 취향 찾기' }).click();
    await auditShot(page, info, '02-diagnostic');
    for (let index = 0; index < 18; index += 1) await choose(page, index % 3 === 0 ? 'b' : 'a');
    await expect(page.getByText('내 취향에 가까운')).toBeVisible();
    await auditShot(page, info, '03-personalized-tournament');
    for (let index = 0; index < 15; index += 1) await choose(page, index % 4 === 0 ? 'b' : 'a');
    await expect(page).toHaveURL(/\/result$/);
    await expect(page.getByText('내 웨딩밴드 취향은')).toBeVisible();
    await auditShot(page, info, '04-result-top');
    await auditShot(page, info, '05-result-full', true);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: '문장 복사' }).click();
    await expect(page.getByText('매장용 문장을 복사했어요.')).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '결과 이미지 저장' }).click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).toBeTruthy();
    await page.getByRole('button', { name: '링크 복사' }).click();
    const link = await page.evaluate(() => navigator.clipboard.readText());
    expect(link).toContain('/r/');
    await page.goto(link);
    await expect(page.getByText('공유받은 웨딩밴드 취향 결과예요')).toBeVisible();
    await page.goto('/r/broken-token');
    await expect(page.getByText('결과 링크를 열 수 없어요')).toBeVisible();
  });

  test('legacy v1 storage is isolated and explained', async ({ page }, info: TestInfo) => {
    test.skip(info.project.name !== 'mobile-390');
    await reset(page);
    await page.evaluate(() => localStorage.setItem('ringpick.session.v1', JSON.stringify({ schemaVersion: 1, result: { winnerId: 'R001' } })));
    await page.reload();
    await expect(page.getByText('웨딩밴드 기준으로 새로 바뀌었어요')).toBeVisible();
    await page.getByRole('link', { name: '자세히' }).click();
    await expect(page.getByText('이전 반지 결과와')).toBeVisible();
    await page.getByRole('button', { name: '새 웨딩밴드 테스트 시작' }).click();
    await expect(page.locator('.header-title')).toContainText('취향 찾기 · 1/18');
    expect(await page.evaluate(() => localStorage.getItem('ringpick.session.v1'))).toBeNull();
  });
});
