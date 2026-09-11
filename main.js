import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// All geometry is generated here. Dimensions describe a miniature, not a full-size site.
const stage = document.querySelector('#stage');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#14191a');
scene.fog = new THREE.Fog('#14191a', 50, 145);
const mobile = matchMedia('(max-width: 700px)').matches;
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(error){window.showStartupError?.(`WebGL 初始化失败：${error.message||error}`);throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.6 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
stage.append(renderer.domElement);
const camera = new THREE.PerspectiveCamera(39, innerWidth / innerHeight, .1, 180);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = .065;
controls.minPolarAngle = .32; controls.maxPolarAngle = 1.25;
controls.minDistance = 16; controls.maxDistance = 145;
controls.autoRotateSpeed = .32; controls.screenSpacePanning = false;
controls.touches.ONE = THREE.TOUCH.ROTATE; controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
function resetCamera(){controls.target.set(0,3,0); const scale = Math.max(1, 1.06 / (innerWidth / innerHeight)); camera.position.set(29*scale,26*scale,33*scale); scene.fog.near=camera.position.distanceTo(controls.target)-15; scene.fog.far=scene.fog.near+95; controls.update();}
resetCamera();
scene.add(new THREE.HemisphereLight('#dae5dc','#403323',1.7), new THREE.AmbientLight('#dac7a7',.28));
const sun = new THREE.DirectionalLight('#ffe0a7',3.4);sun.position.set(-12,25,12);sun.castShadow=true;
Object.assign(sun.shadow.camera,{left:-23,right:23,top:24,bottom:-21,near:1,far:65});
sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);sun.shadow.bias=-.0005;sun.shadow.normalBias=.035;scene.add(sun);
const rim = new THREE.DirectionalLight('#9ebbc8',1.6);rim.position.set(12,12,-16);scene.add(rim);
const area = new THREE.RectAreaLight('#ffc584',9,16,10);area.position.set(-10,17,5);area.lookAt(0,0,0);scene.add(area);
const mat=(c,r=.7,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const M={concrete:mat('#bcb7a3'),edge:mat('#d8d2be'),darkConcrete:mat('#8c9289'),yellow:mat('#e9ad32',.38,.4),orange:mat('#e77f31'),steel:mat('#6b7775',.4,.7),darkSteel:mat('#303c3c',.43,.65),rust:mat('#80583e',.9,.25),green:mat('#527c68'),mint:mat('#bdcfc0'),white:mat('#e8e8d5',.5),black:mat('#202c2e'),rubber:mat('#202522',.94),glass:new THREE.MeshPhysicalMaterial({color:'#31515a',roughness:.15,metalness:.25,clearcoat:1}),wood:mat('#b39362'),soil:mat('#85765b'),grass:mat('#596d45'),leaf:mat('#708159'),vest:mat('#f4a53b'),blue:mat('#396d86'),bag:mat('#d1c2a4'),red:mat('#b74c39'),skin:mat('#d3ab86'),light:new THREE.MeshStandardMaterial({color:'#ffe4a6',emissive:'#ffb943',emissiveIntensity:2}),signal:new THREE.MeshStandardMaterial({color:'#ff8a31',emissive:'#ff6611',emissiveIntensity:2})};
const G={box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(1,1,1,12),sphere:new THREE.SphereGeometry(1,10,7),cone:new THREE.ConeGeometry(1,1,8)};
function part(parent,geo,material,x,y,z,sx,sy,sz){const o=new THREE.Mesh(geo,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
const box=(p,m,x,y,z,w,h,d)=>part(p,G.box,m,x,y,z,w,h,d);
const cyl=(p,m,x,y,z,r,h)=>part(p,G.cyl,m,x,y,z,r,h,r);
function beam(p,m,a,b,width=.05){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const o=box(p,m,...av.clone().add(bv).multiplyScalar(.5).toArray(),width,av.distanceTo(bv),width);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return o;}
function group(parent,x=0,y=0,z=0){let g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
// Batch repeated geometry/material pairs per static subassembly (also selectable as a whole).
function batch(root){root.updateMatrixWorld(true);const buckets=new Map();root.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&!o.userData.dynamic){const key=o.geometry.uuid+o.material.uuid;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);}});const inv=root.matrixWorld.clone().invert();for(const items of buckets.values()){if(items.length<2)continue;const mesh=new THREE.InstancedMesh(items[0].geometry,items[0].material,items.length);items.forEach((o,i)=>{mesh.setMatrixAt(i,inv.clone().multiply(o.matrixWorld));o.removeFromParent();});mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);}}
function textTexture(text,bg='#365d52',fg='#e5e6d3',w=512,h=128){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.strokeStyle=fg;ctx.lineWidth=3;ctx.strokeRect(8,8,w-16,h-16);ctx.fillStyle=fg;ctx.font=`500 ${h*.38}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,w/2,h/2);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function sign(p,text,x,y,z,w=2,h=.5,bg){const m=mat('#ffffff');m.map=textTexture(text,bg);return box(p,m,x,y,z,w,h,.07);}
const selectable=[];
function register(g,title,en,details,kind){g.userData.info={title,en,details,kind};selectable.push(g);return g;}

// Warm walnut workbench, with procedural grain and joints.
function woodTexture(){const c=document.createElement('canvas');c.width=1024;c.height=512;let ctx=c.getContext('2d');ctx.fillStyle='#35281f';ctx.fillRect(0,0,1024,512);let seed=731;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};for(let i=0;i<1900;i++){let y=rand()*512;ctx.strokeStyle=`rgba(${rand()>.5?'142,103,66':'12,12,10'},${rand()*.22})`;ctx.lineWidth=rand()*1.5+.2;ctx.beginPath();ctx.moveTo(0,y);for(let x=0;x<=1024;x+=24)ctx.lineTo(x,y+Math.sin(x*.008+i)*rand()*2);ctx.stroke();}for(let y=0;y<512;y+=85){ctx.fillStyle='#171918';ctx.fillRect(0,y,1024,2);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);return t;}
const tabletop=mat('#aa9781',.55);tabletop.map=woodTexture();
box(scene,tabletop,0,-.85,0,39,1.2,31);box(scene,M.darkSteel,0,-1.5,0,38,.18,30);
const site=group(scene,0,0,0);
box(site,M.darkSteel,0,-.03,0,27,.7,21);box(site,M.edge,0,.34,0,26.7,.14,20.7);box(site,M.soil,0,.46,0,26.2,.12,20.2);
box(site,M.darkConcrete,0,.54,6.5,25.7,.08,4.5);box(site,M.darkConcrete,10,.54,-1.6,3.5,.08,11.8);
box(site,M.concrete,-2,.55,-1,17,.13,12.6);box(site,M.grass,-10.8,.6,-6.8,3.7,.2,4.8);
for(let x=-11;x<12;x+=2.1)box(site,M.white,x,.59,6.5,1,.025,.07);
for(let z=-8;z<3;z+=1.9)box(site,M.white,10,.59,z,.07,.025,.8);
for(let x=-12;x<12;x+=.8){box(site,M.edge,x,.68,4.2,.76,.2,.22);box(site,x%1.6<.8?M.yellow:M.darkSteel,x,.7,8.8,.7,.2,.2);}
function createFence(){for(let x=-12.5;x<=12.5;x+=1.4){for(const z of [-9.65,9.65]){if(z>0&&x>6&&x<10)continue;box(site,M.white,x,1.08,z,1.35,1.05,.12);box(site,M.green,x,.82,z,1.35,.52,.15);box(site,M.steel,x-.69,1.13,z,.07,1.2,.09);}}for(let z=-8.9;z<9.5;z+=1.4)for(const x of [-12.9,12.9]){box(site,M.white,x,1.08,z,.12,1.05,1.35);box(site,M.green,x,.82,z,.15,.52,1.35);box(site,M.steel,x,1.13,z-.69,.09,1.2,.07);}sign(site,'筑境  /  ATELIER CONSTRUCTION',-4,1.19,9.75,5,.5);}
createFence();
for(const x of [6.15,10.2]){box(site,M.green,x,1.7,9.6,.2,2.3,.2);cyl(site,M.light,x,2.93,9.6,.13,.12);}sign(site,'安全第一 · SAFETY FIRST',8.2,2.8,9.6,4.3,.5);
// Site hut: corrugated walls, fascia, air conditioner, stairs and windows.
box(site,M.mint,-8.8,1.35,-7.4,3.2,1.5,2.1);box(site,M.green,-8.8,2.15,-7.4,3.5,.18,2.35);
for(let x=-10.3;x<-7.3;x+=.16)box(site,M.white,x,1.36,-6.32,.022,1.4,.035);
box(site,M.glass,-9.4,1.6,-6.28,.9,.6,.05);box(site,M.green,-8,1.3,-6.27,.6,1.24,.08);box(site,M.white,-10.48,1.3,-7.1,.25,.55,.7);sign(site,'SITE OFFICE',-8.8,2.06,-6.2,2,.24);

function railing(p,x,y,z,length,axis='x'){for(let i=0;i<=length;i+=.6){const a=axis==='x'?x+i:x,b=axis==='x'?z:z+i;box(p,M.orange,a,y+.3,b,.04,.6,.04);}for(const h of [.2,.55]){if(axis==='x')box(p,M.orange,x+length/2,y+h,z,length,.035,.035);else box(p,M.orange,x,y+h,z,.035,.035,length);}}
function createBuilding(){const b=register(group(scene,-2,.64,-1.6),'施工楼 A','Building A · Concrete frame',['施工进度　63%','当前楼层　5F / 主体结构','作业内容　钢筋绑扎、模板安装'],'01 / ARCHITECTURE');
box(b,M.darkConcrete,0,.04,0,8.7,.22,6.7);
for(let f=0;f<5;f++){let y=f*1.8;box(b,M.edge,0,y+.15,0,8.3,.22,6.3);box(b,M.concrete,0,y+.29,0,8.12,.07,6.12);
 for(let x=-3.7;x<=3.7;x+=2.46)for(let z of [-2.7,0,2.7]){box(b,M.concrete,x,y+1.05,z,.29,1.7,.3);if(f===4)for(let dx of [-.085,.085])for(let dz of [-.08,.08])cyl(b,M.rust,x+dx,y+2.05,z+dz,.017,.65);}
 for(let z of [-2.7,0,2.7])box(b,M.darkConcrete,0,y+1.78,z,7.7,.23,.28);
 for(let x of [-3.7,-1.24,1.22,3.68])box(b,M.concrete,x,y+1.78,0,.28,.23,5.7);
 railing(b,-4.05,y+.29,3.03,8.1);railing(b,4.05,y+.29,-3,6,'z');
 // Stair flights occupy the rear service bay; risers are true solids.
 for(let s=0;s<12;s++)box(b,M.concrete,-3.15+s*.22,y+.35+s*.123,-1.75,.25,.16,.9);
 beam(b,M.steel,[-3.2,y+.8,-1.23],[-.65,y+2.25,-1.23],.04);
 if(f<2){box(b,M.mint,-2.2,y+.88,-2.98,2.5,1.1,.15);box(b,M.darkConcrete,.5,y+.88,-1.7,.15,1.1,1.8);for(let i=0;i<8;i++)box(b,M.bag,1.5+(i%4)*.4,y+.42+Math.floor(i/4)*.19,-1,.37,.18,.27);}
 if(f===2){for(let i=0;i<8;i++)box(b,M.red,-2.1+i*.32,y+.5,1.8,.29,.35,.18);box(b,M.wood,1,y+.65,-.8,2,.12,1);for(let xx of [.2,1.8])box(b,M.steel,xx,y+.47,-.8,.05,.4,.7);box(b,M.blue,1,y+.73,-.8,.8,.025,.5);}
 if(f===3){for(let j=0;j<7;j++)box(b,M.wood,-1,y+.4+j*.065,-1.5,2.8,.055,.45);for(let x=1;x<3.5;x+=.23)cyl(b,M.rust,x,y+.7,-2.7,.02,.85);}
 if(f===4){for(let x=-2.6;x<3;x+=.24)beam(b,M.rust,[x,y+.34,-2.5],[x,y+.34,1.2],.024);for(let z=-2.4;z<1.3;z+=.25)beam(b,M.rust,[-2.7,y+.36,z],[3,y+.36,z],.025);box(b,M.wood,-2.5,y+.4,2,1.8,.1,1);box(b,M.blue,1.9,y+.5,1.5,.75,.35,.45);}
 createWorker(b,-2+(f%3)*1.5,y+.32,2.3,f);createWorker(b,2.8,y+.32,-1.6,f+2);
}
// Scaffolding on the left facade: tubes, diagonal braces, planks and ladder.
for(let z=-3;z<=3;z+=1.2){for(let x of [-4.6,-5.2]){beam(b,M.steel,[x,0,z],[x,8.8,z],.045);for(let f=0;f<5;f++){beam(b,M.steel,[x,f*1.8,z],[x,f*1.8+1.8,z+1.2>3?z:z+1.2],.032);}}}
for(let f=0;f<5;f++){box(b,M.wood,-4.9,f*1.8+.25,0,.75,.08,6.5);for(let h of [.7,1.25])beam(b,M.steel,[-5.2,f*1.8+h,-3],[-5.2,f*1.8+h,3],.04);}
for(let y=.3;y<9;y+=.25)box(b,M.steel,-5.24,y,1,.05,.035,.6);
sign(b,'A / 05',0,6.6,3.12,1.3,.65,'#495f51');batch(b);return b;}

function createWorker(parent,x,y,z,pose=0){const w=group(parent,x,y,z);w.rotation.y=pose*.83;const lean=pose%3===1?.12:0;
box(w,M.blue,-.075,.19,0,.11,.34,.13);beam(w,M.blue,[.07,.34,0],[.11,.04,pose%2?.13:0],.105);box(w,M.black,-.075,.04,.045,.13,.08,.23);box(w,M.black,.11,.04,.09,.13,.08,.23);
box(w,M.vest,0,.46,lean,.3,.3,.18);box(w,M.white,0,.47,lean+.098,.29,.04,.014);for(const xx of [-.09,.09])box(w,M.white,xx,.51,lean+.1,.025,.2,.02);
part(w,G.sphere,M.skin,0,.7,lean,.11,.13,.1);part(w,G.sphere,pose%4?M.yellow:M.white,0,.8,lean,.14,.075,.14);cyl(w,pose%4?M.yellow:M.white,0,.775,lean,.155,.03);
beam(w,M.vest,[-.16,.57,lean],[-.24,.36,lean+.1],.075);beam(w,M.skin,[-.24,.36,lean+.1],[-.2,.31,lean+.16],.065);
const hand=pose%3===0?[.36,.8,lean]:[.24,.38,lean+.22];beam(w,M.vest,[.16,.57,lean],hand,.075);part(w,G.sphere,M.skin,...hand,.05,.05,.05);if(pose%3===1)box(w,M.wood,0,.34,.36,.6,.14,.23);if(pose%3===2)box(w,M.blue,.27,.4,.22,.26,.025,.3);return w;}
const building=createBuilding();

const cranes=[];
function createCrane(x,z,height,angle,name){const root=register(group(scene,x,.62,z),'塔吊 '+name,'Tower Crane '+name,[`模型对应高度　${Math.round(height*3)} m`,'状态　等待操作','设备　格构式塔式起重机'],'02 / LIFTING');root.userData.deviceId='crane'+name;const stat=group(root);
box(stat,M.concrete,0,.12,0,1.8,.25,1.8);for(const xx of [-.42,.42])for(const zz of [-.42,.42])beam(stat,M.yellow,[xx,.2,zz],[xx,height,zz],.095);
for(let y=.3;y<height-.3;y+=.8){for(let s of [-1,1]){beam(stat,M.yellow,[-.42,y,s*.42],[.42,y+.8,s*.42],.055);beam(stat,M.yellow,[s*.42,y,-.42],[s*.42,y+.8,.42],.055);box(stat,M.yellow,0,y,s*.42,.9,.06,.06);box(stat,M.yellow,s*.42,y,0,.06,.06,.9);}box(stat,M.steel,.12,y,0,.3,.04,.05);}
const rotor=group(root,0,height,0);rotor.rotation.y=angle;const arm=group(rotor);cyl(arm,M.darkSteel,0,.02,0,.63,.25);box(arm,M.yellow,0,.24,0,1.6,.14,1.5);
for(const yy of [.35,1])for(const zz of [-.36,.36])beam(arm,M.yellow,[-3.5,yy,zz],[8.6,yy,zz],.07);
for(let i=-3.5;i<8.5;i+=.65){for(const zz of [-.36,.36])beam(arm,M.yellow,[i,.35,zz],[i+.65,1,zz],.043);beam(arm,M.yellow,[i,1,-.36],[i+.65,1,.36],.04);box(arm,M.yellow,i,.35,0,.045,.045,.75);}
beam(arm,M.yellow,[0,.5,0],[0,2.5,0],.13);beam(arm,M.darkSteel,[0,2.5,0],[6.5,1,0],.026);beam(arm,M.darkSteel,[0,2.5,0],[-3.4,1,0],.026);
box(arm,M.yellow,.3,.12,.89,.9,.92,.7);box(arm,M.glass,.3,.22,1.26,.72,.58,.04);box(arm,M.glass,.78,.22,.9,.035,.58,.6);box(arm,M.yellow,.3,.65,.91,1,.1,.83);
for(let i=0;i<4;i++)box(arm,M.darkConcrete,-3.05+i*.28,-.12,0,.25,.85,1.1);
sign(arm,'ATELIER',-1.8,.7,.41,1.5,.42,'#d49725');
const trolley=group(rotor,5.8,.2,0);box(trolley,M.yellow,0,0,0,.6,.23,.85);
const hook=group(trolley,0,-.1,0);const cableL=4.7;const cables=[beam(hook,M.darkSteel,[-.12,0,0],[-.12,-cableL,0],.022),beam(hook,M.darkSteel,[.12,0,0],[.12,-cableL,0],.022)];const block=group(hook,0,-cableL,0);box(block,M.yellow,0,-.05,0,.35,.32,.23);const tor=new THREE.TorusGeometry(.13,.038,6,12,Math.PI*1.5);const h=part(block,tor,M.darkSteel,0,-.3,0,1,1,1);h.rotation.z=.6;
batch(stat);batch(arm);const rig={id:'crane'+name,root,rotor,trolley,hook,block,cables,angle,height,trolleyX:5.8,cableLength:cableL,cargo:null};cranes.push(rig);root.userData.rig=rig;return root;}
const craneA=createCrane(4.1,-5.9,12.8,.25,'A');const craneB=createCrane(-9.3,1.3,10.5,Math.PI*.93,'B');

function wheels(p,length,width,r=.3){p.userData.wheels=[];for(const x of [-length/2,length/2])for(const z of [-width/2,width/2]){let t=cyl(p,M.rubber,x,r,z,r,.19);t.rotation.x=Math.PI/2;t.userData.dynamic=true;p.userData.wheels.push(t);let hub=cyl(p,M.steel,x,r,z+Math.sign(z)*.105,r*.5,.025);hub.rotation.x=Math.PI/2;hub.userData.dynamic=true;p.userData.wheels.push(hub);}}
function chassis(p,m,length=2.7,width=1.15){box(p,M.darkSteel,0,.42,0,length,.21,width);wheels(p,length*.69,width+.06);box(p,m,-length*.32,.9,0,.86,.9,width);box(p,M.glass,-length*.32,1.05,width*.51,.62,.5,.025);box(p,M.glass,-length*.32,1.05,-width*.51,.62,.5,.025);box(p,M.glass,-length*.485,1.08,0,.025,.47,width*.82);box(p,m,-length*.32,1.41,0,.94,.09,width+.1);box(p,M.steel,-length/2-.08,.41,0,.12,.16,width+.08);for(const z of [-width*.34,width*.34])box(p,M.light,-length/2-.09,.72,z,.04,.16,.2);box(p,M.black,-length/2-.1,.9,0,.025,.18,.4);for(const z of [-width*.6,width*.6])box(p,M.black,-length*.4,1.15,z,.12,.09,.12);}
function makeVehicle(p,id,radius=1.35){p.userData.deviceId=id;p.userData.vehicle={id,root:p,wheels:p.userData.wheels||[],wheelRotation:0,radius,cameraMode:'chase'};vehicles.push(p.userData.vehicle);return p;}
const vehicles=[];
function createTruck(x,z){let p=register(group(scene,x,.62,z),'工程卡车','Dump Truck 02',['状态　等待驾驶','载货　砂石与混凝土碎料'],'03 / VEHICLE');chassis(p,M.yellow,3.1);box(p,M.yellow,.58,.65,0,1.9,.13,1.2);for(const zz of [-.58,.58])box(p,M.yellow,.58,.95,zz,1.95,.6,.1);box(p,M.yellow,1.51,.95,0,.1,.6,1.2);for(let i=0;i<16;i++)part(p,G.sphere,M.soil,.1+(i%4)*.35,.92+Math.floor(i/8)*.12,-.37+(Math.floor(i/4)%2)*.65,.23,.16,.23);batch(p);return makeVehicle(p,'truck',1.6);}
function createMixer(x,z){const p=register(group(scene,x,.62,z),'水泥搅拌车','Concrete Mixer 03',['状态　等待驾驶','容量　8 m³'],'03 / VEHICLE');chassis(p,M.white,3.2,1.25);const drum=group(p,.55,1.15,0);const geo=new THREE.CylinderGeometry(.46,.68,1.55,16);const mesh=part(drum,geo,M.white,0,0,0,1,1,1);mesh.rotation.z=Math.PI/2;for(let xx of [-.3,.25]){const r=part(drum,new THREE.TorusGeometry(.6,.06,6,18),M.green,xx,0,0,1,1,1);r.rotation.y=Math.PI/2;}beam(p,M.steel,[1.3,1,0],[1.9,.5,0],.22);batch(p);return makeVehicle(p,'mixer',1.65);}
function createExcavator(x,z){const p=register(group(scene,x,.64,z),'液压挖掘机','Excavator 01',['状态　等待驾驶','设备　履带式液压挖掘机'],'03 / VEHICLE');p.rotation.y=-.35;p.userData.deviceId='excavator';
for(let zz of [-.58,.58]){box(p,M.rubber,0,.22,zz,1.8,.4,.35);for(let i=-.7;i<.8;i+=.28){let r=cyl(p,M.steel,i,.24,zz+Math.sign(zz)*.18,.16,.03);r.rotation.x=Math.PI/2;}for(let i=-.85;i<.9;i+=.16)box(p,M.darkSteel,i,.43,zz,.08,.035,.38);}
cyl(p,M.darkSteel,0,.55,0,.55,.25);box(p,M.yellow,0,.78,0,1.7,.4,1.25);box(p,M.yellow,-.55,1.17,-.22,.8,.72,.69);box(p,M.glass,-.55,1.24,.135,.58,.5,.025);box(p,M.glass,-.12,1.24,-.22,.025,.5,.56);box(p,M.yellow,-.55,1.57,-.22,.92,.1,.82);box(p,M.black,-.72,.99,.4,.43,.04,.25);
const boom=group(p,.28,.9,-.2);beam(boom,M.yellow,[0,0,0],[1.25,0,0],.24);beam(boom,M.steel,[.05,.15,.15],[1.05,.15,.15],.07);
const stick=group(boom,1.25,0,0);beam(stick,M.yellow,[0,0,0],[1.45,0,0],.19);beam(stick,M.steel,[.05,.15,.15],[1.25,.15,.15],.055);
const bucket=group(stick,1.45,0,0);box(bucket,M.darkSteel,.25,0,0,.65,.15,.7);box(bucket,M.yellow,.5,.2,0,.12,.5,.7);for(const zz of [-.32,.32]){const side=box(bucket,M.yellow,.22,.2,zz,.66,.43,.06);side.rotation.z=.25;}for(let zz=-.28;zz<.35;zz+=.16)box(bucket,M.darkSteel,-.1,-.12,zz,.22,.09,.09);
boom.rotation.z=.82;stick.rotation.z=-1.42;bucket.rotation.z=-.45;const rig={id:'excavator',root:p,boom,stick,bucket,limits:{boom:[.18,1.18],stick:[-1.85,-.45],bucket:[-1.2,.45]}};p.userData.rig=rig;return p;}
function createForklift(x,z){const p=register(group(scene,x,.62,z),'小型叉车','Forklift 04',['状态　等待驾驶','载荷　木质托盘'],'03 / VEHICLE');chassis(p,M.orange,1.6,.85);for(let zz of [-.48,.48])box(p,M.darkSteel,-1,.96,zz,.09,1.8,.09);box(p,M.darkSteel,-1,1.8,0,.1,.1,1);const fork=group(p,0,.2,0);for(let zz of [-.48,.48])box(fork,M.steel,-1.4,0,zz,.9,.09,.1);p.userData.fork=fork;p.userData.forkHeight=.2;p.userData.load=null;return makeVehicle(p,'forklift',1.05);}
function createVan(x,z){const p=register(group(scene,x,.62,z),'白色施工车辆','Site Service 05',['状态　等待驾驶','任务　人员与工具运输'],'03 / VEHICLE');chassis(p,M.white,2.5,1.13);box(p,M.white,.5,.94,0,1.4,1.05,1.13);box(p,M.glass,.4,1.17,.574,.8,.4,.03);box(p,M.green,.5,.78,.58,1.3,.16,.025);box(p,M.signal,-.7,1.54,0,.24,.1,.23);batch(p);return makeVehicle(p,'van',1.3);}
const truck=createTruck(-4,6.5);const mixer=createMixer(6,1.9);const excavator=createExcavator(7.1,-2.3);const forklift=createForklift(-9,4.9);const van=createVan(6.5,6.6);

function createMaterialStack(x,z){const g=group(site,x,0,z);for(let j=0;j<3;j++){for(let i=0;i<5;i++)box(g,M.wood,0,.65+j*.12,-.55+i*.24,2,.09,.18);}for(let j=0;j<3;j++)for(let i=0;i<5-j;i++){const t=cyl(g,M.steel,-.5+i*.23+j*.12,1.15+j*.2,1.6,.095,2);t.rotation.z=Math.PI/2;}for(let i=0;i<12;i++)box(g,M.bag,2.1+(i%3)*.38,.72+Math.floor(i/6)*.2,-.3+(Math.floor(i/3)%2)*.4,.35,.18,.32);}
createMaterialStack(-3,-7.5);
for(let i=0;i<5;i++){cyl(site,i%2?M.blue:M.rust,5.3+i*.45,.95,-8,.2,.7);cyl(site,M.steel,5.3+i*.45,1.1,-8,.21,.025);}
box(site,M.green,6.2,1,-6.3,1.3,.85,.75);for(let i=0;i<6;i++)box(site,M.darkSteel,5.8+i*.14,1.07,-5.91,.045,.4,.02);cyl(site,M.signal,6.5,1.5,-6.3,.08,.11);
box(site,M.white,11.8,1.15,-4,.7,1.15,.5);sign(site,'⚡',11.8,1.25,-3.73,.4,.4,'#bc872c');
for(let i=0;i<9;i++){const x=-6+i*.68;box(site,M.black,x,.64,8.25,.32,.07,.32);part(site,G.cone,M.orange,x,.88,8.25,.13,.45,.13);cyl(site,M.white,x,.93,8.25,.082,.09);}
for(let i=0;i<3;i++){const x=6.7+i*.75;box(site,M.yellow,x,1,4,.65,.5,.12);beam(site,M.black,[x-.28,.77,4.075],[x+.1,1.24,4.075],.09);for(let s of [-1,1])box(site,M.steel,x+s*.25,.72,4,.05,.5,.4);}
function createStreetLight(x,z){cyl(site,M.darkSteel,x,2.2,z,.055,3.25);beam(site,M.darkSteel,[x,3.8,z],[x+.6,3.8,z],.065);box(site,M.darkSteel,x+.5,3.82,z,.62,.12,.28);box(site,M.light,x+.5,3.75,z,.5,.035,.22);const l=new THREE.PointLight('#ffca78',2,4,2);l.position.set(x+.5,3.6,z);scene.add(l);}
createStreetLight(-11.6,7.7);createStreetLight(11.7,-7);createStreetLight(11.7,7.5);
for(let i=0;i<5;i++){const x=-11.2+(i%2)*1.5,z=-7.8+Math.floor(i/2)*1.6;cyl(site,M.wood,x,1.2,z,.1,1.3);for(let k=0;k<3;k++)part(site,new THREE.IcosahedronGeometry(1,1),k%2?M.grass:M.leaf,x+(k-1)*.25,1.8+k*.23,z,.58,.7,.55);}
for(let i=0;i<21;i++){const x=i<10?-10+i*1.9:-11+(i-10)*2.1;const z=i<10?2.9+Math.sin(i*2.8)*.65:-8.3+Math.sin(i*1.9)*.6;createWorker(site,x,.64,z,i);}
for(const [x,z] of [[-7,2],[3,-7],[11,1]]){box(site,M.blue,x,.84,z,.48,.4,.35);box(site,M.steel,x,1.07,z,.18,.06,.1);}
for(const [x,z] of [[-11,5],[11,5]]){cyl(site,M.green,x,.94,z,.23,.6);cyl(site,M.darkSteel,x,1.26,z,.25,.07);}
sign(site,'PPE REQUIRED',-10.8,1.9,8.8,1.1,.58,'#b3893c');beam(site,M.steel,[-10.8,.6,8.8],[-10.8,1.9,8.8],.07);
// Excavation spoil and individual stones.
for(let i=0;i<24;i++){const a=i*2.4;part(site,new THREE.IcosahedronGeometry(1,0),M.soil,7.5+Math.sin(a)*1.2,.72+(i%3)*.1,-5+Math.cos(a)*.75,.4,.22,.3);}
batch(site);

// Interactive cargo stays outside the static batching pass so it can be re-parented in world space.
const liftables=[];
function createLiftableRebar(){cranes[0].root.updateMatrixWorld(true);const underHook=new THREE.Vector3();cranes[0].block.getWorldPosition(underHook);const cargo=group(scene,underHook.x,.92,underHook.z);cargo.userData={liftable:true,type:'rebar',label:'钢筋束'};for(let i=0;i<8;i++){const rod=cyl(cargo,M.rust,-.22+(i%4)*.14,0,-.08+Math.floor(i/4)*.16,.035,2.1);rod.rotation.z=Math.PI/2;}for(const x of [-.55,.55])box(cargo,M.steel,x,0,0,.05,.35,.45);liftables.push(cargo);return cargo;}
const rebarCargo=createLiftableRebar();
function createPalletCargo(){const p=group(scene,-10.5,.86,4.9);p.userData={forkable:true,type:'cement',label:'水泥托盘'};for(let z=-.38;z<=.38;z+=.38)box(p,M.wood,0,-.12,z,1.15,.1,.18);for(let i=0;i<6;i++)box(p,M.bag,-.25+(i%2)*.5,.12+Math.floor(i/4)*.22,-.28+(Math.floor(i/2)%2)*.56,.46,.2,.45);return p;}
const palletCargo=createPalletCargo();
const deliveryZone=group(scene,1.35,3.02,-3.15);const zoneMat=new THREE.MeshStandardMaterial({color:'#9bd070',emissive:'#5f9b38',emissiveIntensity:.7,transparent:true,opacity:.22,depthWrite:false});box(deliveryZone,zoneMat,0,0,0,2.2,.05,1.5);for(const [x,z] of [[-1,-.65],[-1,.65],[1,-.65],[1,.65]])cyl(deliveryZone,M.signal,x,.18,z,.07,.35);
function createBeacon(parent,color='#f2bf62',height=1.5){const g=group(parent,0,height,0);const bm=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.78,depthTest:false});for(const y of [0,.28]){const ring=part(g,new THREE.TorusGeometry(.34,.035,6,20),bm,0,y,0,1,1,1);ring.rotation.x=Math.PI/2;}const pin=part(g,G.cone,bm,0,.62,0,.12,.3,.12);pin.rotation.z=Math.PI;g.userData.beacon=true;return g;}
const rebarBeacon=createBeacon(rebarCargo,'#efb956',1.25),palletBeacon=createBeacon(palletCargo,'#62bde2',1.15);palletBeacon.visible=false;
const targetBeacon=createBeacon(deliveryZone,'#91d86d',1.3);
const unloadZone=group(scene,8,.66,6.4);box(unloadZone,zoneMat,0,0,0,3,.04,2);const unloadBeacon=createBeacon(unloadZone,'#ef9b55',.9);unloadZone.visible=false;

// Desk-scale objects tell the story: plans, notebook, tape, pencil, tools and control dials.
function blueprint(){const c=document.createElement('canvas');c.width=1024;c.height=768;const ctx=c.getContext('2d');ctx.fillStyle='#244c61';ctx.fillRect(0,0,1024,768);ctx.strokeStyle='#6991a1';ctx.lineWidth=1;for(let x=20;x<1024;x+=25){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,768);ctx.stroke();}for(let y=10;y<768;y+=25){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1024,y);ctx.stroke();}ctx.strokeStyle='#d0dcce';ctx.lineWidth=3;ctx.strokeRect(60,60,900,620);for(let f=0;f<5;f++){ctx.strokeRect(120,150+f*83,420,12);for(let x=125;x<550;x+=95)ctx.strokeRect(x,160+f*83,10,70);}ctx.strokeRect(640,160,230,320);for(let x=640;x<880;x+=58)ctx.strokeRect(x,160,8,320);ctx.font='25px monospace';ctx.fillStyle='#d5e1d5';ctx.fillText('ATELIER / STRUCTURAL STUDY',70,720);ctx.font='17px monospace';ctx.fillText('BUILDING A     1:100     05',630,540);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const desk=group(scene);const planMat=mat('#ffffff');planMat.map=blueprint();const paper=box(desk,planMat,-5,-.21,12.8,7,.05,4.1); // top-specific map via material array keeps drawings correctly oriented
paper.material=[M.blue,M.blue,planMat,M.blue,M.blue,M.blue];paper.rotation.y=-.13;
box(desk,M.darkSteel,5,-.1,12.6,2.6,.27,3.8);box(desk,M.bag,5,-.03,12.6,2.4,.16,3.55);box(desk,M.green,5,.09,12.6,2.6,.07,3.8);for(let z=11;z<14.3;z+=.27){const ring=part(desk,new THREE.TorusGeometry(.11,.025,5,10),M.steel,3.69,.1,z,1,1,1);ring.rotation.y=Math.PI/2;}
const note=box(desk,M.yellow,7.4,-.19,12.3,1.5,.045,1.5);note.rotation.y=.1;
box(desk,M.yellow,-10,-.02,12.5,1.3,.55,1.2);box(desk,M.black,-10,.28,12.5,.75,.08,.75);box(desk,M.bag,-8.8,-.2,12.5,1.2,.025,.24);for(let i=0;i<12;i++)box(desk,M.black,-9.3+i*.09,-.177,12.5,.015,.01,.15);
const pencil=beam(desk,M.orange,[-1,-.15,12],[1.2,-.15,13.2],.12);beam(desk,M.steel,[1.2,-.15,13.2],[1.4,-.15,13.31],.07);
for(let i=0;i<3;i++){cyl(desk,M.darkSteel,15,.04,2+i*2,.5,.5);cyl(desk,M.steel,15,.3,2+i*2,.4,.025);box(desk,M.white,15,.325,1.78+i*2,.03,.02,.23);}
beam(desk,M.steel,[14,-.15,10],[16,-.15,9],.14);const wrench=part(desk,new THREE.TorusGeometry(.3,.1,6,12,Math.PI*1.6),M.steel,16,-.15,9,1,1,1);wrench.rotation.x=Math.PI/2;
sign(desk,'ATELIER   /   SITE 05',0,-.09,10.58,4.2,.35,'#293b35');batch(desk);
const walker=createWorker(scene,0,.64,7.4,2);batch(walker);

const simulator=(()=>{
  const panel=document.querySelector('#control-panel'),grid=document.querySelector('#control-grid'),cargoButton=document.querySelector('#cargo-action'),cameraButton=document.querySelector('#camera-mode'),telemetry=document.querySelector('#telemetry'),status=document.querySelector('#control-status'),operateButton=document.querySelector('#operate-device'),adjustButton=document.querySelector('#adjust-view'),joystickBase=document.querySelector('#joystick-base'),joystickStick=document.querySelector('#joystick-stick');
  const input=new Set(),pointerActions=new Map(),joystick={pointerId:null,x:0,y:0};let mode='observe',active=null,selectedId=null,cameraMode='sandbox',viewAdjust=false,nearCargo=null,task=0,lastBlocked=0;
  const configs={
    craneA:{title:'塔吊 A',type:'摇杆旋转 · 右手吊装',buttons:[['hookUp','↑','吊钩'],['hookDown','↓','吊钩'],['trolleyIn','←','小车'],['trolleyOut','→','小车']]},
    craneB:{title:'塔吊 B',type:'摇杆旋转 · 右手吊装',buttons:[['hookUp','↑','吊钩'],['hookDown','↓','吊钩'],['trolleyIn','←','小车'],['trolleyOut','→','小车']]},
    excavator:{title:'挖掘机 01',type:'摇杆驾驶 · 双手联动',buttons:[['boomUp','↑','大臂'],['boomDown','↓','大臂'],['stickUp','↑','小臂'],['stickDown','↓','小臂'],['bucketUp','↑','铲斗'],['bucketDown','↓','铲斗']]},
    truck:{title:'工程卡车 02',type:'摇杆驾驶',buttons:[['brake','●','刹车']]},
    mixer:{title:'搅拌车 03',type:'摇杆驾驶',buttons:[['brake','●','刹车']]},
    forklift:{title:'叉车 04',type:'摇杆驾驶 · 货叉控制',buttons:[['forkUp','↑','货叉'],['forkDown','↓','货叉']]},
    van:{title:'施工车辆 05',type:'摇杆驾驶',buttons:[['brake','●','刹车']]}
  };
  const buzz=(ms=10)=>{try{navigator.vibrate?.(ms);}catch{}}
  const resetJoystick=()=>{joystick.pointerId=null;joystick.x=joystick.y=0;joystickStick.style.transform='translate3d(0,0,0)';joystickBase.classList.remove('active');};
  const stop=()=>{input.clear();pointerActions.clear();resetJoystick();grid.querySelectorAll('.active').forEach(b=>b.classList.remove('active'));};
  function releasePointer(pointerId){const action=pointerActions.get(pointerId);if(!action)return;pointerActions.delete(pointerId);if(![...pointerActions.values()].includes(action))input.delete(action);grid.querySelectorAll(`[data-hold="${action}"]`).forEach(button=>button.classList.toggle('active',[...pointerActions.values()].includes(action)));}
  function bindHold(button,action){const start=e=>{e.preventDefault();pointerActions.set(e.pointerId,action);input.add(action);button.classList.add('active');status.textContent='设备运行';buzz();};const end=e=>{e.preventDefault();releasePointer(e.pointerId);};button.addEventListener('pointerdown',start,{passive:false});button.addEventListener('pointerup',end,{passive:false});button.addEventListener('pointercancel',stop,{passive:false});}
  function renderButtons(config){grid.replaceChildren();for(const [action,icon,label] of config.buttons){const b=document.createElement('button');b.dataset.hold=action;b.innerHTML=`<span>${icon}</span><small>${label}</small>`;bindHold(b,action);grid.append(b);}}
  function resolve(id){if(id.startsWith('crane'))return cranes.find(c=>c.id===id);if(id==='excavator')return excavator.userData.rig;return vehicles.find(v=>v.id===id);}
  function select(id){selectedId=configs[id]?id:null;operateButton.hidden=!selectedId;operateButton.textContent=selectedId?'操作设备':'操作设备';}
  function enter(id=selectedId){if(!configs[id])return;stop();selectedId=id;mode=id;active=resolve(id);cameraMode='sandbox';viewAdjust=false;controls.enabled=false;controls.autoRotate=false;document.querySelector('#rotate').setAttribute('aria-pressed','false');document.body.classList.add('controlling');document.body.classList.remove('view-adjust');document.querySelector('#info').hidden=true;panel.hidden=false;document.querySelector('#control-title').textContent=configs[id].title;document.querySelector('#control-type').textContent=configs[id].type;renderButtons(configs[id]);cameraButton.hidden=false;cameraButton.textContent='📷';cameraButton.setAttribute('aria-label','切换相机：沙盘视角');adjustButton.textContent='调整视角';cargoButton.hidden=true;updateAction();snapCamera();if(innerWidth<innerHeight&&!sessionStorage.getItem('landscape-tip')){toast('横屏操作体验更好');sessionStorage.setItem('landscape-tip','1');}}
  function exit(){stop();mode='observe';active=null;viewAdjust=false;panel.hidden=true;document.body.classList.remove('controlling','view-adjust');controls.enabled=true;cameraMode='sandbox';resetCamera();}
  function worldDistanceXZ(a,b){const pa=new THREE.Vector3(),pb=new THREE.Vector3();a.getWorldPosition(pa);b.getWorldPosition(pb);return {flat:Math.hypot(pa.x-pb.x,pa.z-pb.z),vertical:Math.abs(pa.y-pb.y),pa,pb};}
  function updateCraneCable(rig){const L=rig.cableLength;for(const cable of rig.cables){cable.scale.y=L/4.7;cable.position.y=-L/2;}rig.block.position.y=-L;}
  function updateTelemetry(){if(mode.startsWith('crane')){const d=active.cargo?null:worldDistanceXZ(active.block,rebarCargo);telemetry.innerHTML=`<div>吊钩高度<b>${(active.height-active.cableLength).toFixed(1)} m</b></div><div>小车距离<b>${active.trolleyX.toFixed(1)} m</b></div><div>${active.cargo?'载荷':'距货物'}<b>${active.cargo?'钢筋束':d?`${Math.hypot(d.flat,d.vertical).toFixed(1)} m`:'—'}</b></div>`;}else if(mode==='excavator'){telemetry.innerHTML=`<div>大臂角度<b>${Math.round(THREE.MathUtils.radToDeg(active.boom.rotation.z))}°</b></div><div>小臂角度<b>${Math.round(THREE.MathUtils.radToDeg(active.stick.rotation.z))}°</b></div><div>铲斗角度<b>${Math.round(THREE.MathUtils.radToDeg(active.bucket.rotation.z))}°</b></div>`;}else{const speed=(input.has('forward')||input.has('backward'))?'行驶':'静止';telemetry.innerHTML=`<div>状态<b>${speed}</b></div><div>转向<b>${input.has('left')?'左':input.has('right')?'右':'直行'}</b></div><div>${mode==='forklift'?'货叉':'视角'}<b>${mode==='forklift'?`${active.root.userData.forkHeight.toFixed(1)} m`:cameraMode==='cab'?'驾驶室':'外部'}</b></div>`;}}
  function updateAction(){nearCargo=null;if(mode.startsWith('crane')){if(active.cargo){cargoButton.hidden=false;cargoButton.textContent='放下';status.textContent='运输中';updateTelemetry();return;}for(const cargo of liftables){if(cargo.parent===scene){const d=worldDistanceXZ(active.block,cargo);if(d.flat<.85&&d.vertical<.9){nearCargo=cargo;break;}}}cargoButton.hidden=!nearCargo;cargoButton.textContent='吊起';status.textContent=nearCargo?'可吊起':'对准货物';}else if(mode==='forklift'){if(active.root.userData.load){cargoButton.hidden=false;cargoButton.textContent='卸货';status.textContent='已装载';}else{const d=worldDistanceXZ(active.root.userData.fork,palletCargo);nearCargo=palletCargo.parent===scene&&d.flat<1.8&&d.vertical<1.1?palletCargo:null;cargoButton.hidden=!nearCargo;cargoButton.textContent='装载';status.textContent=nearCargo?'可装载':'接近托盘';}}else{cargoButton.hidden=true;status.textContent='控制中';}updateTelemetry();}
  function cargoAction(){if(mode.startsWith('crane')){if(active.cargo){const cargo=active.cargo;scene.attach(cargo);cargo.position.y=Math.max(.9,cargo.position.y);active.cargo=null;toast('货物已放下');checkTask(cargo);}else if(nearCargo){active.block.attach(nearCargo);nearCargo.position.set(0,-.72,0);active.cargo=nearCargo;toast('钢筋已连接吊钩');}}else if(mode==='forklift'){const root=active.root;if(root.userData.load){const distance=root.position.distanceTo(root.userData.loadOrigin);scene.attach(root.userData.load);root.userData.load.position.y=Math.max(.86,root.userData.load.position.y);root.userData.load=null;if(task===1&&distance>4){toast('货物已卸下');completeTask();}else toast(task===1?'运输距离不足，请继续运往道路另一端':'货物已卸下');}else if(nearCargo){root.userData.fork.attach(nearCargo);nearCargo.position.set(-1.35,.28,0);root.userData.load=nearCargo;root.userData.loadOrigin=root.position.clone();toast('托盘已装载');}}updateAction();}
  function completeTask(){const card=document.querySelector('#task-card');card.classList.add('done');document.querySelector('#task-title').textContent='任务完成 ✓';card.querySelector('.task-progress i').style.width='100%';toast('任务完成 ✓');if(task>=2){document.querySelector('#task-text').textContent='三项施工任务全部完成。';document.querySelector('#task-action').textContent='自由施工';return;}setTimeout(()=>{task++;card.classList.remove('done');document.querySelector('#task-number').textContent=String(task+1).padStart(2,'0');if(task===1){rebarBeacon.visible=false;targetBeacon.visible=false;palletBeacon.visible=true;document.querySelector('#task-title').textContent='水泥运输';document.querySelector('#task-text').textContent='驾驶叉车装载水泥托盘，并运输至少 4 米后卸货。';card.querySelector('.task-progress i').style.width='45%';}else{palletBeacon.visible=false;unloadZone.visible=true;document.querySelector('#task-title').textContent='卸料区就位';document.querySelector('#task-text').textContent='驾驶工程卡车驶入橙色卸料区。';card.querySelector('.task-progress i').style.width='72%';}document.querySelector('#task-action').textContent='继续任务';},1600);}
  function checkTask(cargo){if(task===0&&cargo.userData.type==='rebar'){const p=new THREE.Vector3();cargo.getWorldPosition(p);if(Math.abs(p.x-1.35)<1.4&&Math.abs(p.z+3.15)<1.2&&p.y>2.2&&p.y<4.2)completeTask();}}
  function canMove(vehicle,next){if(Math.abs(next.x)>11.2-vehicle.radius||Math.abs(next.z)>8.1-vehicle.radius)return false;if(next.x>-7.4-vehicle.radius&&next.x<3.4+vehicle.radius&&next.z>-5.1-vehicle.radius&&next.z<2.2+vehicle.radius)return false;for(const other of vehicles){if(other!==vehicle&&Math.hypot(next.x-other.root.position.x,next.z-other.root.position.z)<vehicle.radius+other.radius*.75)return false;}return true;}
  function drive(vehicle,dt){const root=vehicle.root;const move=input.has('brake')?0:-joystick.y;const steer=joystick.x;if(Math.abs(steer)>.05)root.rotation.y-=steer*dt*1.18*(move<-.05?-1:1);if(Math.abs(move)>.05){const distance=move*dt*2.8;const next=root.position.clone().add(new THREE.Vector3(Math.cos(root.rotation.y)*distance,0,-Math.sin(root.rotation.y)*distance));if(canMove(vehicle,next)){root.position.copy(next);vehicle.wheelRotation=(vehicle.wheelRotation||0)+distance/.3;for(const wheel of vehicle.wheels||[])wheel.rotation.y=vehicle.wheelRotation;if(task===2&&vehicle.id==='truck'&&root.position.x>7&&root.position.z>5)completeTask();}else if(performance.now()-lastBlocked>1200){lastBlocked=performance.now();toast('前方有障碍');}}if(vehicle.id==='forklift'){const delta=((input.has('forkUp')?1:0)-(input.has('forkDown')?1:0))*dt*.8;root.userData.forkHeight=THREE.MathUtils.clamp(root.userData.forkHeight+delta,.2,1.45);root.userData.fork.position.y=root.userData.forkHeight;}}
  function operateCrane(rig,dt){rig.rotor.rotation.y+=joystick.x*dt*.72;rig.cableLength=THREE.MathUtils.clamp(rig.cableLength+((input.has('hookDown')?1:0)-(input.has('hookUp')?1:0))*dt*3.1,1.1,rig.height-1);rig.trolleyX=THREE.MathUtils.clamp(rig.trolleyX+((input.has('trolleyOut')?1:0)-(input.has('trolleyIn')?1:0))*dt*3,1.25,8.1);rig.trolley.position.x=rig.trolleyX;updateCraneCable(rig);}
  function operateExcavator(rig,dt){drive({root:rig.root,wheels:[],radius:1.45,id:'excavator'},dt);const moveJoint=(node,up,down,limits)=>node.rotation.z=THREE.MathUtils.clamp(node.rotation.z+((input.has(up)?1:0)-(input.has(down)?1:0))*dt*.75,...limits);moveJoint(rig.boom,'boomUp','boomDown',rig.limits.boom);moveJoint(rig.stick,'stickUp','stickDown',rig.limits.stick);moveJoint(rig.bucket,'bucketUp','bucketDown',rig.limits.bucket);}
  function snapCamera(){if(mode==='observe'||!active)return;const root=active.root,deviceFocus=root.position.clone().add(new THREE.Vector3(0,mode.startsWith('crane')?active.height*.46:1,0)),focus=new THREE.Vector3();(mode.startsWith('crane')?active.block:root).getWorldPosition(focus);if(cameraMode==='sandbox')camera.position.copy(root.position).add(mode.startsWith('crane')?new THREE.Vector3(26,21,26):new THREE.Vector3(12,9,12));else if(cameraMode==='chase'){const offset=mode.startsWith('crane')?new THREE.Vector3(5,4,5):new THREE.Vector3(-7,5.2,0).applyQuaternion(root.quaternion);camera.position.copy(focus).add(offset);}else{const cab=mode.startsWith('crane')?new THREE.Vector3(.3,active.height+.7,1.2):new THREE.Vector3(-.55,1.45,0).applyQuaternion(root.quaternion).add(root.position);camera.position.copy(cab);}camera.lookAt(cameraMode==='sandbox'?deviceFocus:cameraMode==='cab'?(mode.startsWith('crane')?focus:new THREE.Vector3(2,1,0).applyQuaternion(root.quaternion).add(root.position)):focus);}
  function followCamera(dt){if(mode==='observe'||viewAdjust||cameraMode==='sandbox')return;const root=active.root,focus=new THREE.Vector3();(mode.startsWith('crane')?active.block:root).getWorldPosition(focus);let desired,look;if(mode.startsWith('crane')){desired=cameraMode==='cab'?new THREE.Vector3(.3,active.height+.7,1.2).add(root.position):focus.clone().add(new THREE.Vector3(5,4,5));look=focus;}else{desired=(cameraMode==='cab'?new THREE.Vector3(-.55,1.45,0):new THREE.Vector3(-7,5.2,0)).applyQuaternion(root.quaternion).add(root.position);look=new THREE.Vector3(2,1,0).applyQuaternion(root.quaternion).add(root.position);}camera.position.lerp(desired,1-Math.pow(.002,dt));camera.lookAt(look);}
  function update(dt){if(mode!=='observe'&&!viewAdjust){if(mode.startsWith('crane'))operateCrane(active,dt);else if(mode==='excavator')operateExcavator(active,dt);else drive(active,dt);updateAction();followCamera(dt);}}
  function toggleCamera(){cameraMode=cameraMode==='sandbox'?'chase':cameraMode==='chase'?'cab':'sandbox';cameraButton.setAttribute('aria-label',`切换相机：${cameraMode==='sandbox'?'沙盘':cameraMode==='chase'?'第三人称':'第一人称'}视角`);snapCamera();buzz();}
  function toggleAdjust(){if(mode==='observe')return;stop();viewAdjust=!viewAdjust;controls.enabled=viewAdjust;document.body.classList.toggle('view-adjust',viewAdjust);adjustButton.textContent=viewAdjust?'继续操作':'调整视角';if(viewAdjust){const p=new THREE.Vector3();active.root.getWorldPosition(p);controls.target.copy(p).add(new THREE.Vector3(0,1,0));controls.update();}else snapCamera();}
  function focusMission(){const id=task===0?'craneA':task===1?'forklift':'truck';select(id);focusDevice(id);}
  function resetMission(){stop();if(task===0){const rig=cranes[0];if(rig.cargo){scene.attach(rig.cargo);rig.cargo=null;}rig.rotor.rotation.y=rig.angle;rig.trolleyX=5.8;rig.trolley.position.x=5.8;rig.cableLength=4.7;updateCraneCable(rig);rig.root.updateMatrixWorld(true);const p=new THREE.Vector3();rig.block.getWorldPosition(p);rebarCargo.position.set(p.x,.92,p.z);rebarBeacon.visible=true;targetBeacon.visible=true;}else if(task===1){if(forklift.userData.load){scene.attach(forklift.userData.load);forklift.userData.load=null;}forklift.position.set(-9,.62,4.9);forklift.rotation.y=0;forklift.userData.forkHeight=.2;forklift.userData.fork.position.y=.2;palletCargo.position.set(-10.5,.86,4.9);palletBeacon.visible=true;}else{truck.position.set(-4,.62,6.5);truck.rotation.y=0;}updateAction();snapCamera();toast('当前任务已重置');}
  function prepareCranePickup(){if(!mode.startsWith('crane'))enter('craneA');active.cableLength=active.height-1;updateCraneCable(active);const p=new THREE.Vector3();active.block.getWorldPosition(p);rebarCargo.position.set(p.x,p.y-.55,p.z);rebarCargo.updateMatrixWorld(true);updateAction();}
  function snapshot(){const crane=cranes[0],v=mode==='excavator'?null:active,cargoWorld=new THREE.Vector3();rebarCargo.getWorldPosition(cargoWorld);return{mode,selectedId,cameraMode,viewAdjust,inputCount:input.size+(joystick.pointerId===null?0:1),joystick:{x:joystick.x,y:joystick.y},task,crane:{rotation:crane.rotor.rotation.y,hookHeight:crane.height-crane.cableLength,trolley:crane.trolleyX,cargoAttached:!!crane.cargo,cargoWorld:cargoWorld.toArray()},excavator:{boom:excavator.userData.rig.boom.rotation.z,stick:excavator.userData.rig.stick.rotation.z,bucket:excavator.userData.rig.bucket.rotation.z},vehicle:v?.root?{position:v.root.position.toArray(),rotation:v.root.rotation.y,wheelRotation:v.wheelRotation,forkHeight:v.root.userData.forkHeight||null,loaded:!!v.root.userData.load}:null};}
  function updateJoystick(e){const r=joystickBase.getBoundingClientRect(),max=r.width*.34,dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),len=Math.hypot(dx,dy)||1,scale=Math.min(1,max/len),x=dx*scale,y=dy*scale;joystick.x=x/max;joystick.y=y/max;joystickStick.style.transform=`translate3d(${x}px,${y}px,0)`;}
  joystickBase.addEventListener('pointerdown',e=>{if(joystick.pointerId!==null)return;e.preventDefault();joystick.pointerId=e.pointerId;joystickBase.classList.add('active');updateJoystick(e);buzz();},{passive:false});
  joystickBase.addEventListener('pointermove',e=>{if(e.pointerId===joystick.pointerId){e.preventDefault();updateJoystick(e);}},{passive:false});
  joystickBase.addEventListener('pointerup',e=>{if(e.pointerId===joystick.pointerId)resetJoystick();},{passive:false});joystickBase.addEventListener('pointercancel',stop,{passive:false});
  function focusDevice(id){const target=resolve(id)?.root;if(!target)return;const box3=new THREE.Box3().setFromObject(target),center=box3.getCenter(new THREE.Vector3()),size=box3.getSize(new THREE.Vector3()).length();controls.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(size*.8,size*.55,size*.8));controls.update();}
  cargoButton.addEventListener('click',()=>{cargoAction();buzz(25);});cameraButton.addEventListener('click',toggleCamera);adjustButton.addEventListener('click',toggleAdjust);operateButton.addEventListener('click',()=>enter());document.querySelector('#exit-control').addEventListener('click',exit);document.querySelector('#task-action').addEventListener('click',focusMission);document.querySelector('#mission-reset').addEventListener('click',resetMission);document.querySelector('#control-reset').addEventListener('click',resetMission);window.addEventListener('pointermove',e=>{if(e.pointerId===joystick.pointerId)updateJoystick(e);},{passive:false});window.addEventListener('pointerup',e=>{releasePointer(e.pointerId);if(e.pointerId===joystick.pointerId)resetJoystick();},true);window.addEventListener('pointercancel',stop,true);window.addEventListener('touchcancel',stop,{passive:true,capture:true});window.addEventListener('blur',stop);window.addEventListener('orientationchange',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  return{select,enter,exit,update,snapshot,prepareCranePickup,focusMission,focusDevice,layoutCamera:snapCamera,resetMission,stop};
})();

// Selection respects drag gestures and multi-touch: only a short, single-pointer tap picks.
const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();let selected=null,highlighted=[];
function clearSelection(){for(const [o,m] of highlighted){o.material.dispose();o.material=m;}highlighted=[];selected=null;document.querySelector('#info').hidden=true;document.querySelector('#operate-device').hidden=true;simulator.select(null);}
function selectObject(root){clearSelection();if(!root)return;selected=root;root.traverse(o=>{if(o.isMesh){const original=o.material;const glow=original.clone();glow.emissive.set('#e9ba59');glow.emissiveIntensity=.23;o.material=glow;highlighted.push([o,original]);}});const info=root.userData.info;document.querySelector('#info-kind').textContent=info.kind;document.querySelector('#info-title').textContent=info.title;document.querySelector('#info-en').textContent=info.en;const details=document.querySelector('#info-details');details.replaceChildren(...info.details.map(t=>{const d=document.createElement('div');d.textContent=t;return d;}));document.querySelector('#info').hidden=false;simulator.select(root.userData.deviceId||null);}
const activePointers=new Set();let down=null,multi=false;
renderer.domElement.addEventListener('pointerdown',e=>{activePointers.add(e.pointerId);if(activePointers.size>1)multi=true;else{multi=false;down={x:e.clientX,y:e.clientY,time:performance.now(),button:e.button};}});
let lastTap={target:null,time:0};
renderer.domElement.addEventListener('pointerup',e=>{activePointers.delete(e.pointerId);if(!down||multi||down.button!==0||performance.now()-down.time>650||Math.hypot(e.clientX-down.x,e.clientY-down.y)>8)return;pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(selectable,true);let target=hits[0]?.object;while(target&&!target.userData.info)target=target.parent;const now=performance.now(),isDouble=target&&lastTap.target===target&&now-lastTap.time<360;selectObject(target);if(isDouble&&target.userData.deviceId)simulator.focusDevice(target.userData.deviceId);lastTap={target,time:now};down=null;});
renderer.domElement.addEventListener('pointercancel',e=>{activePointers.delete(e.pointerId);down=null;});
document.querySelector('#close').onclick=clearSelection;
document.querySelector('#reset').onclick=()=>{controls.autoRotate=false;document.querySelector('#rotate').setAttribute('aria-pressed','false');resetCamera();clearSelection();};
document.querySelector('#rotate').onclick=e=>{controls.autoRotate=!controls.autoRotate;e.currentTarget.setAttribute('aria-pressed',String(controls.autoRotate));};
document.querySelectorAll('#equipment-dock [data-device]').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.device,root=selectable.find(o=>o.userData.deviceId===id);selectObject(root);simulator.focusDevice(id);}));
function toast(t){const el=document.querySelector('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3000);}
document.querySelector('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('当前浏览器不支持页面全屏，可横屏查看。');}catch{toast('浏览器未允许全屏，可横屏查看。');}};
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(simulator.snapshot().mode==='observe')resetCamera();else simulator.layoutCamera();});
const tutorial=document.querySelector('#tutorial');try{if(localStorage.getItem('site-tutorial-seen'))tutorial.hidden=true;}catch{}
document.querySelector('#tutorial-start').addEventListener('click',()=>{tutorial.hidden=true;try{localStorage.setItem('site-tutorial-seen','1');}catch{}buzzTutorial();});
function buzzTutorial(){try{navigator.vibrate?.(15);}catch{}}
const clock=new THREE.Clock();let time=0;
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.06);if(document.hidden)return;time+=dt;M.signal.emissiveIntensity=1.2+Math.max(0,Math.sin(time*3))*2;scene.traverse(o=>{if(o.userData.beacon){const pulse=1+Math.sin(time*2.5)*.1;o.scale.setScalar(pulse);o.rotation.y+=dt*.7;}});simulator.update(dt);
 if(controls.enabled){controls.update();const bounded=controls.target.clone();bounded.x=THREE.MathUtils.clamp(bounded.x,-5,5);bounded.y=THREE.MathUtils.clamp(bounded.y,1,7);bounded.z=THREE.MathUtils.clamp(bounded.z,-4,4);camera.position.add(bounded.clone().sub(controls.target));controls.target.copy(bounded);}renderer.render(scene,camera);}
animate();document.querySelector('#loading').hidden=true;
// Read-only scene diagnostics aid reproducible browser checks and future expansion.
window.siteDiagnostics={renderer,scene,camera,controls,selectable,revision:THREE.REVISION,selectObject,clearSelection,simulator,cranes,vehicles};


