import fs from 'node:fs';
import crypto from 'node:crypto';
const pub='public';let html=fs.readFileSync(pub+'/index.html','utf8');
html=html.replace('lang="es"','lang="en"');
const translations={
 'Partida LAN en el navegador':'Classic multiplayer. Guest access.',
 'Estado del servidor':'Server status','Servidor':'Room','Mapa':'Map','Jugadores web':'Web players','Tu nombre':'Your nickname','Contraseña del servidor':'Room password',
 'Pantalla completa (bloquea':'Fullscreen (captures', 'y otros atajos)':'and other shortcuts)',
 'Controles táctiles':'Touch controls','>Jugar<':'>Play now ↗<','<summary>Controles</summary>':'<summary>Controls</summary>',
 'captura el mouse':'capture mouse','menú':'menu','mantené':'hold','para salir de pantalla completa':'to exit fullscreen',
 'elegir equipo':'choose team','comprar':'buy','opciones del menú':'menu options','moverse':'move','Espacio':'Space','saltar':'jump','agacharse':'crouch','puntajes':'scoreboard','consola (la tecla al lado del 1)':'console','Cargando…':'Loading…',
};
for(const [a,b] of Object.entries(translations))html=html.split(a).join(b);
html=html.replace('</head>','<link rel="stylesheet" href="/game.css"></head>');
html=html.replace('<main id="lobby" class="panel">','<main id="lobby" class="panel"><a href="/hub.html" class="back">← ALL ROOMS</a>');
html=html.replace('<button id="play"', '<label>Team<select id="team"><option value="5">Auto assign</option><option value="2">Counter-Terrorists</option><option value="1">Terrorists</option></select></label><button id="play"');
html=html.replace('</form>' ,'<p class="guest-note">GUEST PLAY · <a href="/account.html" target="_top">SIGN IN BEFORE PLAYING TO EARN SKIN CREDITS</a></p></form>');
html=html.replace('</body>','<div id="room-tools"><a href="/hub.html">← Game hub</a><button id="share-room">Copy room invite ↗</button><button id="fullscreen-game">Fullscreen</button></div><script type="module" src="/game-ui.js"></script></body>');
fs.writeFileSync(pub+'/index.html',html);
const bundle=html.match(/\/assets\/(index-[A-Za-z0-9_-]+\.js)/)[1];let js=fs.readFileSync(pub+'/assets/'+bundle,'utf8');
const strings={
 'Esperando al servidor…':'Waiting for game server…',
 'Jugar':'Play now ↗','Reintentar':'Try again',
 'Conectando con el servidor…':'Connecting to your room…','Cargando el motor…':'Starting the engine…',
 'Cargando archivos guardados…':'Loading cached game files…','Descargando archivos del juego…':'Downloading game files from your host…',
 'Se perdió la conexión con el servidor. Reintentando…':'Connection lost. Reconnecting…','Reconectado':'Reconnected',
 'No se pudo establecer la conexión WebRTC con el servidor (¿firewall bloqueando UDP?)':'WebRTC connection failed. Check that UDP port 27018 is reachable on the host.',
 'No se pudo conectar con el servidor de señalización':'Could not connect to this room. Return to the lobby and try again.',
 'El servidor cerró la conexión':'The room closed the connection.',
 'El servidor todavía no tiene listos los archivos del juego. Probá de nuevo en un rato.':'Game files are not ready on this host. Try again shortly.',
 'Este navegador no soporta WebRTC/WebAssembly. Usá Chrome, Edge o Firefox actualizados.':'This browser needs WebRTC and WebAssembly. Use an up-to-date Chrome, Edge or Firefox.',
 'Hacé click en el juego para capturar el mouse · ESC menú · º consola (al lado del 1)':'Click to capture mouse · ESC to release · B to buy · M to choose team',
 'La primera vez se descargan ~':'First visit downloads ~',' de archivos del juego; después quedan guardados en este navegador.':' of game files from your host; then they are cached in this browser.',
 'Jugador':'Player',
};
for(const [a,b] of Object.entries(strings))js=js.split(a).join(b);
// Do not make fullscreen automatic; users can opt in after the engine has loaded.
js=js.replace('r.checked=localStorage.getItem("csweb:fullscreen")!=="false"','r.checked=false');
// Override the local installation's custom ReGameDLL path for this WASM SDK.
js=js.replace('mountExtras(o,_),enterGame(canvas)', 'mountExtras(o,_),o.writeFile("/rodir/cstrike/liblist.gam",new TextEncoder().encode(\'game "Counter-Strike"\\nversion "1.6"\\ntype "multiplayer_only"\\ncldll "1"\\ngamedll "dlls/cs.dll"\\ngamedll_linux "dlls/cs.so"\\n\')),enterGame(canvas)');
// Load the small local model pack before engine startup, without evicting the base asset cache.
if(!js.includes('mountExtras(o,_),o.writeFile'))throw Error('Skin pack injection target missing');
js=js.replace('mountExtras(o,_),o.writeFile', 'await(async()=>{const pack=await fetch("/game/skins.zip?v="+status.cosmetics.version);if(!pack.ok)throw Error("Could not load skin models");createUnzip(l).push(new Uint8Array(await pack.arrayBuffer()),true)})(),mountExtras(o,_),o.writeFile');

// The installed valve.rc skips default.cfg, so explicitly set browser gameplay bindings.
const bindings=['bind w +forward','bind s +back','bind a +moveleft','bind d +moveright','bind mouse1 +attack','bind mouse2 +attack2','bind space +jump','unbind ctrl','bind alt +duck','bind shift +speed','bind e +use','bind r +reload','unbind b','bind m chooseteam','bind y messagemode','bind u messagemode2','bind tab +showscores','bind g drop','bind q lastinv','bind 1 slot1','bind 2 slot2','bind 3 slot3','bind 4 slot4','bind 5 slot5','bind 6 slot6','bind 7 slot7','bind 8 slot8','bind 9 slot9','bind 0 slot10','bind z radio1','bind x radio2','bind c +duck','bind f "impulse 100"','bind mwheelup invprev','bind mwheeldown invnext','bind n buy'];
js=js.replace('a.Cmd_ExecuteString(`connect ${SERVER_ADDRESS}`)',JSON.stringify(bindings)+'.forEach(cmd=>a.Cmd_ExecuteString(cmd)),a.Cmd_ExecuteString("hud_scale "+Math.min(2,Math.max(1,window.innerWidth/1100))),a.Cmd_ExecuteString(`connect ${SERVER_ADDRESS}`)');

// TLS WebSockets traverse HTTPS tunnels and NAT without exposing native game UDP ports.
const begin=js.indexOf('connectTransport(r=15e3){');
const end=js.indexOf('lostHandled=new WeakSet',begin);
if(begin<0||end<0)throw Error('Cannot find expected engine transport');
const transport=fs.readFileSync('browser-transport.txt','utf8').trim();
js=js.slice(0,begin)+transport+js.slice(end);

const finalBundle='index-'+crypto.createHash('sha256').update(js).digest('base64url').slice(0,8)+'.js';
fs.writeFileSync(pub+'/assets/'+finalBundle,js);
fs.unlinkSync(pub+'/assets/'+bundle);
html=html.replace('/assets/'+bundle,'/assets/'+finalBundle);
fs.writeFileSync(pub+'/index.html',html);
