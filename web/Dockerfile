FROM docker.io/library/node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY *.mjs browser-transport.txt ./
COPY public ./public
ARG EXTRAS_URL=https://raw.githubusercontent.com/santiagoPostacchini/CSweb/9dd1703b7e1f53de97f03d53e4b10a902d63c9be/vendor/cs16-client/cstrike/extras.pk3
RUN node -e "const fs=require('fs'),c=require('crypto');(async()=>{let b;if(fs.existsSync('public/assets/extras-CECzBvGu.pk3'))b=fs.readFileSync('public/assets/extras-CECzBvGu.pk3');else{const r=await fetch(process.argv[1],{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('HTTP '+r.status);b=Buffer.from(await r.arrayBuffer());}if(c.createHash('sha256').update(b).digest('hex')!=='49d5e00ce50ed01aace3a1c2035a2959c3f7e4457ca2b6c31d01e4cd2a7a5d69')throw Error('Checksum mismatch');fs.writeFileSync('public/assets/extras-CECzBvGu.pk3',b)})().catch(e=>{console.error(e);process.exit(1)})" "$EXTRAS_URL"
RUN node parche-cliente.mjs public && node customize.mjs && node validate.mjs
USER node
CMD ["node","server.mjs"]
