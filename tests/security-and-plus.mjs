import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const listeners={};
const app={innerHTML:''};
const unsafe='<img src=x onerror=alert(1)>';
let downloaded=false;
let printed=false;
const seeded={
 entered:true,
 role:'organizer',
 user:{first:unsafe,last:'Тест',grade:'10А',bio:unsafe,skills:['ИТ'],interests:['Спорт']},
 opps:[{id:'o-unsafe',type:'EVENT" onclick="alert(1)',title:unsafe,description:'Тестовая активность',creator:'me',startsAt:new Date(Date.now()+86400000).toISOString(),location:'Спортзал',max:10,participants:5,joinPolicy:'OPEN',skills:['Спорт']}],
 saved:['o-unsafe'],
 applications:[],notifications:[],invites:[],reports:[],prefs:{projects:true,events:true}
};
const store={'project-s-demo-v1':JSON.stringify(seeded)};
const fakeEl=()=>({setAttribute(){},remove(){},click(){downloaded=true},style:{},elements:{}});
const ctx={
 window:{APP_CONFIG:{name:'Проект S',shortName:'S',demoSpace:'Демо-лицей'},scrollTo(){},print(){printed=true}},
 document:{title:'',body:{append(){}},createElement:fakeEl,querySelector(s){return s==='#app'?app:null},addEventListener(t,fn){listeners[t]=fn}},
 localStorage:{getItem(k){return store[k]??null},setItem(k,v){store[k]=v}},
 URL:{createObjectURL(){return 'blob:demo'},revokeObjectURL(){}},
 Blob:class{constructor(chunks){this.chunks=chunks}},
 console,Date,Math,crypto:{randomUUID:()=> 'uuid-test'},setTimeout:()=>0,clearTimeout:()=>{},confirm:()=>true
};
vm.runInNewContext(source,ctx,{filename:'app.js',timeout:2000});
assert.doesNotMatch(app.innerHTML,/<img src=x onerror=alert\(1\)>/);
assert.match(app.innerHTML,/&lt;img src=x onerror=alert\(1\)&gt;/);
const safeState=JSON.parse(store['project-s-demo-v1']);
function click(k,value){const btn={dataset:{[k]:value},matches:()=>false,closest(sel){if(sel==='button')return this;const key=sel.match(/^\[data-([^\]]+)\]$/)?.[1]?.replace(/-([a-z])/g,(_,x)=>x.toUpperCase());return key in this.dataset?this:null;}};listeners.click({target:btn});}
click('nav','explore');assert.match(app.innerHTML,/kind-project/);assert.doesNotMatch(app.innerHTML,/kind-EVENT"/);
click('nav','planner');assert.match(app.innerHTML,/Мой план/);assert.match(app.innerHTML,/Добавить в календарь/);
click('action','download-calendar');assert.equal(downloaded,true);
click('nav','plus');assert.match(app.innerHTML,/Меньше рутины/);
click('action','show-portfolio');assert.match(app.innerHTML,/ЛИЧНЫЙ ЧЕРНОВИК/);
click('action','print-portfolio');assert.equal(printed,true);
click('close','');click('nav','safety');assert.match(app.innerHTML,/Правила и безопасность/);
console.log('OK: escaped injection, safe type class, planner, calendar download, Plus, portfolio, print, rules.');
