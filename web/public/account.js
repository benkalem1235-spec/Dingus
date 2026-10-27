const $=id=>document.getElementById(id);let signup=false,emailAvailable=false;
const parameters=new URLSearchParams(location.search);
const requested=parameters.get('next')||'/hub.html';
const next=/^\/(?:hub\.html|shop\.html|play)(?:\?|$)/.test(requested)?requested:'/hub.html';
const message=t=>$('account-message').textContent=t;
function mode(value){signup=value;$('email-field').hidden=!value;$('password').autocomplete=value?'new-password':'current-password';$('password').minLength=value?12:1;$('submit').textContent=value?'Register ↗':'Sign in ↗';$('email').disabled=!emailAvailable;$('login-tab').className=value?'secondary':'primary';$('signup-tab').className=value?'primary':'secondary';message('');}
async function api(action,body){const r=await fetch('/api/auth/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(d.error||'Request failed');return d;}
async function refresh(){try{const r=await fetch('/api/auth/me',{cache:'no-store'});if(!r.ok)throw Error();const d=await r.json();emailAvailable=d.emailAvailable;$('email').disabled=!emailAvailable;$('resend').hidden=!emailAvailable;$('email-hint').textContent=emailAvailable?'Verify your email before signing in.':'Email signup is disabled for now.';if(d.user)location.replace(next);}catch{message('Could not reach the host. Try again shortly.');}}
$('login-tab').onclick=()=>mode(false);$('signup-tab').onclick=()=>mode(true);
$('account-form').onsubmit=async e=>{e.preventDefault();if(window.self!==window.top){const u=new URL('/account.html',location.origin);u.searchParams.set('mode',signup?'signup':'login');u.searchParams.set('next',next);window.top.location.href=u.href;return;}$('submit').disabled=true;try{const d=await api(signup?'signup':'login',{username:$('username').value,password:$('password').value,email:signup?$('email').value:''});$('password').value='';if(d.verificationRequired){mode(false);message(d.message);}else location.replace(next);}catch(e){message(e.message);}finally{$('submit').disabled=false;}};
$('resend').onclick=async()=>{if(!$('username').value){message('Enter your name first.');return;}$('resend').disabled=true;try{message((await api('resend',{username:$('username').value})).message);}catch(e){message(e.message);}finally{$('resend').disabled=false;}};
if(parameters.get('mode')==='signup')mode(true);
if(parameters.has('verified'))message('Email verified. Sign in to continue.');refresh();
