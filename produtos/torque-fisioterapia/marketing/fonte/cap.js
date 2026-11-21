const {chromium}=require('playwright');
(async()=>{const D=__dirname;const b=await chromium.launch();
 const U='file:///home/user/edw/produtos/torque-fisioterapia/demo/index.html';
 const pg=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1.5});
 await pg.goto(U);await pg.waitForTimeout(800);await pg.fill('#lg-u','admin');await pg.fill('#lg-s','admin');await pg.click('.lg-b');await pg.waitForTimeout(400);
 // esconder faixas de demonstração/exemplo e botões flutuantes para telas limpas
 const tira=async(p)=>p.evaluate(()=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(n.nodeValue.includes('Exemplo · '))n.nodeValue=n.nodeValue.split('Exemplo · ').join('')}});const limpar=async()=>{await pg.addStyleTag({content:'.alert.demo,.banner,.fab{display:none!important}'});await tira(pg);await pg.evaluate(()=>window.scrollTo(0,0))};
 const shot=async(h,f,prep)=>{await pg.evaluate(h=>location.hash=h,h);await pg.waitForTimeout(500);if(prep)await prep();await limpar();await pg.waitForTimeout(250);await pg.screenshot({path:D+'/'+f})};
 await shot('inicio','s-painel.png');
 await shot('agenda','s-agenda.png',async()=>{await pg.evaluate(()=>{const c=document.getElementById('cal');if(c)c.scrollTop=0})});
 await shot('paciente-ex_p2','s-pront.png',async()=>{await pg.evaluate(()=>T.ui('pTab','linha'))});
 await shot('financeiro','s-fin.png');
 await shot('crm','s-crm.png');
 await shot('relatorios','s-rel.png');
 const m=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:3});
 await m.goto(U);await m.waitForTimeout(800);await m.fill('#lg-u','admin');await m.fill('#lg-s','admin');await m.click('.lg-b');await m.waitForTimeout(400);
 await m.addStyleTag({content:'.alert.demo,.banner,.fab{display:none!important}'});await m.evaluate(()=>location.hash='agenda');await m.waitForTimeout(600);await tira(m);await m.screenshot({path:D+'/s-mob.png'});
 await b.close();console.log('ok')})();
