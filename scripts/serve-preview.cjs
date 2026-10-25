// Production-build preview. Binds to this computer only; does not publish the site.
const http = require('http')
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const root = path.resolve(__dirname, '../dist')
function createPreviewServer(basePath = '/') {
const base = '/' + basePath.split('/').filter(Boolean).join('/')
const prefix = base === '/' ? '/' : base + '/'
const cache = new Map()
return http.createServer((req, res) => {
    let pathname
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname) } catch (_) { res.writeHead(400); res.end(); return }
    if (base !== '/' && pathname === base) { res.writeHead(308, { Location: prefix }); res.end(); return }
    if (!pathname.startsWith(prefix)) { res.writeHead(404); res.end('Not found'); return }
    pathname = '/' + pathname.slice(prefix.length)
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname))
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return }
    fs.stat(file, (error, stat) => {
        if (error || !stat.isFile()) { res.writeHead(404); res.end('Not found'); return }
        const key = file + ':' + stat.mtimeMs
        let body = cache.get(key)
        if (!body) { try { const raw = fs.readFileSync(file); body = { raw, gzip: zlib.gzipSync(raw) }; cache.set(key, body) } catch (_) { res.writeHead(500); res.end(); return } }
        const type = file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.html') ? 'text/html' : file.endsWith('.json') ? 'application/json' : 'application/octet-stream'
        res.setHeader('Content-Type', type + (type.startsWith('text/') ? '; charset=utf-8' : ''))
        res.setHeader('Cache-Control', 'no-store')
        res.setHeader('Vary', 'Accept-Encoding')
        const compressed = /\bgzip\b/.test(req.headers['accept-encoding'] || '')
        if (compressed) res.setHeader('Content-Encoding', 'gzip')
        res.end(compressed ? body.gzip : body.raw)
    })
})
}
module.exports = { createPreviewServer }
if (require.main === module) {
    const port = Number(process.env.PORT || 8082)
    const base = process.argv.find(value => value.startsWith('--base-path='))?.split('=')[1] || '/'
    createPreviewServer(base).listen(port, '127.0.0.1', () => console.log(`Production preview: http://localhost:${port}${base === '/' ? '/' : '/' + base.split('/').filter(Boolean).join('/') + '/'}`))
}
