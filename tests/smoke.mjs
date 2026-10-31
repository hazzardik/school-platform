import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const listeners={};
const storage={};
const app={innerHTML:''};
const ctx={
 window:{APP_CONFIG:{name:'Проект S',shortName:'S',demoSpace:'Демо-лицей'},scrollTo(){}},
 document:{title:'',body:{append(){}},createElement(){return {setAttribute(){},remove(){}}},querySelector(s){return s==='#app'?app:null},addEventListener(n,fn){listeners[n]=fn}},
 localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v},
 console,Date,Math,crypto:{randomUUID:()=>`uid-${Math.random()}`},
 setTimeout:()=>0,clearTimeout:()=>{},confirm:()=>true,
 FormData:class{constructor(form){this.entriesData=Object.entries(form.fields)}entries(){return this.entriesData[Symbol.iterator]()}*[Symbol.iterator](){yield* this.entriesData}},
};
vm.runInNewContext(fs.readFileSync(new URL('../app.js',import.meta.url),'utf8'),ctx,{filename:'app.js'});
assert.match(app.innerHTML,/Я ученик/);
function click(key,value){const btn={dataset:{[key]:value},matches:()=>false,closest(selector){if(selector==='button')return this;const k=selector.match(/^\[data-([^\]]+)\]$/)?.[1];const camel=k?.replace(/-([a-z])/g,(_,x)=>x.toUpperCase());return camel in this.dataset?this:null;}};listeners.click({target:btn});}
function submit(id,fields){listeners.submit({target:{id,fields},preventDefault(){}})}
click('enter','student');assert.match(app.innerHTML,/Хорошие идеи/);
click('nav','explore');assert.match(app.innerHTML,/Найди своё/);
assert.match(app.innerHTML,/Турнир между классами/);
const seededId=JSON.parse(storage['project-s-demo-v1']).opps[0].id;
click('save',seededId);assert.equal(JSON.parse(storage['project-s-demo-v1']).saved.includes(seededId),true);
click('nav','saved');assert.match(app.innerHTML,/Сохранённое/);
click('nav','explore');
click('modal','create');assert.match(app.innerHTML,/Создать активность/);
submit('create-form',{type:'PROJECT',title:'Проект для теста',description:'Вместе делаем учебный продукт для нашей школы.',joinPolicy:'OPEN',skills:'Дизайн, ИТ',location:'Кабинет 10',max:'12'});
assert.match(app.innerHTML,/Проект для теста/);
click('nav','people');assert.match(app.innerHTML,/Алина Миронова/);
click('person','p1');assert.match(app.innerHTML,/Пригласить в мой проект/);
submit('invite-form',{oppId:JSON.parse(storage['project-s-demo-v1']).opps[0].id});
click('nav','mine');click('mineTab','invited');assert.match(app.innerHTML,/Приглашение отправлено/);
click('nav','profile');click('modal','edit-profile');submit('profile-form',{first:'Демо',last:'Пользователь',grade:'9А',bio:'В тесте',skills:'Веб, Дизайн',interests:'ИТ'});
assert.match(app.innerHTML,/Демо Пользователь/);
click('nav','notifications');assert.match(app.innerHTML,/Уведомления/);
console.log('OK: welcome, entrance, feed, opportunities, saves, creation, people, invitations, profile edit, notifications.');