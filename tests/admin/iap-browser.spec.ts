import {test,expect}from '@playwright/test';
const id='12345678-1234-4123-8123-123456789abc';

test('legacy financial pages visibly exclude Store totals even when their data is unavailable',async({page})=>{
 const unexpected:string[]=[];
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.pathname.startsWith('/v1/admin/')){
   const headers={'Access-Control-Allow-Origin':'http://127.0.0.1:34301','Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET','Access-Control-Allow-Headers':'content-type'};
   if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers});return;}
   if(u.pathname==='/v1/admin/auth/me'){
    const data={id,email:'operator@fixture.invalid',role:'SYSTEM_ADMIN',sessionId:id,expiresAt:new Date(Date.now()+3600000).toISOString(),capabilities:['read'],idleSeconds:900,absoluteSeconds:3600};
    await route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({data,meta:{requestId:id,asOf:new Date().toISOString(),version:'admin-v1',freshness:'repeatable_read'}})});
   }else if(u.pathname==='/v1/admin/meta'){
    const data={version:'admin-v1',role:'SYSTEM_ADMIN',plans:['free','personal','family','micro_pos'],segments:['household','store'],accountStatuses:['ACTIVE'],orderStatuses:['PAID'],financialStates:['PAID'],fulfillments:['GRANTED'],provenances:['REAL'],timezones:['UTC'],pageDefault:25,pageMax:100,readOnly:true,refundsAvailable:false,mfaAvailable:false};
    await route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify({data,meta:{requestId:id,asOf:new Date().toISOString(),version:'admin-v1',freshness:'repeatable_read'}})});
   }else await route.fulfill({status:503,headers,contentType:'application/json',body:JSON.stringify({error:{code:'ADMIN_UNAVAILABLE',message:'Offline data fixture',requestId:id,fields:[]}})});
   return;
  }
  if(u.hostname==='127.0.0.1'&&u.port==='34301'){await route.continue();return;}
  unexpected.push(u.origin);await route.abort();
 });
 for(const path of ['/bang-dieu-khien','/bang-dieu-khien/thanh-toan']){
  await page.goto(path);await expect(page.getByText(/chỉ.*legacy, không gồm Apple\/Google IAP/i).first()).toBeVisible();
 }
 expect(unexpected).toEqual([]);
});
test('local mocked admin UI separates unknown money, recovery and audited actions',async({page})=>{
 const writes:unknown[]=[];const unexpected:string[]=[];
 const env=(data:unknown)=>({data,meta:{requestId:id,asOf:new Date().toISOString(),version:'admin-v1',freshness:'repeatable_read'}});
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());const p=u.pathname;
  if(p.startsWith('/v1/admin/')){
   if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'http://127.0.0.1:34301','Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET,POST','Access-Control-Allow-Headers':'content-type,x-homemind-admin-csrf'}});return;}
   let data:unknown;
   if(p==='/v1/admin/auth/me')data={id,email:'operator@fixture.invalid',role:'SYSTEM_ADMIN',sessionId:id,expiresAt:new Date(Date.now()+3600000).toISOString(),capabilities:['read'],idleSeconds:900,absoluteSeconds:3600};
   else if(p==='/v1/admin/meta')data={version:'admin-v1',role:'SYSTEM_ADMIN',plans:['free','personal','family','micro_pos'],segments:['household','store'],accountStatuses:['ACTIVE'],orderStatuses:['PAID'],financialStates:['PAID'],fulfillments:['GRANTED'],provenances:['REAL'],timezones:['UTC'],pageDefault:25,pageMax:100,readOnly:true,refundsAvailable:false,mfaAvailable:false};
   else if(p==='/v1/admin/auth/csrf')data={csrfToken:'fixture-csrf',expiresIn:900};
   else if(p==='/v1/admin/iap/report')data={definition:'iap-recorded-gross-v1',groups:[{store:'APPLE',environment:'Sandbox',currency:'USD',kind:'SUBSCRIPTION',transactions:1,renewals:0,recordedGrossMilliunits:null,unknownAmountCount:1,conflictedTransactions:1}],creditUnits:{granted:100,used:1,revoked:0,reserved:1},recovery:{unresolvedFinancial:1},adjustments:[],netProceeds:null};
   else if(p==='/v1/admin/iap/cases')data={items:[{id,state:'ACTION_REQUIRED',reason:'MULTIPLE_PAID_SOURCES',financial_status:'UNRESOLVED',version:2}]};
   else if(p==='/v1/admin/iap/intake')data={items:[]};
   else if(p===`/v1/admin/iap/cases/${id}/actions`&&route.request().method()==='POST'){
    expect(route.request().headers()['x-homemind-admin-csrf']).toBe('fixture-csrf');writes.push(route.request().postDataJSON());data={id,state:'AWAITING_PROVIDER',financial_status:'UNRESOLVED',version:3};
   }else {unexpected.push(p);await route.abort();return;}
   await route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'http://127.0.0.1:34301','Access-Control-Allow-Credentials':'true'},body:JSON.stringify(env(data))});return;
  }
  if(u.hostname==='127.0.0.1'&&u.port==='34301'){await route.continue();return;}
  unexpected.push(u.origin);await route.abort();
 });
 await page.goto('/bang-dieu-khien/store-doi-soat');
 await expect(page.getByRole('heading',{name:'Store và đối soát',exact:true})).toBeVisible();
 await expect(page.getByText('USD',{exact:true})).toBeVisible();await expect(page.getByText('Chưa có nguồn',{exact:true})).toBeVisible();
 await expect(page.getByText(/phí, thuế, settlement và net proceeds chưa có nguồn/)).toBeVisible();
 await page.getByRole('button',{name:'Xem và xử lý'}).click();await page.getByLabel(/Lý do/).fill('Offline fixture: review provider evidence');
 await page.getByRole('button',{name:'Lưu quyết định',exact:true}).click();expect(writes).toHaveLength(0);
 await page.getByRole('dialog').getByRole('button',{name:'Xác nhận',exact:true}).click();
 await expect(page.getByRole('status').filter({hasText:'Chưa xác nhận Store hoàn tiền'})).toBeVisible();expect(writes).toHaveLength(1);expect(writes[0]).toMatchObject({expectedVersion:2,action:'RECHECK'});
 expect(unexpected).toEqual([]);
});
