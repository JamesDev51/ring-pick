import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const runUx = process.env.UX_AUDIT === '1';
const artifactRoot = path.resolve('ux-artifacts');

type Metric = {
  project: string;
  viewport: { width: number; height: number } | null;
  landingScrollHeight?: number;
  resultScrollHeight?: number;
  minButtonHeight?: number;
  minButtonWidth?: number;
  overflow?: boolean;
  failedImages?: number;
  consoleErrors?: string[];
  quickElapsedMs?: number;
  fullElapsedMs?: number;
  downloadBytes?: number;
};

async function snap(page: Page, info: TestInfo, name: string, fullPage = false) {
  await mkdir(artifactRoot, { recursive: true });
  await page.screenshot({
    path: path.join(artifactRoot, `${info.project.name}-${name}.png`),
    fullPage,
    animations: 'disabled',
  });
}

async function pageMetrics(page: Page) {
  return page.evaluate(() => {
    const buttons = [...document.querySelectorAll('button')].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    const sizes = buttons.map((el) => {
      const r = el.getBoundingClientRect();
      return { width: r.width, height: r.height, text: el.textContent?.trim() ?? '' };
    });
    const failedImages = [...document.images].filter((img) => img.complete && img.naturalWidth === 0).length;
    return {
      scrollHeight: document.documentElement.scrollHeight,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      minButtonHeight: sizes.length ? Math.min(...sizes.map((x) => x.height)) : 0,
      minButtonWidth: sizes.length ? Math.min(...sizes.map((x) => x.width)) : 0,
      failedImages,
      buttons: sizes,
    };
  });
}

