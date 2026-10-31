import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const appSource=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const directorySource=fs.readFileSync(new URL('../school-directory.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/school-directory\.js/);
assert.match(html,/media-src 'self' blob:/);

const listeners={},store={},app={innerHTML:''};
let id=0, downloads=0;
const root={attrs:{},setAttribute(k,v){this.attrs[k]=v;}};
const doc={
 title:'',documentElement:root,body:{append(){}},
 createElement(){return {setAttribute(){},remove(){},click(){downloads++},style:{}};},
 querySelector(q){return q==='#app'?app:null;},
 addEventListener(k,f){listeners[k]=f;}
};
const win={APP_CONFIG:{name:'Проект S',shortName:'S',version:'0.6.0',demoSpace:'Демо-лицей'},scrollTo(){},print(){},addEventListener(k,f){listeners['window:'+k]=f;}};
const ctx={
 window:win,document:doc,
 localStorage:{getItem(k){return store[k]??null},setItem(k,v){store[k]=v},removeItem(k){delete store[k]}},
 FormData:class{constructor(form){this.items=Object.entries(form.fields)}entries(){return this.items[Symbol.iterator]()}},
 console,crypto:{randomUUID(){return 'id-'+(++id)}},setTimeout(){return 0},clearTimeout(){},confirm(){return true},
 Blob:class{constructor(parts,meta){this.parts=parts;this.meta=meta;}},
 URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}}
};
vm.runInNewContext(directorySource,{window:win}, {filename:'school-directory.js'});
assert.equal(win.SCHOOL_DIRECTORY.schools['Ставропольский край|Невинномысск'].length,17);
vm.runInNewContext(appSource,ctx,{filename:'app.js',timeout:4000});
const click=(key,value)=>{const b={dataset:{[key]:value},matches(){return false},getAttribute(){return null},closest(sel){if(sel==='button')return this;const k=sel.match(/^\[data-([^\]]+)\]$/)?.[1]?.replace(/-([a-z])/g,(_,x)=>x.toUpperCase());return k in this.dataset?this:null;}};listeners.click({target:b})};
const submit=(id,fields)=>listeners.submit({target:{id,fields},preventDefault(){}});
function school(part){const key=Object.keys(store).find(x=>x.startsWith('project-s-school-v1:')&&x.includes(part));assert.ok(key,'school store '+part);return JSON.parse(store[key]);}

assert.match(app.innerHTML,/name="first"/);
assert.match(app.innerHTML,/signup-skills/);
assert.match(app.innerHTML,/school-suggestions/);
const onboardingBefore=app.innerHTML;
click('themeChoice','dark');
assert.equal(root.attrs['data-theme'],'dark');
assert.equal(app.innerHTML,onboardingBefore,'Theme switching must not destroy typed form DOM');
click('themeChoice','light');
submit('join-school-form',{region:'Ставропольский край',city:'Невинномысск',school:'Лицей №6',grade:'11',letter:'Я',role:'student',first:'Тест',last:'Демо',skills:'Python, Веб-разработка',interests:'ИТ, Спорт'});
assert.equal(school('лицей №6').user.first,'Тест');
assert.equal(school('лицей №6').user.last,'Демо');
assert.ok(school('лицей №6').user.skills.includes('Python'));
click('nav','chats');
assert.match(app.innerHTML,/Демонстрационный мессенджер/);
submit('chat-form',{message:'Это проверка переписки только в браузере'});
assert.match(app.innerHTML,/Это проверка переписки только в браузере/);
assert.equal(school('лицей №6').chatMessages.length,1);
click('chatRoom','projects');
assert.doesNotMatch(app.innerHTML,/Это проверка переписки только в браузере/);
click('nav','impact');assert.match(app.innerHTML,/Показать мой результат/);
click('action','impact-opt');assert.equal(school('лицей №6').impactOptIn,true);
click('nav','admin');assert.match(app.innerHTML,/Только демонстрация административной панели/);
click('adminDemo','plus');assert.equal(school('лицей №6').demoAdmin.plusGranted,true);
click('nav','plus');
assert.match(app.innerHTML,/Скачать обзор недели/);
click('action','weekly-brief');click('action','project-pack');
assert.equal(downloads,2,'Two useful Plus preview files should download');
click('nav','settings');click('action','switch-school');
submit('join-school-form',{region:'Республика Татарстан',city:'Казань',school:'Гимназия №100',grade:'9',letter:'А',role:'student'});
click('nav','chats');
assert.doesNotMatch(app.innerHTML,/Это проверка переписки только в браузере/,'School chats must not leak into other demo space');
assert.equal(school('гимназия №100').chatMessages.length,0);
console.log('OK: school directory, preserved form on theme change, sign-up profile, chats, school isolation, opt-in contributions, admin simulation, Plus downloads.');
