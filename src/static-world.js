import * as THREE from 'three'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Combine immutable world meshes while preserving the original island picking surfaces.
// Model-kit and animated InstancedMeshes are intentionally kept as instances.
export function batchStaticWorld(scene) {
    scene.updateMatrixWorld(true)
    const groups=new Map()
    scene.traverse(mesh=>{
        if(!mesh.isMesh||mesh.isInstancedMesh||Array.isArray(mesh.material)||!mesh.visible)return
        const m=mesh.material
        const colored=m.isMeshStandardMaterial&&!m.map&&!m.vertexColors&&!m.transparent&&!m.flatShading&&m.roughness===.92&&m.emissive.getHex()===0
        const key=`${colored?`solid:${m.roughness}:${m.metalness}:${m.side}`:m.uuid}:${mesh.castShadow}:${mesh.receiveShadow}:${mesh.renderOrder}`
        if(!groups.has(key))groups.set(key,{meshes:[],colored})
        groups.get(key).meshes.push(mesh)
    })
    let removed=0,batches=0
    for(const {meshes,colored} of groups.values()) {
        if(meshes.length<2)continue
        const geometries=meshes.map(mesh=>{
            const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone()
            g.applyMatrix4(mesh.matrixWorld)
            if(colored){const values=new Float32Array(g.attributes.position.count*3),color=mesh.material.color;for(let n=0;n<values.length;n+=3){values[n]=color.r;values[n+1]=color.g;values[n+2]=color.b}g.setAttribute('color',new THREE.BufferAttribute(values,3))}
            return g
        })
        const geometry=BufferGeometryUtils.mergeBufferGeometries(geometries)
        if(!geometry)throw new Error('Static world batching failed')
        const first=meshes[0],material=colored?first.material.clone():first.material
        if(colored){material.color.set('#ffffff');material.vertexColors=true}
        const batch=new THREE.Mesh(geometry,material);batch.name='static-world-batch';batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;batch.renderOrder=first.renderOrder
        // Large water surfaces and separated islands must not be incorrectly culled.
        batch.frustumCulled=false
        scene.add(batch);batches++
        meshes.forEach(mesh=>{if(mesh.userData.owner){mesh.visible=false;mesh.name='island-picking-surface'}else{mesh.removeFromParent?mesh.removeFromParent():mesh.parent.remove(mesh);mesh.geometry.dispose()}removed++})
        geometries.forEach(g=>g.dispose())
    }
    return { sourceMeshes:removed, batches, savedDrawCalls:removed-batches }
}
