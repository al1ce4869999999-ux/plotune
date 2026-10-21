const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(process.env.BASE_URL||'http://127.0.0.1:4173/',{waitUntil:'load'});
  await page.locator('#style').selectOption('handheld');
  await page.locator('#scene').fill('静かな森の中を歩き、遠くに光を見つける。');
  await assert.equal(await page.locator('#engineABMake').isVisible(),true);
  await page.locator('#engineABMake').click();
  await page.waitForFunction(()=>document.querySelector('#engineABOld')&&!document.querySelector('#engineABOld').disabled||document.querySelector('#engineABStatus')?.textContent.includes('エラー'),{timeout:60000});
  const message=await page.locator('#engineABStatus').innerText();
  assert.match(message,/新旧2曲完成/,message);
  assert.equal(await page.locator('#engineABNew').isEnabled(),true);
  await page.locator('#engineABOld').click();
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('従来エンジン')||document.querySelector('#status')?.textContent.includes('再生エラー'));
  assert.match(await page.locator('#status').innerText(),/従来エンジン/);
  await page.locator('#engineABNew').click();
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('新エンジン')||document.querySelector('#status')?.textContent.includes('再生エラー'));
  assert.match(await page.locator('#status').innerText(),/新エンジン/);
  await page.locator('#stop').click();
  assert.equal(errors.length,0,'Browser JS errors: '+errors.join('; '));
  console.log('Chromium E2E: both engine A/B arms generate and play successfully');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
