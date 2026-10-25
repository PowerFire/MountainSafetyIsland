import * as THREE from 'three'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { tr } from './i18n.js'

// Twelve nodes per island: alternating hex vertices and edge midpoints.
export function createWalkingNetwork(islands, top) {
    const nodes = new Map(), neighbors = new Map(), bridgeShapes = new Map()
    function edge(a,b,shape) {
        const weight=shape?shape.reduce((n,p,i)=>i?n+p.distanceTo(shape[i-1]):0,0):nodes.get(a).distanceTo(nodes.get(b))
        neighbors.get(a).push({id:b,weight});neighbors.get(b).push({id:a,weight})
        if(shape){bridgeShapes.set(`${a}|${b}`,shape);bridgeShapes.set(`${b}|${a}`,shape.slice().reverse())}
    }
    for(const island of islands) {
        for(let k=0;k<12;k++) {
            const angle=Math.PI/6+k*Math.PI/6,r=k%2?1.64*Math.cos(Math.PI/6):1.64
            const id=`${island.data.id}:${k}`
            nodes.set(id,new THREE.Vector3(island.center.x+Math.cos(angle)*r,top+.02,island.center.z-Math.sin(angle)*r));neighbors.set(id,[])
        }
        for(let k=0;k<12;k++)edge(`${island.data.id}:${k}`,`${island.data.id}:${(k+1)%12}`)
    }
    function nearestMid(island,point){return [1,3,5,7,9,11].map(k=>`${island.data.id}:${k}`).sort((a,b)=>nodes.get(a).distanceToSquared(point)-nodes.get(b).distanceToSquared(point))[0]}
    let bridges=0
    islands.forEach((a,index)=>islands.slice(index+1).forEach(b=>{
        const dq=b.data.axial.q-a.data.axial.q,dr=b.data.axial.r-a.data.axial.r
        if(![[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]].some(([q,r])=>q===dq&&r===dr))return
        const from=nearestMid(a,b.center),to=nearestMid(b,a.center),shape=[]
        for(let n=0;n<=10;n++){const point=nodes.get(from).clone().lerp(nodes.get(to),n/10);if(n>0&&n<10)point.y=top+.10+Math.sin(n/10*Math.PI)*.085;shape.push(point)}
        edge(from,to,shape);bridges++
    }))
    function route(fromIsland,toIsland){
        const start=`${fromIsland}:1`,goal=`${toIsland}:7`
        if(!nodes.has(start)||!nodes.has(goal))throw new Error('協作路線引用未知島嶼')
        const distances=new Map([...nodes.keys()].map(id=>[id,Infinity])),previous=new Map(),pending=new Set(nodes.keys());distances.set(start,0)
        while(pending.size){let best=null;for(const id of pending)if(best===null||distances.get(id)<distances.get(best))best=id
            if(!Number.isFinite(distances.get(best)))break
            pending.delete(best);if(best===goal)break
            for(const next of neighbors.get(best)){const distance=distances.get(best)+next.weight;if(distance<distances.get(next.id)){distances.set(next.id,distance);previous.set(next.id,best)}}
        }
        if(!Number.isFinite(distances.get(goal)))throw new Error('協作步道路網不連通')
        const ids=[goal];while(ids[0]!==start)ids.unshift(previous.get(ids[0]))
        const points=[nodes.get(start).clone()]
        for(let n=1;n<ids.length;n++){const bridge=bridgeShapes.get(`${ids[n-1]}|${ids[n]}`);if(bridge)points.push(...bridge.slice(1).map(p=>p.clone()));else points.push(nodes.get(ids[n]).clone())}
        const cumulative=[0];for(let n=1;n<points.length;n++)cumulative.push(cumulative[n-1]+points[n].distanceTo(points[n-1]))
        return {points,cumulative,length:cumulative[cumulative.length-1],ids}
    }
    return {nodes,neighbors,bridges,route}
}

export function sampleRoute(route,distance){
    const d=THREE.MathUtils.clamp(distance,0,route.length)
    let k=1;while(k<route.cumulative.length-1&&route.cumulative[k]<d)k++
    const a=route.points[k-1],b=route.points[k],span=route.cumulative[k]-route.cumulative[k-1]
    return {position:a.clone().lerp(b,span?(d-route.cumulative[k-1])/span:0),direction:b.clone().sub(a).normalize()}
}

