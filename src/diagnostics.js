// Opt-in, visible measurements: ?debug=1. No network telemetry or persisted data.
export function createDiagnostics(renderer) {
    if(new URLSearchParams(window.location.search).get('debug')!=='1')return{begin(){},end(){},frame(){}}
    const panel=document.createElement('details');panel.className='diagnostics';panel.open=true
    const title=document.createElement('summary');title.textContent='Performance measurements'
    const output=document.createElement('pre');output.id='performance-output';panel.append(title,output);document.body.append(panel)
    let start=performance.now(),began=0,last=0,rendered=0,lastInfo={},costs=[],intervals=[]
    const percentile=(values,p)=>{if(!values.length)return 0;const sorted=values.slice().sort((a,b)=>a-b);return +sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))].toFixed(2)}
    return {
        begin(){began=performance.now()},
        end(){costs.push(performance.now()-began);rendered++;lastInfo={drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,programs:renderer.info.programs.length}},
        frame(now){if(document.hidden){start=now;last=0;costs=[];intervals=[];rendered=0;return}if(last)intervals.push(now-last);last=now;if(now-start<2000)return;const assets=performance.getEntriesByType('resource').filter(e=>/\.(js|css)(\?|$)/.test(e.name));output.textContent=JSON.stringify({mode:process.env.NODE_ENV,viewport:`${window.innerWidth}x${window.innerHeight}`,pixelRatio:renderer.getPixelRatio(),sampleSeconds:+((now-start)/1000).toFixed(2),renderedFrames:rendered,renderedFPS:+(rendered/((now-start)/1000)).toFixed(1),rafIntervalP95:percentile(intervals,.95),renderCpuP50:percentile(costs,.5),renderCpuP95:percentile(costs,.95),initialAssetEncodedBytes:assets.reduce((n,e)=>n+e.encodedBodySize,0),...lastInfo},null,2);start=now;costs=[];intervals=[];rendered=0}
    }
}
