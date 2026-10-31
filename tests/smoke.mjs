import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const listeners={};
const storage={};
const app={innerHTML:''};
const ctx={
 window:{APP_CONFIG:{name:'Проект S',shortName:'S',demoSpace:'Демо-лицей',version:'0.4.0'},scrollTo(){},print(){}},
 document:{title:'',body:{append(){}},createElement(){return {setAttribute(){},remove(){},click(){}}},querySelector(s){return s==='#app'?app:null},addEventListener(n,fn){listeners[n]=fn}},
 localStorage:{getItem:k=>storage[k]??null,setItem(k,v){storage[k]=v},removeItem(k){delete storage[k]}},
 console,Date,Math,crypto:{randomUUID:()=> 'uid-'+Math.floor(Math.random()*1e12).toString(36)},
 setTimeout:()=>0,clearTimeout:()=>{},confirm:()=>true,
 FormData:class{constructor(form){this.entriesData=Object.entries(form.fields)}entries(){return this.entriesData[Symbol.iterator]()}},
 Blob:class{},URL:{createObjectURL:()=> 'blob:fake',revokeObjectURL(){}}
};
vm.runInNewContext(fs.readFileSync(new URL('../app.js',import.meta.url),'utf8'),ctx,{filename:'app.js'});
assert.match(app.innerHTML,/join-school-form/);
assert.match(app.innerHTML,/Буква класса/);
for(const grade of [7,8,9,10,11])assert.match(app.innerHTML,new RegExp('value="'+grade+'"'));
assert.match(app.innerHTML,/value="Я"/);
assert.match(app.innerHTML,/value="Ё"/);

function click(key,value){const btn={dataset:{[key]:value},matches:()=>false,closest(selector){if(selector==='button')return this;const k=selector.match(/^\[data-([^\]]+)\]$/)?.[1];const camel=k?.replace(/-([a-z])/g,(_,x)=>x.toUpperCase());return camel in this.dataset?this:null;}};listeners.click({target:btn});}
function submit(id,fields){listeners.submit({target:{id,fields},preventDefault(){}})}
function change(id,value){listeners.change({target:{id,value,matches:()=>false}})}
function schoolStore(prefix){const key=Object.keys(storage).find(k=>k.startsWith('project-s-school-v1:')&&k.includes(prefix));assert.ok(key,'Storage for '+prefix);return JSON.parse(storage[key]);}

submit('join-school-form',{region:'Ставропольский край',city:'Невинномысск',school:'Лицей №6',grade:'11',letter:'Я',role:'student'});
assert.match(app.innerHTML,/Лицей №6/);
assert.equal(schoolStore('лицей №6').user.grade,'11Я');
click('nav','explore');assert.match(app.innerHTML,/Турнир между классами/);
const firstId=schoolStore('лицей №6').opps[0].id;
click('save',firstId);assert.ok(schoolStore('лицей №6').saved.includes(firstId));
click('nav','people');assert.match(app.innerHTML,/Алина Миронова/);
change('grade-filter','11');assert.match(app.innerHTML,/Марк Егоров/);assert.doesNotMatch(app.innerHTML,/Алина Миронова/);
change('letter-filter','Я');assert.match(app.innerHTML,/Не нашли человека/);
change('letter-filter','ALL');change('grade-filter','ALL');
click('person','p1');assert.match(app.innerHTML,/Пригласить в мой проект/);
click('nav','explore');click('modal','create');
submit('create-form',{type:'PROJECT',title:'Проект только первого лицея',description:'Мы создаём проект, который должен остаться только в одной школе.',joinPolicy:'OPEN',skills:'ИТ',location:'Актовый зал',max:'12'});
assert.match(app.innerHTML,/Проект только первого лицея/);

click('nav','profile');click('modal','edit-profile');
submit('profile-form',{first:'Демо',last:'Пользователь',gradeNumber:'8',gradeLetter:'Д',bio:'Тестовый профиль',skills:'Веб',interests:'ИТ'});
assert.match(app.innerHTML,/Демо Пользователь/);
assert.equal(schoolStore('лицей №6').user.grade,'8Д');

click('nav','settings');click('action','switch-school');
assert.match(app.innerHTML,/join-school-form/);
assert.equal(storage['project-s-active-school-v1'],undefined);
submit('join-school-form',{region:'Республика Татарстан',city:'Казань',school:'Гимназия №100',grade:'7',letter:'Ё',role:'organizer'});
assert.match(app.innerHTML,/Гимназия №100/);
assert.equal(schoolStore('гимназия №100').user.grade,'7Ё');
click('nav','explore');assert.doesNotMatch(app.innerHTML,/Проект только первого лицея/);

click('nav','settings');click('action','switch-school');
submit('join-school-form',{region:'Ставропольский край',city:'Невинномысск',school:'Лицей №6',grade:'8',letter:'Д',role:'student'});
click('nav','explore');assert.match(app.innerHTML,/Проект только первого лицея/);
assert.equal(schoolStore('гимназия №100').user.grade,'7Ё');

click('nav','settings');click('action','switch-school');
submit('join-school-form',{region:'Москва',city:'Москва',school:'Школа №1',grade:'12',letter:'А',role:'student'});
assert.match(app.innerHTML,/join-school-form/);
submit('join-school-form',{region:'Москва',city:'Москва',school:'Школа №1',grade:'10',letter:'😀',role:'student'});
assert.match(app.innerHTML,/join-school-form/);
console.log('OK: onboarding, 7–11 Cyrillic class letters, people filters, first school activities, second school isolation, migration-safe profile, validation.');
