import fs from 'node:fs';
import path from 'node:path';
import {randomBytes,createHash,scrypt as derive,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(derive), hash=v=>createHash('sha256').update(v).digest('hex');
const duration=7*86400000;
export function createAuth({directory='/accounts',env=process.env,sendEmail,now=Date.now}={}){
 fs.mkdirSync(directory,{recursive:true,mode:0o700});const filename=path.join(directory,'accounts.json');
 const db=fs.existsSync(filename)?JSON.parse(fs.readFileSync(filename,'utf8')):{users:[],sessions:[]};
 const save=()=>{fs.writeFileSync(filename+'.tmp',JSON.stringify(db),{mode:0o600});fs.renameSync(filename+'.tmp',filename);};
 const mailReady=!!(sendEmail||(env.EMAIL_API_KEY&&env.EMAIL_FROM&&env.ACCOUNT_PUBLIC_URL?.startsWith('https://')));
 const send=sendEmail||(async(email,token)=>{
  const url=new URL('/api/auth/verify',env.ACCOUNT_PUBLIC_URL);url.searchParams.set('token',token);
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.EMAIL_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:env.EMAIL_FROM,to:[email],subject:'Verify your Dingus account',text:'Verify your email to activate your account:\n'+url.href+'\nThis link expires in 30 minutes. If you did not request this account, ignore this email.'}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error('Email delivery failed');
 });
 const publicUser=u=>({username:u.username,emailVerified:!!u.email&&u.verified,hasEmail:!!u.email});
 const session=req=>{const token=String(req.headers.cookie||'').match(/(?:^|;\s*)dingus_session=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)return null;const s=db.sessions.find(s=>s.hash===hash(token)&&s.expires>now());return s?db.users.find(u=>u.id===s.user&&(!u.email||u.verified)):null;};
 const cookie=(req,res,token='',age=0)=>{const secure=!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(req.headers.host||'');res.setHeader('Set-Cookie',`dingus_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure?'; Secure':''}`);};
 const start=(req,res,u)=>{const token=randomBytes(32).toString('hex');db.sessions=db.sessions.filter(s=>s.expires>now());db.sessions.push({hash:hash(token),user:u.id,expires:now()+duration});save();cookie(req,res,token,duration/1000);};
 const reply=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 const rates=new Map();let busy=0;
 const read=async req=>{let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>4096)throw Error('Request too large');}try{return JSON.parse(text);}catch{throw Error('Invalid request');}};
 const handler=async(req,res,p,u)=>{
  if(!p.startsWith('/api/auth/'))return false;
  if(p==='/api/auth/me'&&req.method==='GET'){reply(res,200,{user:session(req)?publicUser(session(req)):null,emailAvailable:mailReady});return true;}
  if(p==='/api/auth/verify'&&req.method==='GET'){
   const token=u.searchParams.get('token')||'';const user=/^[a-f0-9]{64}$/.test(token)&&db.users.find(v=>v.verification===hash(token)&&v.verifyExpires>now());
   if(!user){reply(res,400,{error:'Verification link is invalid or expired. Request another link from the account page.'});return true;}
   user.verified=true;delete user.verification;delete user.verifyExpires;save();res.writeHead(303,{Location:'/account.html?verified=1','Cache-Control':'no-store','Referrer-Policy':'no-referrer'});res.end();return true;
  }
  if(req.method!=='POST'){reply(res,405,{error:'Method not allowed'});return true;}
  if(![`https://${req.headers.host}`,`http://${req.headers.host}`].includes(req.headers.origin)||!String(req.headers['content-type']).startsWith('application/json')){reply(res,403,{error:'Request origin rejected'});return true;}
  const ip=req.socket.remoteAddress;const time=now();for(const [key,value]of rates)if(time-value.start>900000)rates.delete(key);
  let rate=rates.get(ip);if(!rate){rate={start:time,count:0};rates.set(ip,rate);}if(++rate.count>30||rates.size>10000||busy>=4){reply(res,429,{error:'Too many attempts. Please try again later.'});return true;}
  busy++;
  try{
   const body=await read(req);const name=String(body.username||'').trim(),key=name.toLowerCase(),password=body.password;
   if(p==='/api/auth/logout'){
    const token=String(req.headers.cookie||'').match(/dingus_session=([a-f0-9]{64})/)?.[1];db.sessions=db.sessions.filter(s=>s.hash!==hash(token||''));save();cookie(req,res);reply(res,200,{ok:true});return true;
   }
   if(p==='/api/auth/signup'){
    if(!/^[a-zA-Z0-9_]{3,24}$/.test(name))throw Error('Use 3–24 letters, numbers or underscores for your name.');
    if(typeof password!=='string'||password.length<12||password.length>128)throw Error('Use a password of 12–128 characters.');
    const email=String(body.email||'').trim().toLowerCase();if(email&&(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))throw Error('Enter a valid email address, or leave it blank.');
    if(email&&!mailReady){reply(res,503,{error:'Email signup is not configured yet. Leave email blank to create an account.'});return true;}
    if(db.users.some(u=>u.key===key||(email&&u.email===email)))throw Error('That username or email is already registered.');
    const salt=randomBytes(16).toString('hex'),digest=Buffer.from(await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024})).toString('hex');
    // Check again after the asynchronous password hash to prevent concurrent duplicate accounts.
    if(db.users.some(u=>u.key===key||(email&&u.email===email)))throw Error('That username or email is already registered.');
    const user={id:randomBytes(16).toString('hex'),key,username:name,salt,digest,email,verified:false};
    if(email){const token=randomBytes(32).toString('hex');user.verification=hash(token);user.verifyExpires=now()+1800000;await send(email,token);}
    if(db.users.some(u=>u.key===key||(email&&u.email===email)))throw Error('That username or email is already registered.');
    db.users.push(user);save();if(!email)start(req,res,user);
    reply(res,201,email?{verificationRequired:true,message:'Check your inbox and verify your email before signing in.'}:{user:publicUser(user)});return true;
   }
   if(p==='/api/auth/login'){
    if(typeof password!=='string'||password.length>128)throw Error('Invalid username or password.');
    const user=db.users.find(u=>u.key===key);const digest=Buffer.from(await scrypt(password,user?.salt||'missing-account-salt',64,{N:32768,r:8,p:1,maxmem:64*1024*1024}));
    if(!user||!timingSafeEqual(digest,Buffer.from(user.digest,'hex')))throw Error('Invalid username or password.');
    if(user.email&&!user.verified){reply(res,403,{error:'Verify your email before signing in.',verificationRequired:true});return true;}
    start(req,res,user);reply(res,200,{user:publicUser(user)});return true;
   }
   if(p==='/api/auth/resend'){
    if(!mailReady){reply(res,503,{error:'Email delivery is not configured.'});return true;}
    const user=db.users.find(v=>v.key===key);if(user?.email&&!user.verified&&(!user.lastMail||now()-user.lastMail>60000)){
     const token=randomBytes(32).toString('hex');await send(user.email,token);user.verification=hash(token);user.verifyExpires=now()+1800000;user.lastMail=now();save();
    }reply(res,200,{message:'If that account needs verification, a link has been sent.'});return true;
   }
   reply(res,404,{error:'Not found'});
  }catch(e){reply(res,400,{error:e.message==='Email delivery failed'?'Could not send verification email. Please try again later.':e.message});}finally{busy--;}
  return true;
 };
 handler.user=req=>{const u=session(req);return u?{id:u.id,username:u.username}:null;};
 return handler;
}
