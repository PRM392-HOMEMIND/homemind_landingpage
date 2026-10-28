import https from 'node:https';import http from 'node:http';import net from 'node:net';
import {readFileSync,writeFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {resolve,sep} from 'node:path';
const manifest=process.env.FEEDBACK_LOCAL_FIXTURE; if(!manifest || !/^H:[\\/]/i.test(manifest)) throw Error('Owned H: fixture required'); const root=manifest.replace(/[^\\/]+$/, '');
const fixture=JSON.parse(readFileSync(manifest,'utf8'));const api=new URL(fixture.baseUrl);
if(fixture.productionDatabaseAccess!==false||api.hostname!=='127.0.0.1'||api.protocol!=='http:'||!api.port||api.pathname!=='/v1'||api.username||api.password||api.search||api.hash||!/^homemind-e2e-[a-f0-9]{12}$/.test(fixture.name)||fixture.revision!=='233e71562dda9ce3f7776e2fa52f23db3d96be21')throw Error('Owned local fixture required');
if(execFileSync('docker',['inspect','--format','{{index .Config.Labels "vn.homemind.e2e.owner"}}',fixture.name+'-api'],{encoding:'utf8'}).trim()!==fixture.name)throw Error('Fixture ownership mismatch');
if(execFileSync('docker',['port',fixture.name+'-api','3000'],{encoding:'utf8'}).trim()!==`127.0.0.1:${api.port}`||!resolve(fixture.state).toLowerCase().startsWith(resolve(root).toLowerCase()+sep))throw Error('Owned fixture path/port mismatch');
const options={key:readFileSync(fixture.state+'/frontend-tls/server.key'),cert:readFileSync(fixture.state+'/frontend-tls/server.crt')};
const proxyPort=Number(process.env.FEEDBACK_HTTPS_PROXY_PORT || 3461); if(!Number.isInteger(proxyPort)||proxyPort<1024||proxyPort>65533)throw Error('Invalid owned proxy port'); const ports={website:proxyPort+2,api:proxyPort+1,proxy:proxyPort};const servers=[]; const identity={fixture:fixture.name,apiPort:api.port,productionDatabaseAccess:false};
const website=new URL(process.env.FEEDBACK_BASE_URL || 'http://127.0.0.1:3417');
if(website.protocol!=='http:'||website.hostname!=='127.0.0.1'||!website.port||website.pathname!=='/'||website.username||website.password||website.search||website.hash)throw Error('Owned loopback frontend required');
for(const [surface,target] of [['website',website.origin],['api',api.origin]]){
 const server=https.createServer(options,async(req,res)=>{
  try{
   const headers={...req.headers,'x-forwarded-proto':'https'};delete headers.host;delete headers.connection;delete headers['content-length'];
   const parts=[];for await(const part of req)parts.push(part);const body=Buffer.concat(parts);
   const response=await fetch(target+req.url,{method:req.method,headers,redirect:'manual',...(body.length?{body}:{}),signal:AbortSignal.timeout(30000)});
   const output=Object.fromEntries(response.headers);for(const name of ['content-encoding','content-length','transfer-encoding','set-cookie'])delete output[name];
   const cookies=response.headers.getSetCookie();if(cookies.length)output['set-cookie']=cookies;
   res.writeHead(response.status,output);res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(502,{'Cache-Control':'no-store'});res.end('Owned local proxy unavailable');}
 });await new Promise(resolve=>server.listen(ports[surface],'127.0.0.1',resolve));servers.push(server);
}
const proxy=http.createServer((req,res)=>{if(req.method==='GET'&&req.url==='/fixture-identity'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(identity));}else{res.writeHead(403);res.end();}});
proxy.on('connect',(req,socket,head)=>{
 const port=req.url==='homemind.vn:443'?ports.website:req.url==='api.homemind.vn:443'?ports.api:null;
 if(!port){socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');return;}
 const upstream=net.connect(port,'127.0.0.1',()=>{socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');if(head.length)upstream.write(head);socket.pipe(upstream);upstream.pipe(socket);});
 upstream.on('error',()=>socket.destroy());socket.on('error',()=>upstream.destroy());
});await new Promise(resolve=>proxy.listen(ports.proxy,'127.0.0.1',resolve));servers.push(proxy);
writeFileSync(root+'local-https-ready.json',JSON.stringify({url:'http://127.0.0.1:'+ports.proxy,fixture:fixture.name,apiPort:api.port,pid:process.pid,productionDatabaseAccess:false},null,2));
console.log('Owned loopback HTTPS proxy ready; only homemind.vn and api.homemind.vn tunnel to local fixtures');
process.on('SIGINT',()=>{for(const server of servers)server.close();process.exit(0);});
