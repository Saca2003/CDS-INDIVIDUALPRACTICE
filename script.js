"use strict";
// NovaCalc: analizador matemático propio, sin eval() ni dependencias externas.
const expressionEl=document.querySelector('#expression');
const resultEl=document.querySelector('#result');
const errorEl=document.querySelector('#error');
const keysEl=document.querySelector('#keys');
const modeEl=document.querySelector('#modeToggle');
let expression='';
let lastAnswer=0;
let degreeMode=true;
let justCalculated=false;
const visual=s=>s.replaceAll('*','×').replaceAll('/','÷').replaceAll('-','−').replaceAll('sqrt','√');
const format=n=>{if(!Number.isFinite(n))throw Error('Resultado fuera de rango');const fixed=Number(n.toPrecision(12));return String(fixed);};
function tokenize(src){
  const normalized=src.replaceAll('π','pi').replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-').replaceAll('√','sqrt');
  const tokens=[];const pattern=/\s*([0-9]+(?:\.[0-9]*)?|\.[0-9]+|[a-zA-Z]+|[()+\-*/^!%])\s*/gy;
  let index=0;
  while(index<normalized.length){pattern.lastIndex=index;const m=pattern.exec(normalized);if(!m)throw Error('Símbolo no reconocido');tokens.push(m[1]);index=pattern.lastIndex;}
  tokens.push('EOF');return tokens;
}
function calculate(src){
 const tokens=tokenize(src);let pos=0;
 const peek=()=>tokens[pos];const take=()=>tokens[pos++];
 function primary(){const t=take();
  if(t==='('){const n=add();if(take()!==')')throw Error('Falta cerrar paréntesis');return n;}
  if(t==='pi')return Math.PI;if(t==='e')return Math.E;
  if(/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(t))return Number(t);
  if(['sin','cos','tan','sqrt','log','ln','abs'].includes(t)){
    if(take()!=='(')throw Error('Se requieren paréntesis');const n=add();if(take()!==')')throw Error('Falta cerrar paréntesis');
    const rad=degreeMode?n*Math.PI/180:n;
    const map={sin:()=>Math.sin(rad),cos:()=>Math.cos(rad),tan:()=>{if(Math.abs(Math.cos(rad))<1e-12)throw Error('Tangente indefinida');return Math.tan(rad)},sqrt:()=>{if(n<0)throw Error('No existe raíz real negativa');return Math.sqrt(n)},log:()=>{if(n<=0)throw Error('Logaritmo requiere un positivo');return Math.log10(n)},ln:()=>{if(n<=0)throw Error('Logaritmo requiere un positivo');return Math.log(n)},abs:()=>Math.abs(n)};
    return map[t]();
  }
  throw Error('Expresión incompleta o inválida');
 }
 function postfix(){let n=primary();while(peek()==='!'||peek()==='%'){const t=take();if(t==='%'){n=n/100;continue;}if(!Number.isInteger(n)||n<0||n>170)throw Error('Factorial: entero entre 0 y 170');let r=1;for(let i=2;i<=n;i++)r*=i;n=r;}return n;}
 function unary(){if(peek()==='+'){take();return unary();}if(peek()==='-'){take();return -unary();}return power();}
 function power(){const n=postfix();if(peek()==='^'){take();return Math.pow(n,unary());}return n;}
 function multiply(){let n=unary();while(['*','/'].includes(peek())){const op=take(),r=unary();if(op==='/'&&r===0)throw Error('No se puede dividir entre cero');n=op==='*'?n*r:n/r;}return n;}
 function add(){let n=multiply();while(['+','-'].includes(peek())){const op=take(),r=multiply();n=op==='+'?n+r:n-r;}return n;}
 const value=add();if(peek()!=='EOF')throw Error('Revisa los operadores y paréntesis');if(!Number.isFinite(value))throw Error('Resultado fuera de rango');return value;
}
function refresh(){expressionEl.textContent=expression?visual(expression):'0';if(!expression){resultEl.textContent='0';errorEl.textContent='';return;}try{resultEl.textContent=format(calculate(expression));errorEl.textContent='';}catch(e){resultEl.textContent='…';errorEl.textContent='';}}
function append(value){if(justCalculated){if(/^[0-9.πa-z(]/.test(value))expression='';justCalculated=false;}expression+=value;refresh();}
function clearAll(){expression='';justCalculated=false;refresh();}
function backspace(){expression=expression.slice(0,-1);justCalculated=false;refresh();}
function equals(){if(!expression)return;try{const input=expression;const answer=calculate(expression);const rendered=format(answer);lastAnswer=answer;expression=rendered;justCalculated=true;refresh();onResult(input,rendered);}catch(e){errorEl.textContent=e.message;resultEl.textContent='Error';}}
function onResult(input,rendered){/* En una actualización se registra aquí el historial. */}
keysEl.addEventListener('click',ev=>{const btn=ev.target.closest('button');if(!btn)return;if(btn.dataset.value!==undefined)append(btn.dataset.value);if(btn.dataset.action==='clear')clearAll();if(btn.dataset.action==='backspace')backspace();if(btn.dataset.action==='equals')equals();});
modeEl.addEventListener('click',()=>{degreeMode=!degreeMode;modeEl.textContent=degreeMode?'DEG':'RAD';refresh();});
document.addEventListener('keydown',ev=>{if(ev.ctrlKey||ev.altKey||ev.metaKey||['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;const k=ev.key;if(/^[0-9.+\-*/^()%!]$/.test(k)&&k.length===1){ev.preventDefault();append(k);}else if(k==='Enter'||k==='='){ev.preventDefault();equals();}else if(k==='Backspace'){ev.preventDefault();backspace();}else if(k==='Escape'){ev.preventDefault();clearAll();}});
refresh();

// CAMBIO 1: tema claro/oscuro, guardado en el navegador.
const themeButton=document.querySelector('#themeToggle');
if(localStorage.getItem('novacalc-theme')==='light')document.body.classList.add('light');
function updateThemeLabel(){themeButton.textContent=document.body.classList.contains('light')?'☾ Tema oscuro':'☀ Tema claro';}
themeButton.addEventListener('click',()=>{document.body.classList.toggle('light');localStorage.setItem('novacalc-theme',document.body.classList.contains('light')?'light':'dark');updateThemeLabel();});
updateThemeLabel();
