import * as THREE from 'three'
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export function createEnvironment({ scene, islands, center, world, config, random, mobile }) {
    const noise = new SimplexNoise({ random })
    const smooth = (a, b, v) => THREE.MathUtils.smoothstep(v, a, b)
    function height(x, z) {
        const dx = x - center.x, dz = z - center.z
        const r = Math.hypot(dx, dz)
        const ring = smooth(16, 30, r) * (1 - smooth(55, 82, r))
        const front = smooth(-.15, .75, (dx * .24 + dz * .87) / Math.max(r, 1))
        const fbm = noise.noise(x * .045, z * .045) * 2.4 + noise.noise(x * .11, z * .11) * 1.1 + noise.noise(x * .25, z * .25) * .35
        const raw = ring * (6.8 + fbm) * (1 - front * .79) - .9
        return Math.floor(raw / .22) * .22
    }
    const terrainGeometry = new THREE.PlaneGeometry(config.terrainSize, config.terrainSize, config.terrainSegments, config.terrainSegments).rotateX(-Math.PI / 2)
    const position = terrainGeometry.attributes.position
    const colors = []
    const stops = [[-.9,'#8fb3ad'],[0,'#d9c9a3'],[1,'#aec493'],[2.4,'#a3b986'],[4.4,'#6f8a62'],[7,'#b2a38d']].map(([h,c]) => [h,new THREE.Color(c)])
    for (let i=0;i<position.count;i++) {
        const x=position.getX(i), z=position.getZ(i), y=height(x,z)
        position.setY(i,y)
        let upper=stops.findIndex(s=>s[0]>y)
        if(upper<0) upper=stops.length-1
        const lower=Math.max(0,upper-1)
        const t=upper===lower?0:THREE.MathUtils.clamp((y-stops[lower][0])/(stops[upper][0]-stops[lower][0]),0,1)
        const color=stops[lower][1].clone().lerp(stops[upper][1],t)
        colors.push(color.r,color.g,color.b)
    }
    terrainGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3))
    terrainGeometry.computeVertexNormals()
    const terrain=new THREE.Mesh(terrainGeometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}))
    terrain.receiveShadow=true
    scene.add(terrain)
    function merge(geometries) {
        // Use positions and normals only so cone and ico parts share an attribute layout.
        const compatible=geometries.map(g=>{const a=g.index?g.toNonIndexed():g; a.deleteAttribute('uv');return a})
        const result=BufferGeometryUtils.mergeBufferGeometries(compatible)
        if(!result) throw new Error('環境幾何合併失敗')
        return result
    }
    const pine=merge([0,1,2].map(n=>new THREE.ConeGeometry(.45-n*.08,.75,7).translate(0,.55+n*.3,0)))
    const broad=merge([[-.2,.8,0],[.2,.88,0],[0,1.1,.1],[0,.85,-.2]].map(([x,y,z])=>new THREE.IcosahedronGeometry(.38,0).translate(x,y,z)))
    const count=mobile?config.mobileForestCount:config.forestCount
    const forestMaterial=new THREE.MeshStandardMaterial({roughness:1,flatShading:true})
    const forests=[new THREE.InstancedMesh(pine,forestMaterial,count),new THREE.InstancedMesh(broad,forestMaterial,count)]
    const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.055,.08,.8,6),new THREE.MeshStandardMaterial({color:'#80694e',roughness:1}),count)
    const counts=[0,0]
    const dummy=new THREE.Object3D()
    const treeColors=['#728f5f','#6f8a62','#8db86f','#9cc27a']
    let planted=0
    for(let attempt=0;attempt<count*8 && planted<count;attempt++) {
        const angle=random()*Math.PI*2, r=Math.sqrt(random()*(config.forestOuterRadius**2-config.forestInnerRadius**2)+config.forestInnerRadius**2)
        const x=center.x+Math.cos(angle)*r,z=center.z+Math.sin(angle)*r,y=height(x,z)
        if(y<.2) continue
        const type=random()<.53?0:1,size=.6+random()*.75
        dummy.position.set(x,y,z);dummy.rotation.set(0,random()*Math.PI*2,0);dummy.scale.setScalar(size);dummy.updateMatrix()
        forests[type].setMatrixAt(counts[type],dummy.matrix)
        forests[type].setColorAt(counts[type]++,new THREE.Color(treeColors[Math.floor(random()*treeColors.length)]))
        dummy.position.y=y+.3*size;dummy.updateMatrix();trunks.setMatrixAt(planted++,dummy.matrix)
    }
    forests.forEach((mesh,i)=>{mesh.count=counts[i];mesh.frustumCulled=false;scene.add(mesh)})
    trunks.count=planted;trunks.frustumCulled=false;scene.add(trunks)
    const mountainMaterials=[]
    for(let layer=0;layer<3;layer++) {
        const vertices=[],indices=[],radius=65+layer*9
        for(let n=0;n<=120;n++) {
            const angle=n/120*Math.PI*2,x=center.x+Math.cos(angle)*radius,z=center.z+Math.sin(angle)*radius
            const front=smooth(-.2,.7,Math.cos(angle)*.24+Math.sin(angle)*.87)
            const top=(6+layer*1.8+noise.noise(Math.cos(angle)*3+layer*7,Math.sin(angle)*3)*3)*(1-front*.8)
            vertices.push(x,-1.5,z,x,top,z)
            if(n<120){const k=n*2;indices.push(k,k+1,k+2,k+1,k+3,k+2)}
        }
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices)
        const material=new THREE.MeshBasicMaterial({color:'#a3b0a0',side:THREE.DoubleSide,fog:false})
        mountainMaterials.push(material);scene.add(new THREE.Mesh(g,material))
    }
    const cloudShape=merge([[-1,0,0],[0,.25,0],[1,0,0],[.3,0,.7],[-.5,0,-.6]].map(([x,y,z])=>new THREE.SphereGeometry(.9,9,6).scale(1,.55,1).translate(x,y,z)))
    const cloudMaterial=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1,transparent:true,opacity:.82,depthWrite:false})
    const clouds=new THREE.InstancedMesh(cloudShape,cloudMaterial,config.cloudCount)
    clouds.frustumCulled=false
    const cloudData=Array.from({length:config.cloudCount},()=>({x:-45+random()*90,z:-45+random()*75,y:12+random()*6,size:1+random()*.65}))
    scene.add(clouds)
    function updateClouds(time) {
        cloudData.forEach((c,i)=>{dummy.position.set(((c.x+time*config.cloudSpeed+60)%120)-60,c.y,c.z);dummy.rotation.set(0,0,0);dummy.scale.setScalar(c.size);dummy.updateMatrix();clouds.setMatrixAt(i,dummy.matrix)})
        clouds.instanceMatrix.needsUpdate=true
    }
    updateClouds(0)
    // Island trees are visible at every distance; tiny furniture uses a separate LOD group.
    const canopyParts=[],pineParts=[],woodParts=[]
    const small=new THREE.Group();small.name='street-detail-lod';scene.add(small)
    const furniture=[]
    function part(target,x,y,z,sx,sy,sz,color,ry=0) {dummy.position.set(x,y,z);dummy.rotation.set(0,ry,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();target.push({matrix:dummy.matrix.clone(),color})}
    islands.forEach(({center:p},index)=>{
        const species=config.islandTrees[index%config.islandTrees.length]
        for(let n=0;n<4;n++) {
            // Edge interiors, away from vertices, bridges and the front labels.
            const angle=[.55,2.05,3.55,4.65][n],x=p.x+Math.cos(angle)*1.63,z=p.z+Math.sin(angle)*1.63
            const h=.55+random()*.18
            part(woodParts,x,world.top+h*.35,z,.065,h*.7,.065,'#b48560')
            const color=species==='cherry'?'#f2b5c6':species==='fruit'?'#9cc27a':species==='willow'?'#a3b986':'#728f5f'
            if(species==='pine') {
                for(let tier=0;tier<3;tier++) part(pineParts,x,world.top+h*.7+tier*.13,z,.38-tier*.065,.38,.38-tier*.065,color)
            } else if(species==='palm') {
                for(let leaf=0;leaf<4;leaf++){const a=leaf*Math.PI/2;part(canopyParts,x+Math.cos(a)*.12,world.top+h,z+Math.sin(a)*.12,.52,.12,.17,color,a)}
            } else part(canopyParts,x,world.top+h,z,.43,species==='willow'?.7:.46,.43,color)
        }
        for(const angle of [0,Math.PI]) {
            const x=p.x+Math.cos(angle)*1.23,z=p.z+Math.sin(angle)*1.23,ry=-angle
            part(furniture,x,world.top+.13,z,.32,.055,.16,'#b48560',ry)
            part(furniture,x,world.top+.24,z-.07,.32,.17,.035,'#b48560',ry)
            for(const dx of [-.11,.11])part(furniture,x+dx,world.top+.06,z,.035,.12,.1,'#71806a')
        }
        for(let n=0;n<6;n++) {
            const a=n*Math.PI/3+.22,x=p.x+Math.cos(a)*1.82,z=p.z+Math.sin(a)*1.82
            part(furniture,x,world.top+.075,z,.13,.15,.13,'#c5b5a7')
            part(furniture,x,world.top+.19,z,.19,.12,.19,n%2?'#9cc27a':'#f2b5c6')
        }
    })
    function instances(geometry,parts,target) {
        const mesh=new THREE.InstancedMesh(geometry,new THREE.MeshStandardMaterial({roughness:.9}),parts.length)
        parts.forEach((p,i)=>{mesh.setMatrixAt(i,p.matrix);mesh.setColorAt(i,new THREE.Color(p.color))})
        mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.castShadow=false;target.add(mesh);return mesh
    }
    instances(new THREE.CylinderGeometry(.5,.5,1,7),woodParts,scene)
    // Per-part species variants share a geometry; silhouette differences come from placement and scaling.
    instances(new THREE.IcosahedronGeometry(.5,1),canopyParts,scene)
    instances(new THREE.ConeGeometry(.5,1,8),pineParts,scene)
    instances(new THREE.BoxGeometry(1,1,1),furniture,small)
    return {
        treeCount:planted,
        update(time,distance){updateClouds(time);small.visible=distance<config.detailDistance},
        setNight(night,horizon){
            mountainMaterials.forEach((m,i)=>m.color.set('#71806a').lerp(horizon,.5+i*.16))
            cloudMaterial.color.set('#ffffff').lerp(new THREE.Color('#8c9dbd'),night*.65)
        }
    }
}
