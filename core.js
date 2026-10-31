(function(root){
'use strict';
function parse(s){
 if(!s||typeof s.names!=='string'||typeof s.bans!=='string'||typeof s.pins!=='string')throw Error('备份或输入字段无效');
 if(s.names.length>2000||s.bans.length>5000||s.pins.length>1000)throw Error('输入过长');
 const names=s.names.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),n=names.length;
 if(n<2||n>16||n%2)throw Error('名单须为2–16个偶数成员；本工具不自动轮空');
 if(new Set(names).size!==n)throw Error('成员名称不能重复');
 if(names.some(x=>[...x].length>24))throw Error('每个名称最多24个字符');
 function edges(raw){const seen=new Set();return raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>{const m=line.match(/^(\d+)\s*-\s*(\d+)$/);if(!m)throw Error('约束每行写两个编号，例如1-2');let a=Number(m[1])-1,b=Number(m[2])-1;if(a<0||b<0||a>=n||b>=n||a===b)throw Error('约束编号须在名单内，且不能与自己配对');if(a>b)[a,b]=[b,a];const k=a+'-'+b;if(seen.has(k))throw Error('同一列表内有重复配对');seen.add(k);return[a,b];});}
 const bans=edges(s.bans),pins=edges(s.pins),used=new Set(),banSet=new Set(bans.map(x=>x.join('-')));
 for(const [a,b]of pins){if(used.has(a)||used.has(b))throw Error('一个成员只能锁定一位搭档');if(banSet.has(a+'-'+b))throw Error('锁定配对与回避规则冲突');used.add(a);used.add(b);}
 return{names,n,bans,pins};
}
function solve(s){const p=parse(s),{n,names,bans,pins}=p;const allowed=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i!==j));for(const[a,b]of bans)allowed[a][b]=allowed[b][a]=false;
 let rem=(1<<n)-1;for(const[a,b]of pins)rem&=~((1<<a)|(1<<b));const memo=new Map([[0,1]]);
 function count(mask){if(memo.has(mask))return memo.get(mask);const bit=mask&-mask,i=31-Math.clz32(bit),rest=mask^bit;let sum=0;for(let j=i+1;j<n;j++)if((rest&(1<<j))&&allowed[i][j])sum+=count(rest^(1<<j));memo.set(mask,sum);return sum;}
 const total=count(rem),pinSet=new Set(pins.map(x=>x.join('-'))),pairs=[];
 for(let a=0;a<n;a++)for(let b=a+1;b<n;b++){const locked=pinSet.has(a+'-'+b),both=(rem&(1<<a))&&(rem&(1<<b));const ways=locked?total:(both&&allowed[a][b]?count(rem^(1<<a)^(1<<b)):0);pairs.push({a,b,ways,locked,banned:!allowed[a][b],pct:total?ways/total*100:null});}
 const examples=[];function walk(mask,path){if(examples.length>=12)return;if(!mask){examples.push([...pins,...path].sort((a,b)=>a[0]-b[0]));return;}const bit=mask&-mask,i=31-Math.clz32(bit),rest=mask^bit;for(let j=i+1;j<n&&examples.length<12;j++)if((rest&(1<<j))&&allowed[i][j]&&count(rest^(1<<j)))walk(rest^(1<<j),[...path,[i,j]]);}
 if(total)walk(rem,[]);return{...p,total,pairs,examples};
}
const api={parse,solve};if(typeof module!=='undefined')module.exports=api;root.AppCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
