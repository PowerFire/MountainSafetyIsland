const assert = require('assert/strict')
const fs = require('fs')
const http = require('http')
const zlib = require('zlib')
const { createPreviewServer } = require('./serve-preview.cjs')
async function run() {
    const html = fs.readFileSync('dist/index.html', 'utf8')
    const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(match => match[1])
    assert.ok(assets.some(asset => asset.endsWith('.js')) && assets.some(asset => asset.endsWith('.css')))
    assert.ok(assets.every(asset => asset.startsWith('./')), 'Built assets must be relative')
    const server = createPreviewServer('/MountainSafetyIsland/')
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    const get = pathname => new Promise((resolve, reject) => {
        http.get({ host: '127.0.0.1', port: server.address().port, path: pathname, headers: { 'Accept-Encoding': 'gzip' } }, response => {
            const chunks = []
            response.on('data', chunk => chunks.push(chunk))
            response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }))
        }).on('error', reject)
    })
    try {
        const page = await get('/MountainSafetyIsland/?lang=en')
        assert.equal(page.status, 200)
        assert.equal(zlib.gunzipSync(page.body).toString(), html)
        for (const asset of assets) {
            const pathname = new URL(asset, 'http://localhost/MountainSafetyIsland/').pathname
            const response = await get(pathname)
            assert.equal(response.status, 200, pathname)
            assert.ok(zlib.gunzipSync(response.body).length > 0)
        }
        assert.equal((await get('/MountainSafetyIsland')).status, 308)
        assert.equal((await get('/bundle.js')).status, 404)
        assert.equal((await get('/MountainSafetyIsland/missing.js')).status, 404)
        console.log('PASS: production HTML, relative JS/CSS, gzip and English query load under /MountainSafetyIsland/; redirect and missing assets behave correctly.')
    } finally { await new Promise(resolve => server.close(resolve)) }
}
run().catch(error => { console.error(error); process.exitCode = 1 })
