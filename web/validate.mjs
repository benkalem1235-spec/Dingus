import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
for(const dir of ['.','public','public/assets'])for(const name of fs.readdirSync(dir)){
 if(!/\.(m?js)$/.test(name))continue;const file=path.join(dir,name);const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status!==0){console.error(file+': '+(r.stderr.split('\n').find(l=>l.includes('SyntaxError:'))||'syntax check failed'));process.exit(1);}
}
console.log('JavaScript syntax checks passed.');
