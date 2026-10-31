import {test,expect} from '@playwright/test';
test('kept demo messages remain available after a no-op quest',async({page})=>{
 await page.goto('/dashboard?demo=1');await page.getByRole('button',{name:'Inbox Kingdom',exact:true}).click();await page.getByRole('button',{name:'Scan & start quest'}).click();await page.getByRole('button',{name:'Approve quest & play'}).click();
 for(let i=0;i<6;i++)await page.getByRole('button',{name:'Keep Leave it as it is 3'}).click();
 await page.getByRole('button',{name:'Approve demo cleanup'}).click();await page.getByRole('button',{name:'Back to kingdom'}).click();await page.getByRole('button',{name:'Scan & start quest'}).click();
 await expect(page.getByRole('heading',{name:'Approve your quest scope'})).toBeVisible({timeout:4000});
});
test('corrupt persisted progress does not crash the workspace',async({page})=>{
 test.setTimeout(12000);
 await page.addInitScript(()=>localStorage.setItem('questos.v1.receipts',JSON.stringify([{id:'bad',mode:'demo',module:'inbox',status:'verified',title:{bad:true},count:1,xp:25,createdAt:'2026-10-31',detail:'bad'}])));
 await page.goto('/dashboard?demo=1');await page.getByRole('button',{name:'Achievements',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Progress worth celebrating.'})).toBeVisible();
});