export function walkerPhase(time,walker,hold){
    const travel=walker.route.length/walker.speed,cycle=travel*2+hold*2,t=((time+walker.phase)%cycle+cycle)%cycle
    if(t<travel)return{distance:t*walker.speed,reverse:false,waiting:false,state:'outbound'}
    if(t<travel+hold)return{distance:walker.route.length,reverse:true,waiting:true,state:'handoff-to'}
    if(t<travel*2+hold)return{distance:walker.route.length-(t-travel-hold)*walker.speed,reverse:true,waiting:false,state:'inbound'}
    return{distance:0,reverse:false,waiting:true,state:'handoff-from'}
}

export function createCollaboration({scene,islands,data,random,onChange}) {
    const network=createWalkingNetwork(islands,data.world.top)
    const routes=new Map(data.flows.map(flow=>[flow.id,network.route(flow.from,flow.to)]))
    let active=null,showLines=false,showCargo=true,showNames=false,visible=true,selectedWalker=null,lastTime=0
    const lineMeshes=[]
    for(const flow of data.flows){
        const route=routes.get(flow.id),curve=new THREE.CurvePath()
        for(let n=1;n<route.points.length;n++)curve.add(new THREE.LineCurve3(route.points[n-1].clone().add(new THREE.Vector3(0,.025,0)),route.points[n].clone().add(new THREE.Vector3(0,.025,0))))
        const geometry=new THREE.TubeGeometry(curve,Math.ceil(route.length*12),.035,5,false)
        const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uLength:{value:route.length},uStyle:{value:flow.evidence==='official'?0:flow.evidence==='thematic'?1:2},uStatic:{value:0},uSelected:{value:0}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float uTime;uniform float uLength;uniform float uStyle;uniform float uStatic;uniform float uSelected;varying vec2 vUv;void main(){float u=vUv.x*uLength*5.-uTime*1.4;float style=uStatic>.5?1.:uStyle;if(style>.5&&fract(u)>(style>1.5?.3:.6))discard;gl_FragColor=vec4(mix(vec3(.86,.42,.25),vec3(.98,.78,.28),uSelected),.82);}'})
        const mesh=new THREE.Mesh(geometry,material);mesh.visible=false;mesh.userData.flowId=flow.id;scene.add(mesh);lineMeshes.push(mesh)
    }
    const walkers=[]
    data.flows.forEach(flow=>{const route=routes.get(flow.id);for(let n=0;n<data.collaboration.walkersPerFlow;n++){
        const cycling=flow.role==='cyclist',range=cycling?data.collaboration.cyclingSpeed:data.collaboration.walkingSpeed
        const speed=range[0]+random()*(range[1]-range[0])
        walkers.push({id:`${flow.id}-${n+1}`,flowId:flow.id,flow,route,speed,phase:random()*(route.length/speed*2+data.collaboration.handoffSeconds*2),position:new THREE.Vector3(),state:null})
    }})
    const count=walkers.length,parts={}
    const skin='#eac2a1',colors={leader:'#db6a41',responder:'#f4ebdd',hiker:'#6f7fb5',ranger:'#71806a',cyclist:'#3e7c8c',contact:'#fcea8b',volunteer:'#58a6a6'}
    function part(name,geometry,material,perWalker=1){const mesh=new THREE.InstancedMesh(geometry,material,count*perWalker);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.userData.walkers=walkers;mesh.userData.perWalker=perWalker;scene.add(mesh);parts[name]=mesh;return mesh}
    const solid=new THREE.MeshStandardMaterial({roughness:.85})
    const bodyGeometry=BufferGeometryUtils.mergeBufferGeometries([new THREE.CylinderGeometry(.05,.05,.09,8).toNonIndexed(),new THREE.SphereGeometry(.05,8,6).translate(0,.045,0).toNonIndexed(),new THREE.SphereGeometry(.05,8,6).translate(0,-.045,0).toNonIndexed()])
    part('body',bodyGeometry,solid)
    part('head',new THREE.SphereGeometry(.07,10,8),solid)
    part('hair',new THREE.SphereGeometry(.072,10,6,0,Math.PI*2,0,Math.PI/2),solid)
    part('limbs',new THREE.CylinderGeometry(.014,.014,.09,6),solid,4)
    part('eyes',new THREE.SphereGeometry(.009,6,4),solid,2)
    part('pack',new THREE.BoxGeometry(.075,.09,.035),solid)
    part('badge',new THREE.BoxGeometry(.024,.03,.008),solid)
    part('bikeframe',new THREE.BoxGeometry(.012,.012,.16),solid,2)
    const wheels=part('wheels',new THREE.TorusGeometry(.06,.008,5,12),solid,2)
    const shadow=part('shadow',new THREE.CircleGeometry(.09,12).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#211d1d',transparent:true,opacity:.22,depthWrite:false}))
    const dummy=new THREE.Object3D(),root=new THREE.Object3D(),matrix=new THREE.Matrix4()
    function set(name,index,position,rotation=[0,0,0],scale=[1,1,1],color='#211d1d'){
        dummy.position.set(...position);dummy.rotation.set(...rotation);dummy.scale.set(...scale);dummy.updateMatrix();matrix.multiplyMatrices(root.matrix,dummy.matrix);parts[name].setMatrixAt(index,matrix);parts[name].setColorAt(index,new THREE.Color(color))
    }
    const textures=new Map()
    function cargoTexture(icon){
        if(textures.has(icon))return textures.get(icon)
        const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d')
        c.fillStyle='#fff8f4';c.strokeStyle='#db6a41';c.lineWidth=7;c.beginPath();c.arc(64,64,54,0,Math.PI*2);c.fill();c.stroke();c.strokeStyle='#211d1d';c.lineWidth=5;c.lineJoin='round'
        if(icon==='compass'){c.beginPath();c.arc(64,64,28,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(76,42);c.lineTo(51,78);c.lineTo(69,68);c.closePath();c.stroke()}
        else if(icon==='kit'){c.strokeRect(34,42,60,45);c.beginPath();c.moveTo(64,50);c.lineTo(64,79);c.moveTo(49,64);c.lineTo(79,64);c.stroke()}
        else if(icon==='bag'){c.strokeRect(39,45,50,44);c.beginPath();c.arc(64,45,14,Math.PI,0);c.stroke()}
        else if(icon==='map'){c.beginPath();c.moveTo(31,40);c.lineTo(53,32);c.lineTo(75,42);c.lineTo(97,34);c.lineTo(97,88);c.lineTo(75,96);c.lineTo(53,86);c.lineTo(31,94);c.closePath();c.moveTo(53,32);c.lineTo(53,86);c.moveTo(75,42);c.lineTo(75,96);c.stroke()}
        else if(icon==='box'){c.strokeRect(34,43,60,48);c.beginPath();c.moveTo(34,43);c.lineTo(48,31);c.lineTo(82,31);c.lineTo(94,43);c.moveTo(64,43);c.lineTo(64,91);c.stroke()}
        else{c.strokeRect(38,34,52,61);for(let n=0;n<3;n++){c.beginPath();c.moveTo(47,48+n*14);c.lineTo(80,48+n*14);c.stroke()}}
        const texture=new THREE.CanvasTexture(canvas);textures.set(icon,texture);return texture
    }
    walkers.forEach(w=>{
        w.sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:cargoTexture(w.flow.icon),depthTest:false,transparent:true}));w.sprite.scale.set(.22,.22,.22);w.sprite.userData.walkerId=w.id;scene.add(w.sprite)
        const bubble=document.createElement('button');bubble.className='walker-name';bubble.type='button';bubble.textContent=tr(`正在搬 ${w.flow.cargo.zh}`);bubble.hidden=true;w.bubble=bubble
        w.nameLabel=new CSS2DObject(bubble);scene.add(w.nameLabel)
    })
    const events=[]
    let eventSequence = 0
    function emit(event) { events.push({ ...event, id: ++eventSequence }); if(events.length>data.journal.maxEvents)events.splice(0,events.length-data.journal.maxEvents) }
    function visibility(){
        for(const mesh of lineMeshes){const flow=data.flows.find(f=>f.id===mesh.userData.flowId);mesh.visible=showLines||Boolean(active&&(active.flowId===flow.id||(!active.flowId&&(active.islandId===flow.from||active.islandId===flow.to))));mesh.material.uniforms.uSelected.value=active?.flowId===flow.id?1:0}
        document.querySelector('#flow-legend').hidden=!lineMeshes.some(m=>m.visible)
        Object.values(parts).forEach(mesh=>mesh.visible=visible)
        walkers.forEach(w=>{w.sprite.visible=visible&&showCargo&&w.near})
        onChange()
    }
    function update(time,distance,reduced){
        lastTime=time
        lineMeshes.forEach(mesh=>{mesh.material.uniforms.uTime.value=time;mesh.material.uniforms.uStatic.value=reduced?1:0})
        const size=THREE.MathUtils.clamp(distance/20,1,1.45)
        walkers.forEach((w,i)=>{
            const phase=walkerPhase(time,w,data.collaboration.handoffSeconds),sample=sampleRoute(w.route,phase.distance)
            w.position.copy(sample.position);if(phase.reverse)sample.direction.negate()
            if(w.state&&w.state!==phase.state){
                const event={time,walkerId:w.id,flowId:w.flowId,islandId:phase.reverse?w.flow.to:w.flow.from}
                if(phase.waiting)emit({...event,type:'arrive'})
                else { emit({...event,type:'handoff'});emit({...event,type:'depart'}) }
            }
            w.state=phase.state
            const ph=time*9+w.phase*20,swing=phase.waiting?0:Math.sin(ph),bounce=phase.waiting?0:Math.abs(Math.sin(ph))*.012
            root.position.copy(w.position);root.rotation.set(0,Math.atan2(sample.direction.x,sample.direction.z),0);root.scale.setScalar(size);root.updateMatrix()
            const tint=selectedWalker===w.id?'#fcea8b':colors[w.flow.role]
            set('body',i,[0,.17+bounce,0],[0,0,0],[1,1,1],tint)
            set('head',i,[0,.30+bounce,0],[0,0,0],[1,1,1],skin)
            set('hair',i,[0,.305+bounce,0],[0,0,0],[1,1,1],w.flow.role==='ranger'?'#71806a':w.flow.role==='cyclist'?'#fcea8b':'#574637')
            for(let n=0;n<4;n++){const leg=n<2,side=n%2?1:-1;set('limbs',i*4+n,[side*(leg?.024:.065),(leg?.065:.175)+bounce,0],[swing*side*(leg?.55:-.45),0,leg?0:side*.12],[1,1,1],leg?'#40372e':skin)}
            for(let n=0;n<2;n++)set('eyes',i*2+n,[(n?1:-1)*.025,.31+bounce,.063],[0,0,0],[1,1,1],'#211d1d')
            set('pack',i,[0,.18+bounce,-.06],[0,0,0],[1,1,1],w.flow.role==='responder'?'#db6a41':'#b48560')
            set('badge',i,[0,.19+bounce,.05],[0,0,0],[1,1,1],'#fff8f4')
            for(let n=0;n<2;n++)set('wheels',i*2+n,[0,.065,n?.09:-.09],[0,Math.PI/2,0],w.flow.role==='cyclist'?[1,1,1]:[0,0,0],'#40372e')
            for(let n=0;n<2;n++)set('bikeframe',i*2+n,[0,.11+n*.025,0],[n?.45:0,0,0],w.flow.role==='cyclist'?[1,1,1]:[0,0,0],'#db6a41')
            set('shadow',i,[0,.003,0],[0,0,0],[1,1,1])
            w.near=distance<16;w.sprite.position.copy(w.position).add(new THREE.Vector3(0,.57*size,0));w.sprite.visible=visible&&showCargo&&w.near
            w.nameLabel.position.copy(w.position).add(new THREE.Vector3(0,.79*size,0));w.bubble.hidden=!(visible&&showNames&&distance<14)
        })
        Object.values(parts).forEach(mesh=>{mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true})
    }
    const pickables=()=>[...Object.entries(parts).filter(([name])=>name!=='shadow').map(([,mesh])=>mesh),...lineMeshes.filter(m=>m.visible),...walkers.filter(w=>w.sprite.visible).map(w=>w.sprite)].filter(m=>m.visible)
    function resolveHit(hit){if(hit.object.userData.flowId)return{flowId:hit.object.userData.flowId};if(hit.object.userData.walkerId)return{walkerId:hit.object.userData.walkerId};if(hit.object.userData.walkers){const w=walkers[Math.floor(hit.instanceId/hit.object.userData.perWalker)];return{walkerId:w.id}}return null}
    return {network,routes,walkers,events,update,pickables,resolveHit,
        setSelection(selection){active=selection;selectedWalker=selection?.walkerId||null;visibility()},
        getFlow(id){return data.flows.find(f=>f.id===id)},getWalker(id){return walkers.find(w=>w.id===id)},
        setLines(value){showLines=value;visibility()},setWalkers(value){visible=value;visibility()},setCargo(value){showCargo=value;visibility()},
        setNames(value){showNames=value;onChange()},setNameHandler(handler){walkers.forEach(w=>w.bubble.addEventListener('click',()=>handler(w.id)))},
        layoutNames(obstacles){const occupied=[...obstacles];walkers.forEach(w=>{w.bubble.style.visibility='visible';if(w.bubble.hidden)return;const r=w.bubble.getBoundingClientRect();if(occupied.some(o=>r.left<o.right+4&&r.right>o.left-4&&r.top<o.bottom+4&&r.bottom>o.top-4))w.bubble.style.visibility='hidden';else occupied.push(r)})},
        get lastTime(){return lastTime}
    }
}
