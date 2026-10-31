'use strict';
const $=id=>document.getElementById(id),key='pair-possibilities-v1';
const demo={names:'青松\n白露\n长河\n冬青\n星野\n云帆',bans:'1-2\n3-4',pins:''};let result=null;
const raw=()=>({names:$('names').value,bans:$('bans').value,pins:$('pins').value});
function note(s){$('notice').textContent=s;}
function el(tag,txt,cls){const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;if(cls)n.className=cls;return n;}
function put(s){for(const id of ['names','bans','pins'])$(id).value=s[id];render();}
function render(){result=null;$('error').replaceChildren();$('numbers').textContent=$('names').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map((x,i)=>(i+1)+'. '+x).join('\n');
 try{result=AppCore.solve(raw());}catch(e){$('error').append(el('div',e.message,'error'));}
 for(const id of ['save','backup','csv','md','png'])$(id).disabled=!result;
 $('stats').replaceChildren();$('pairs').replaceChildren();$('examples').replaceChildren();$('previewNote').textContent='';
 const prev=Number($('member').value)||0;$('member').replaceChildren();
 if(!result){$('stats').append(el('p','请先修正输入'));$('next').textContent='输入有效后显示结果；旧结果已清除。';return;}
 const r=result;$('stats').append(el('small','当前完整配对'),el('strong',r.total.toLocaleString('en-US')+' 种'),el('p',r.n+'人 · '+r.bans.length+'条回避 · '+r.pins.length+'对锁定'));
 $('next').textContent=r.total?'选择成员检查搭档；点击“锁定这一对”可立即看剩余方案。解除锁定可回到上一组条件。':'没有可行完整配对。请检查回避或锁定；可清空锁定再对照。没有孤立成员也可能无解。';
 r.names.forEach((name,i)=>{const o=el('option',(i+1)+'. '+name);o.value=i;$('member').append(o);});$('member').value=String(Math.min(prev,r.n-1));renderPairs();
 $('previewNote').textContent=r.total?'展示前'+r.examples.length+'种 / 共'+r.total+'种；仅按编号排序。':'无解：不生成配对方案，占比不定义。可导出约束与无解报告。';
 r.examples.forEach((pairs,i)=>{const box=el('div',undefined,'example');box.append(el('h3','方案 '+(i+1)));for(const[a,b]of pairs){const row=el('div',undefined,'match');row.append(el('span',(a+1)+'. '+r.names[a]),el('i','—'),el('span',(b+1)+'. '+r.names[b]));box.append(row);}$('examples').append(box);});
}
function renderPairs(){const r=result;$('pairs').replaceChildren();if(!r)return;const who=Number($('member').value);for(const p of r.pairs.filter(p=>p.a===who||p.b===who)){const other=p.a===who?p.b:p.a,box=el('div',undefined,'pair'),head=el('div',undefined,'pair-head');head.append(el('strong',(other+1)+'. '+r.names[other],'pair-name'),el('span',r.total?p.ways+' / '+r.total+' · '+p.pct.toFixed(2)+'%':'占比未定义','pair-num'));const bar=el('div',undefined,'bar'),fill=el('span');fill.style.width=(p.pct||0)+'%';bar.append(fill);box.append(head,bar);if(p.locked)box.append(el('small','已锁定'));else if(p.banned)box.append(el('small','回避配对'));else if(!p.ways)box.append(el('small',r.total?'在当前约束下不能出现在完整方案中':'当前整体无解'));else{const button=el('button','锁定这一对');button.setAttribute('aria-label','锁定 '+r.names[p.a]+' 与 '+r.names[p.b]);button.onclick=()=>{$('pins').value=[$('pins').value.trim(),(p.a+1)+'-'+(p.b+1)].filter(Boolean).join('\n');render();note('已添加锁定，结果已重算；尚未保存。');};box.append(button);}$('pairs').append(box);}}
for(const id of ['names','bans','pins'])$(id).addEventListener('input',()=>{if(id==='names'){$('bans').value='';$('pins').value='';}render();note(id==='names'?'名单已改变，编号约束已清空；尚未保存。':'条件已更新；尚未保存。');});
$('member').onchange=renderPairs;
$('sample').onclick=()=>{put(demo);note('已载入虚构示例；尚未保存。');};
$('unpin').onclick=()=>{$('pins').value='';render();note('已清空锁定；尚未保存。');};
$('clearBans').onclick=()=>{$('bans').value='';render();note('已清空回避；尚未保存。');};
$('save').onclick=()=>{try{AppCore.parse(raw());localStorage.setItem(key,JSON.stringify(raw()));note('已保存到当前浏览器。');}catch(e){note('保存失败：'+e.message);}};
function download(data,name,type){const blob=data instanceof Blob?data:new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);note('已发起下载：'+name);}
$('backup').onclick=()=>download(JSON.stringify({format:key,data:raw()},null,2),'抽签可能性-备份.json','application/json');
$('import').onclick=()=>$('file').click();$('file').onchange=async()=>{const f=$('file').files[0];if(!f)return;try{if(f.size>30000)throw Error('备份超过30KB');const data=JSON.parse(await f.text());if(data.format!==key)throw Error('备份格式不匹配');AppCore.parse(data.data);put(data.data);note('备份已恢复；点击保存才会更新本机存档。');}catch(e){note('导入失败，当前输入未改动：'+e.message);}finally{$('file').value='';}};
function quote(v){let s=String(v);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
$('csv').onclick=()=>{if(!result)return;const r=result,rows=[['编号A','名称A','编号B','名称B','出现次数','完整方案总数','占比百分数','状态'],...r.pairs.map(p=>[p.a+1,r.names[p.a],p.b+1,r.names[p.b],p.ways,r.total,p.pct===null?'未定义':p.pct.toFixed(2),p.locked?'锁定':p.banned?'回避':p.ways?'可行':'不可行'])];download('\uFEFF'+rows.map(row=>row.map(quote).join(',')).join('\r\n'),'抽签可能性-逐对.csv','text/csv;charset=utf-8');};
function report(){const r=result;return '# 抽签可能性台\n\n当前完整配对：'+r.total+'种\n\n## 名单\n'+r.names.map((x,i)=>(i+1)+'. '+x).join('\n')+'\n\n## 回避编号\n'+(raw().bans||'无')+'\n\n## 锁定编号\n'+(raw().pins||'无')+'\n\n## 方案预览\n仅按编号展示前'+r.examples.length+'种，不是抽签。\n'+r.examples.map((ps,i)=>'\n### 方案'+(i+1)+'\n'+ps.map(([a,b])=>'- '+(a+1)+'. '+r.names[a]+' — '+(b+1)+'. '+r.names[b]).join('\n')).join('\n')+'\n\n## 口径\n每人恰出现一次，配对无顺序。占比假设所有符合约束的完整方案等可能；不代表依次抽球流程，不代表真实赛事或胜率。百分比取两位，准确分子分母见CSV。无解时占比未定义。\n';}
$('md').onclick=()=>{if(result)download(report(),'抽签可能性-报告.md','text/markdown;charset=utf-8');};
$('png').onclick=()=>{if(!result)return;const r=result,c=document.createElement('canvas');c.width=1080;c.height=1350;const g=c.getContext('2d');g.fillStyle='#f1f3ef';g.fillRect(0,0,1080,1350);g.fillStyle='#244e43';g.fillRect(0,0,1080,315);function text(s,x,y,size=28,color='#243e3c'){g.font='500 '+size+'px system-ui';g.fillStyle=color;g.fillText(s,x,y);}text('抽签可能性台',60,75,46,'#fff');text('当前完整配对',60,135,26,'#c8e0d3');text(r.total.toLocaleString('en-US')+' 种',60,218,68,'#fff');text(r.n+'人 · '+r.bans.length+'条回避 · '+r.pins.length+'对锁定',60,278,26,'#c8e0d3');text(r.total?'编号顺序的首个方案（不是随机抽签）':'没有可行完整配对',60,375,30);function wrap(s,x,y){let line='',dy=0;for(const ch of [...s]){if(g.measureText(line+ch).width>405){text(line,x,y+dy,27);line='';dy+=38;}line+=ch;}text(line,x,y+dy,27);}
 if(r.total)r.examples[0].forEach(([a,b],i)=>{const y=438+i*92;g.fillStyle='#e2eae1';g.fillRect(45,y-35,990,86);g.font='500 27px system-ui';wrap((a+1)+'. '+r.names[a],65,y);wrap((b+1)+'. '+r.names[b],585,y);text('—',520,y,28);});else{text('检查回避和锁定规则，再重新计算。',60,460,30);text('无解时占比未定义，不产生方案。',60,515,28);}
 text('仅基于填入的约束；所有完整方案等可能为占比假设。',60,1235,25);text('不代表真实赛事概率或胜率。完整计数见CSV。',60,1280,25);c.toBlob(blob=>{if(blob)download(blob,'抽签可能性-摘要.png','image/png');else note('图片生成失败，请重试。');},'image/png');};
try{const saved=localStorage.getItem(key);if(saved){const data=JSON.parse(saved);AppCore.parse(data);put(data);note('已恢复本机保存的规则。');}else put(demo);}catch(e){put(demo);note('本机存档不可用，已载入示例。');}