async function clearState(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

async function completeQuick(page: Page, info: TestInfo) {
  const started = Date.now();
  await page.getByRole('button', { name: '내 반지 취향 찾기' }).click();
  await expect(page.getByText('취향 탐색 · 1/17')).toBeVisible();
  await snap(page, info, '02-diagnostic-q1');

  for (let i = 0; i < 17; i += 1) {
    if (i === 5) {
      await page.getByRole('button', { name: /비슷해요|모르겠어요|둘 다/ }).click();
    } else if (i % 2 === 0) {
      await page.getByTestId('choice-a').click();
    } else {
      await page.getByTestId('choice-b').click();
    }
    await page.waitForTimeout(230);
    if (i === 7) await snap(page, info, '03-diagnostic-mid');
  }

  await expect(page.getByText(/16강 · 1\/8/)).toBeVisible();
  await snap(page, info, '04-quick-16');

  let lastRound = 16;
  for (let i = 0; i < 15; i += 1) {
    const header = (await page.locator('.header-title').textContent()) ?? '';
    const round = Number(header.match(/(\d+)강/)?.[1] ?? lastRound);
    if (round !== lastRound) {
      lastRound = round;
      await snap(page, info, `05-round-${round}`);
    }
    await (i % 3 === 0 ? page.getByTestId('choice-b') : page.getByTestId('choice-a')).click();
    await page.waitForTimeout(230);
  }

  await expect(page).toHaveURL(/\/result/);
  await expect(page.getByText('반지샵에서 이렇게 말해보세요')).toBeVisible();
  return Date.now() - started;
}

test.describe('production UX audit', () => {
  test.skip(!runUx, 'UX_AUDIT=1에서만 production audit 실행');

  test('complete mobile user journey and collect visual/interaction metrics', async ({ page, context }, testInfo) => {
    await mkdir(artifactRoot, { recursive: true });
    const metric: Metric = {
      project: testInfo.project.name,
      viewport: page.viewportSize(),
      consoleErrors: [],
    };
    page.on('console', (msg) => {
      if (msg.type() === 'error') metric.consoleErrors?.push(msg.text());
    });
    page.on('pageerror', (error) => metric.consoleErrors?.push(`pageerror: ${error.message}`));

    await clearState(page);
    await expect(page.getByRole('heading', { name: /내 취향부터/ })).toBeVisible();
    await snap(page, testInfo, '01-landing', true);
    const landing = await pageMetrics(page);
    metric.landingScrollHeight = landing.scrollHeight;
    metric.overflow = landing.overflow;
    metric.failedImages = landing.failedImages;
    expect(landing.overflow).toBeFalsy();
    expect(landing.failedImages).toBe(0);

    const privacy = page.getByRole('link', { name: '개인정보 및 이용 안내' });
    await expect(privacy).toBeVisible();
    await privacy.click();
    await expect(page).toHaveURL(/\/privacy/);
    await snap(page, testInfo, '01b-privacy');
    await page.goBack();

    metric.quickElapsedMs = await completeQuick(page, testInfo);
    await snap(page, testInfo, '06-result-top');
    await snap(page, testInfo, '07-result-full', true);

    const resultMetric = await pageMetrics(page);
    metric.resultScrollHeight = resultMetric.scrollHeight;
    metric.minButtonHeight = resultMetric.minButtonHeight;
    metric.minButtonWidth = resultMetric.minButtonWidth;
    metric.overflow = metric.overflow || resultMetric.overflow;
    metric.failedImages = (metric.failedImages ?? 0) + resultMetric.failedImages;
    expect(resultMetric.overflow).toBeFalsy();
    expect(resultMetric.failedImages).toBe(0);

    await page.getByRole('button', { name: '착용 모습' }).click();
    await expect(page.getByAltText('내 취향 우승 반지 착용 이미지')).toBeVisible();
    await snap(page, testInfo, '08-result-worn');
    await page.getByRole('button', { name: '반지만' }).click();

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('button', { name: '문장 복사' }).click();
    await expect(page.getByText('매장용 문장을 복사했어요.')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '결과 이미지 저장' }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    if (downloadPath) {
      const { size } = await import('node:fs/promises').then((fs) => fs.stat(downloadPath));
      metric.downloadBytes = size;
      expect(size).toBeGreaterThan(20_000);
    }

    await page.getByRole('button', { name: '다시 취향 찾기' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await snap(page, testInfo, '09-restart-sheet');
    await page.getByRole('button', { name: '취소' }).click();

    const allVisibleButtonSizes = await page.evaluate(() => [...document.querySelectorAll('button')]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({ width: r.width, height: r.height })));
    const tooSmall = allVisibleButtonSizes.filter((r) => r.height < 44 || r.width < 44);
    expect(tooSmall, `44px 미만 터치 타깃: ${JSON.stringify(tooSmall)}`).toEqual([]);

    expect(metric.consoleErrors, `console errors: ${metric.consoleErrors?.join('\n')}`).toEqual([]);
    await writeFile(path.join(artifactRoot, `${testInfo.project.name}-metrics.json`), JSON.stringify(metric, null, 2));
  });

  test('back, refresh and resume behavior feels safe', async ({ page }, testInfo) => {
    await clearState(page);
    await page.getByRole('button', { name: '내 반지 취향 찾기' }).click();
    for (let i = 0; i < 6; i += 1) {
      await page.getByTestId(i % 2 ? 'choice-a' : 'choice-b').click();
      await page.waitForTimeout(230);
    }
    await page.reload();
    await expect(page.getByText('취향 탐색 · 7/17')).toBeVisible();
    await page.getByRole('button', { name: '이전 선택으로 돌아가기' }).click();
    await expect(page.getByText('취향 탐색 · 6/17')).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: /이어서 하기/ })).toBeVisible();
    await snap(page, testInfo, '10-resume-landing');
  });

  test('64-round mode remains understandable through 63 real taps', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-390');
    await clearState(page);
    const started = Date.now();
    await page.getByRole('button', { name: '64강으로 끝까지 고르기' }).click();
    await expect(page.getByText(/64강 · 1\/32/)).toBeVisible();
    await snap(page, testInfo, '11-full-64-start');
    for (let i = 0; i < 63; i += 1) {
      await (i % 4 === 0 ? page.getByTestId('choice-b') : page.getByTestId('choice-a')).click();
      await page.waitForTimeout(230);
      if (i === 31) await snap(page, testInfo, '12-full-32-start');
      if (i === 47) await snap(page, testInfo, '13-full-16-start');
      if (i === 61) await snap(page, testInfo, '14-full-final');
    }
    await expect(page).toHaveURL(/\/result/);
    const fullElapsedMs = Date.now() - started;
    await writeFile(path.join(artifactRoot, `${testInfo.project.name}-full-mode.json`), JSON.stringify({ fullElapsedMs }, null, 2));
  });
});
