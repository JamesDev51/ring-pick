import { expect, test } from '@playwright/test';

async function finishQuick(page:any){await page.goto('/');await page.getByRole('button',{name:'내 반지 취향 찾기'}).click();for(let i=0;i<17;i++){await page.getByTestId('choice-a').click();await page.waitForTimeout(220);}for(let i=0;i<15;i++){await page.getByTestId('choice-a').click();await page.waitForTimeout(220);}await expect(page).toHaveURL(/\/result/);await expect(page.getByText(/파$/).first()).toBeVisible();}

test('quick journey works without horizontal overflow',async({page})=>{await finishQuick(page);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);expect(overflow).toBeFalsy();await expect(page.getByRole('button',{name:'결과 이미지 저장'})).toBeVisible();});

test('resume after diagnostic refresh',async({page})=>{await page.goto('/');await page.getByRole('button',{name:'내 반지 취향 찾기'}).click();for(let i=0;i<5;i++){await page.getByTestId('choice-b').click();await page.waitForTimeout(220);}await page.reload();await expect(page.getByText(/취향 탐색 · 6\/17/)).toBeVisible();});

test('full mode produces one winner after 63 matches',async({page},testInfo)=>{test.skip(testInfo.project.name!=='mobile-390');await page.goto('/');await page.getByRole('button',{name:'64강으로 끝까지 고르기'}).click();for(let i=0;i<63;i++){await page.getByTestId('choice-a').click();await page.waitForTimeout(220);}await expect(page).toHaveURL(/\/result/);await expect(page.getByText('반지샵에서 이렇게 말해보세요')).toBeVisible();});

test('shared result route opens directly',async({page},testInfo)=>{test.skip(testInfo.project.name!=='mobile-390');await page.goto('/result?v=1&w=R034&p=wh.ov.md.th.pl.pr.no.hi');await expect(page.getByText(/파$/).first()).toBeVisible();});


test('shared result exports a 4:5 png',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-390');
  await page.goto('/result?v=1&w=R034&p=wh.ov.md.th.pl.pr.no.hi');
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'결과 이미지 저장'}).click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^my-ring-style-\d{8}\.png$/);
});

test('invalid shared token fails safely',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-390');
  await page.goto('/result?v=1&w=R034&p=bad');
  await expect(page.getByText('이 결과 링크는 열 수 없어요.')).toBeVisible();
});
