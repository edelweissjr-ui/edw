// uso: node render.js h|v preview|full
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const D=__dirname,fmt=process.argv[2]||'h',mode=process.argv[3]||'preview',V=fmt==='v';
 const W=V?1080:1920,H=V?1920:1080,FPS=30,DUR=30;
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:1});
 await pg.goto('file://'+D+'/video.html'+(V?'?v=1':''));await pg.waitForLoadState('networkidle');await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(500);
 if(mode==='preview'){for(const t of [1.6,4.6,8.5,12.8,17.2,21.5,25.6,29]){await pg.evaluate(t=>apply(t),t);await pg.screenshot({path:`${D}/k-${fmt}-${t}.jpg`,type:'jpeg',quality:85})}}
 else{const dir=`${D}/frames-${fmt}`;fs.mkdirSync(dir,{recursive:true});const N=FPS*DUR;
  for(let i=0;i<N;i++){await pg.evaluate(t=>apply(t),i/FPS);await pg.screenshot({path:`${dir}/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:93});if(i%150===0)console.log(fmt,i)}}
 await b.close();console.log('ok')})();
