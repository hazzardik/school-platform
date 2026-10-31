import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const regionMatch=source.match(/const REGIONS_RU=(\[[^\n]+\]);/);
assert.ok(regionMatch,'The complete region dataset must be present');
const regions=JSON.parse(regionMatch[1]);
assert.equal(regions.length,89,'Russian legal reference must have 89 subjects');
assert.equal(new Set(regions).size,89,'No duplicated regions');
for(const name of ['Ставропольский край','Республика Татарстан','Москва','Севастополь','Донецкая Народная Республика','Луганская Народная Республика','Запорожская область','Херсонская область','Ямало-Ненецкий автономный округ'])assert.ok(regions.includes(name),name);

const listeners={},store={},root={attributes:{},setAttribute(k,v){this.attributes[k]=v;}},app={innerHTML:''};
let uid=0;
const ctx={
 window:{APP_CONFIG:{name:'Проект S',shortName:'S',demoSpace:'Демо-лицей',version:'0.5.0'},scrollTo(){},print(){}},
 document:{documentElement:root,title:'',body:{append(){}},createElement(){return {setAttribute(){},remove(){},click(){}}},querySelector(k){return k==='#app'?app:null;},addEventListener(k,fn){listeners[k]=fn;}},
 localStorage:{getItem(k){return store[k]??null},setItem(k,v){store[k]=v},removeItem(k){delete store[k]}},
 FormData:class{constructor(form){this.fields=Object.entries(form.fields)}entries(){return this.fields[Symbol.iterator]()}},
 console,Date,Math,crypto:{randomUUID(){return 'id-'+(++uid)}},setTimeout(){return 0},clearTimeout(){},confirm(){return true},
 Blob:class{},URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}}
};
vm.runInNewContext(source,ctx,{filename:'app.js',timeout:3000});
assert.match(app.innerHTML,/Субъект РФ/);
for(const region of regions)assert.ok(app.innerHTML.includes('value="'+region.replaceAll('&','&amp;')+'"'),'Region must be selectable: '+region);
assert.equal(root.attributes['data-theme'],'light');

function click(key,value){const button={dataset:{[key]:value},matches(){return false},getAttribute(){return null},closest(sel){if(sel==='button')return this;const k=sel.match(/^\[data-([^\]]+)\]$/)?.[1]?.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());return k in this.dataset?this:null;}};listeners.click({target:button});}
function submit(id,fields){listeners.submit({target:{id,fields},preventDefault(){}})}
function space(part){const key=Object.keys(store).find(k=>k.startsWith('project-s-school-v1:')&&k.includes(part));assert.ok(key,'Missing school: '+part);return JSON.parse(store[key]);}

click('themeChoice','dark');assert.equal(root.attributes['data-theme'],'dark');assert.equal(store['project-s-theme-v1'],'dark');
click('themeChoice','light');assert.equal(root.attributes['data-theme'],'light');
submit('join-school-form',{region:'Марс',city:'Москва',school:'Школа №1',grade:'7',letter:'А',role:'student'});
assert.match(app.innerHTML,/Субъект РФ/,'Unknown region rejected');
submit('join-school-form',{region:'Ставропольский край',city:'Невинномысск',school:'Лицей №6',grade:'10',letter:'Я',role:'student'});
assert.equal(space('лицей №6').role,'student');
click('modal','create');
assert.doesNotMatch(app.innerHTML,/<option value="EVENT"/,'Students must not see event option');
submit('create-form',{type:'EVENT',title:'Попытка создать событие',description:'Мероприятие для всех учеников школы',joinPolicy:'OPEN',max:20});
assert.equal(space('лицей №6').opps.some(o=>o.title==='Попытка создать событие'),false,'Forged student event must be denied');
submit('create-form',{type:'PROJECT',title:'Проект учеников',description:'Командная работа школьников над общим проектом',joinPolicy:'APPROVAL',max:20});
assert.equal(space('лицей №6').opps.some(o=>o.title==='Проект учеников'),true,'Student projects must work');
click('nav','settings');assert.match(app.innerHTML,/Светлая/);assert.match(app.innerHTML,/Тёмная/);
click('action','switch-school');
submit('join-school-form',{region:'Республика Татарстан',city:'Казань',school:'Гимназия №100',role:'teacher'});
assert.equal(space('гимназия №100').role,'teacher');
assert.equal(space('гимназия №100').user.grade,'Учитель');
click('modal','create');assert.match(app.innerHTML,/<option value="EVENT"/);
submit('create-form',{type:'EVENT',title:'Концерт школы',description:'Концерт с выступлениями школьных коллективов',joinPolicy:'OPEN',max:120});
assert.equal(space('гимназия №100').opps.some(o=>o.title==='Концерт школы'),true);
click('nav','profile');click('modal','edit-profile');assert.doesNotMatch(app.innerHTML,/name="gradeNumber"/);
click('nav','settings');click('action','switch-school');
submit('join-school-form',{region:'Ставропольский край',city:'Невинномысск',school:'Лицей №6',grade:'10',letter:'Я',role:'student'});
assert.equal(space('лицей №6').opps.some(o=>o.title==='Проект учеников'),true,'School A projects must remain isolated');
assert.equal(space('лицей №6').opps.some(o=>o.title==='Концерт школы'),false,'School B event must not leak into school A');
console.log('OK: all 89 regions, city validation, teacher-only events, student projects, school separation, dark/light theme, teacher profile.');
