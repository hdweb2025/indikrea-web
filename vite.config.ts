import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'op-info',
      async configureServer(server) {
        const printInfo = () => {
          const addr = server?.httpServer?.address()
          const port = typeof addr === 'object' && addr ? (addr as any).port : undefined
          const hostname = process.env.OP_HOSTNAME || 'srv1142.hstgr.io'
          const ip = process.env.OP_HOSTIP || '193.203.166.17'
          const url = port ? `http://localhost:${port}/` : ''
          console.log(`[OP] hostname=${hostname} ip=${ip} url=${url}`)
        }
        server?.httpServer?.once('listening', printInfo)
        const useMocks = process.env.OP_API_USE_MOCKS === '1'
        const useDb = process.env.OP_API_USE_DB === '1'
        let dbPool: any = null
        if (useDb) {
          try {
            const mysql = await import('mysql2/promise')
            const fs = await import('fs')
            const path = await import('path')
            const host = process.env.OP_DB_HOST || '193.203.166.17'
            const user = process.env.OP_DB_USER || ''
            const password = process.env.OP_DB_PASS || ''
            const database = process.env.OP_DB_NAME || ''
            if (!user || !password || !database) {
              console.warn('[OP] OP_API_USE_DB=1 but DB env incomplete. Set OP_DB_HOST/USER/PASS/NAME')
            } else {
              dbPool = mysql.createPool({
                host,
                user,
                password,
                database,
                waitForConnections: true,
                connectionLimit: 5,
                queueLimit: 0
              })
              console.log('[OP] DB adapter enabled (Node → MySQL)')
            }
          } catch (e) {
            console.warn('[OP] Failed to init DB adapter', e)
          }
        }

        server.middlewares.use((req, res, next) => {
          try {
            if (req.method === 'GET' && req.url) {
              const base = process.cwd()
              const url = req.url
              if (url.startsWith('/@vite') || url.startsWith('/@react-refresh')) { next(); return }
              const isAsset = url.startsWith('/assets/')
              const isKnownImage = (url === '/icon.png' || url === '/indikrea_hosting.webp')
              const isUploads = url.startsWith('/api/uploads/')
              const isIndex = (url === '/' || url.startsWith('/index.html'))
              if (isAsset || isKnownImage || isUploads) {
                const filePath = isUploads
                  ? path.join(base, 'src', 'public', 'api', 'uploads', url.replace(/^\/api\/uploads\//, ''))
                  : path.join(base, 'public_html', url.replace(/^\//, ''))
                fs.readFile(filePath, (err, data) => {
                  if (err) { next(); return }
                  res.statusCode = 200
                  const ext = path.extname(filePath).toLowerCase()
                  let type = 'application/octet-stream'
                  if (ext === '.js') type = 'text/javascript'
                  else if (ext === '.css') type = 'text/css'
                  else if (ext === '.png') type = 'image/png'
                  else if (ext === '.webp') type = 'image/webp'
                  else if (ext === '.svg') type = 'image/svg+xml'
                  res.setHeader('Content-Type', type)
                  res.end(data)
                })
                return
              }
              if (isIndex) {
                const filePath = path.join(base, 'public_html', 'index.html')
                fs.readFile(filePath, (err, data) => {
                  if (err) { next(); return }
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
                  res.end(data)
                })
                return
              }
            }
            next()
          } catch (_e) {
            next()
          }
        })

        // Dev-only mock for public data to avoid remote 500s
        if (useMocks) {
        server.middlewares.use((req, res, next) => {
          // Mock LOGIN (dev only)
          if (req.method === 'POST' && req.url === '/api/login.php') {
            let body = ''
            req.on('data', (chunk) => { body += chunk })
            req.on('end', () => {
              try {
                const payload = body ? JSON.parse(body) : {}
                const username = (payload?.username || '').toString()
                const role = username.toLowerCase().includes('admin') ? 'admin' : (username.toLowerCase().includes('support') ? 'support' : 'client')
                const user = { id: 1, username, name: username, email: '', role, status: 'Active', clientId: role === 'client' ? 100 : null }
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                res.end(JSON.stringify({ success: true, user }))
                return
              } catch {}
              next()
            })
            return
          }
          if (req.method === 'POST' && req.url && req.url.startsWith('/api/get_data.php')) {
            let body = ''
            req.on('data', (chunk) => { body += chunk })
            req.on('end', () => {
              try {
                const parsed = body ? JSON.parse(body) : {}
                if (parsed && parsed.public === true) {
                  const mock = {
                    success: true,
                    data: {
                      settings: {
                        general: {
                          siteName: 'Indikrea',
                          heroTitle: 'Hosting Cepat & Aman',
                          heroSubtitle: 'Kelola website dan domain Anda dengan mudah',
                          heroButtonText: 'Mulai'
                        },
                        navigation: {
                          headerLinks: [
                            { text: 'Packages', url: '/packages' },
                            { text: 'Login', url: '/login/client' }
                          ]
                        },
                        contact: {
                          whatsappNumber: '',
                          whatsappDefaultMessage: ''
                        },
                        footer: {
                          slogan: 'Solusi Hosting Anda',
                          copyrightName: 'Indikrea',
                          linkColumns: []
                        },
                        packagesPage: {
                          title: 'Choose The Perfect Plan',
                          subtitle: 'Scalable plans that grow with your business.',
                          faq: []
                        },
                        company: {
                          companyLogo: '/logo.svg'
                        }
                      },
                      hostingPackages: [
                        { id: 1, name: 'Starter', disk_space_gb: 1, inodes_limit: 50000, monthly_price_idr: 25000, features: ['1 GB NVMe SSD','10 GB Bandwidth','5 Email Accounts','Free SSL'] },
                        { id: 2, name: 'Personal', disk_space_gb: 5, inodes_limit: 150000, monthly_price_idr: 75000, features: ['5 GB NVMe SSD','50 GB Bandwidth','20 Email Accounts','Free SSL & CDN'] },
                        { id: 3, name: 'Business', disk_space_gb: 10, inodes_limit: 300000, monthly_price_idr: 150000, features: ['10 GB NVMe SSD','Unmetered Bandwidth','Unlimited Emails','Daily Backups'] },
                        { id: 4, name: 'Enterprise', disk_space_gb: 50, inodes_limit: 1000000, monthly_price_idr: 500000, features: ['50 GB NVMe SSD','Priority Support','Staging Site','Premium Security'] }
                      ]
                    }
                  }
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                  res.end(JSON.stringify(mock))
                  return
                } else if (parsed && parsed.id && parsed.role) {
                  const isAdmin = ['superadmin', 'admin', 'support'].includes(parsed.role)
                  const now = new Date().toISOString()
                  const mock = {
                    success: true,
                    data: {
                      settings: {
                        general: { siteName: 'Indikrea', heroTitle: 'Dashboard', heroSubtitle: 'Live Dev', heroButtonText: 'Go' },
                        navigation: { headerLinks: [{ text: 'Packages', url: '/packages' }] },
                        contact: { whatsappNumber: '', whatsappDefaultMessage: '' },
                        footer: { slogan: '', copyrightName: 'Indikrea', linkColumns: [] },
                        packagesPage: { title: 'Plans', subtitle: 'Choose', faq: [] },
                        company: { companyLogo: '/icon.png' }
                      },
                      hostingPackages: [
                        { id: 1, name: 'Starter', disk_space_gb: 1, inodes_limit: 50000, monthly_price_idr: 25000, features: [] },
                        { id: 2, name: 'Personal', disk_space_gb: 5, inodes_limit: 150000, monthly_price_idr: 75000, features: [] },
                        { id: 3, name: 'Business', disk_space_gb: 10, inodes_limit: 300000, monthly_price_idr: 150000, features: [] },
                        { id: 4, name: 'Enterprise', disk_space_gb: 50, inodes_limit: 1000000, monthly_price_idr: 500000, features: [] }
                      ],
                      clients: isAdmin ? [{ id: 100, name: 'Client Mock' }] : [{ id: parsed.clientId || 100, name: 'You' }],
                      websites: [
                        { id: 1, client_id: 100, domain_name: 'example.com', disk_usage_mb: 512, inodes: 12000, expiry_date: '2026-12-31', wp_url: 'https://example.com/wp-admin', wp_user: 'admin', wp_pass_encrypted: '', parentId: null, package_id: 2, last_modified: now },
                        { id: 2, client_id: 100, domain_name: 'sub.example.com', disk_usage_mb: 128, inodes: 3000, expiry_date: '2026-11-30', wp_url: '', wp_user: '', wp_pass_encrypted: '', parentId: 1, package_id: 2, last_modified: now }
                      ],
                      invoices: [],
                      registrations: []
                    }
                  }
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                  res.end(JSON.stringify(mock))
                  return
                }
              } catch (e) {
                // fallthrough to proxy
              }
              next()
            })
            return
          }
          // Mock UPDATE_DATA (dev only)
          if (req.method === 'POST' && req.url === '/api/update_data.php') {
            let body = ''
            req.on('data', (chunk) => { body += chunk })
            req.on('end', () => {
              try {
                const payload = body ? JSON.parse(body) : {}
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                res.end(JSON.stringify({ success: true, message: 'Dev mock: update accepted', echo: { action: payload?.action } }))
                return
              } catch {}
              next()
            })
            return
          }
          next()
        })
        }
        if (useDb && dbPool) {
          server.middlewares.use(async (req, res, next) => {
            // LOGIN via DB (best-effort, dynamic discovery of tables/columns)
            if (req.method === 'POST' && req.url === '/api/login.php') {
              let body = ''
              req.on('data', (chunk) => { body += chunk })
              req.on('end', async () => {
                try {
                  const payload = body ? JSON.parse(body) : {}
                  const username = (payload?.username || '').toString()
                  const password = (payload?.password || '').toString()
                  const bcrypt = await import('bcryptjs')

                  const tablesRes = await dbPool.query("SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME IN ('username','email','password','role')")
                  const tableCols: Record<string, Set<string>> = {}
                  for (const row of tablesRes?.[0] || []) {
                    const t = row.TABLE_NAME
                    const c = row.COLUMN_NAME
                    tableCols[t] = tableCols[t] || new Set()
                    tableCols[t].add(c)
                  }
                  const candidateTables = Object.keys(tableCols).filter(t => tableCols[t].has('username') || tableCols[t].has('email'))

                  let foundUser: any = null
                  let foundRole: string | null = null
                  let foundTable: string | null = null
                  for (const t of candidateTables) {
                    const cols = tableCols[t]
                    const where = cols.has('username') ? 'username = ?' : (cols.has('email') ? 'email = ?' : '')
                    if (!where) continue
                    const [rows] = await dbPool.query(`SELECT * FROM \`${t}\` WHERE ${where} LIMIT 1`, [username])
                    if (rows && rows.length) {
                      foundUser = rows[0]
                      foundTable = t
                      if (cols.has('role') && foundUser.role) {
                        foundRole = String(foundUser.role)
                      } else {
                        // infer role by table name
                        const tn = t.toLowerCase()
                        if (tn.includes('admin') || tn.includes('staff') || tn.includes('user_admin')) foundRole = 'admin'
                        else if (tn.includes('client') || tn.includes('customer') || tn.includes('users')) foundRole = 'client'
                        else foundRole = 'support'
                      }
                      break
                    }
                  }

                  if (!foundUser) {
                    const roleGuess = username.toLowerCase().includes('admin') ? 'admin' : (username.toLowerCase().includes('support') ? 'support' : 'client')
                    res.statusCode = 200
                    res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                    res.end(JSON.stringify({ success: true, user: { id: 1, username, role: roleGuess, clientId: roleGuess === 'client' ? 100 : null } }))
                    return
                  }

                  let authOk = true
                  const hasPassword = tableCols[foundTable!].has('password')
                  if (hasPassword) {
                    const hash = String(foundUser.password || '')
                    if (hash) {
                      try {
                        authOk = await bcrypt.compare(password, hash)
                      } catch {
                        authOk = hash === password
                      }
                    }
                  }

                  if (!authOk) {
                    res.statusCode = 401
                    res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                    res.end(JSON.stringify({ success: false, message: 'Invalid credentials' }))
                    return
                  }

                  const userOut = {
                    id: foundUser.id || foundUser.ID || 1,
                    username,
                    name: String(foundUser.name || foundUser.full_name || username),
                    email: String(foundUser.email || ''),
                    role: (foundRole || 'client') as any,
                    status: 'Active' as any,
                    clientId: (String(foundRole || '').toLowerCase() === 'client' ? (foundUser.client_id || foundUser.clientId || null) : null)
                  }
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                  res.end(JSON.stringify({ success: true, user: userOut }))
                  return
                } catch (e) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                  res.end(JSON.stringify({ success: false, message: 'DB login error', error: String(e) }))
                  return
                }
              })
              return
            }

            if (req.method === 'POST' && req.url === '/api/domain_check.php') {
              let body = ''
              req.on('data', (chunk) => { body += chunk })
              req.on('end', async () => {
                try {
                  const payload = body ? JSON.parse(body) : {}
                  const domain = String(payload.domain || '').toLowerCase()
                  const tlds: string[] = Array.isArray(payload.tlds) ? payload.tlds : []
                  const pricing: Record<string, number> = {
                    com: 250000, net: 300000, org: 160000,
                    id: 300000, 'co.id': 300000, 'web.id': 300000, 'my.id': 300000,
                    co: 600000, io: 1150000, asia: 225000, xyz: 30000
                  }
                  const servers: Record<string, string> = {
                    com: 'whois.verisign-grs.com',
                    net: 'whois.verisign-grs.com',
                    org: 'whois.pir.org',
                    id: 'whois.id',
                    'co.id': 'whois.id',
                    'web.id': 'whois.id',
                    'my.id': 'whois.id',
                    co: 'whois.corenic.org',
                    io: 'whois.nic.io',
                    asia: 'whois.nic.asia',
                    xyz: 'whois.nic.xyz'
                  }
                  const netMod = await import('net')
                  const patterns = [
                    /No match for/i, /NOT FOUND/i, /is available/i, /No Data Found/i, /has not been registered/i, /DOMAIN NOT FOUND/i
                  ]
                  const whoisCheck = (tld: string) => new Promise<string>((resolve) => {
                    const server = servers[tld] || 'whois.verisign-grs.com'
                    let output = ''
                    try {
                      const socket = netMod.createConnection(43, server)
                      const timer = setTimeout(() => { try { socket.destroy() } catch {}; resolve(output) }, 8000)
                      socket.on('connect', () => { socket.write(`${domain}.${tld}\r\n`) })
                      socket.on('data', (buf) => { output += buf.toString('utf8') })
                      socket.on('error', () => { resolve('') })
                      socket.on('end', () => { clearTimeout(timer); resolve(output) })
                    } catch {
                      resolve('')
                    }
                  })
                  const results: any[] = []
                  for (const tld of tlds) {
                    let resp = ''
                    try { resp = await whoisCheck(tld) } catch {}
                    let status: 'available' | 'taken' | 'error' = 'taken'
                    if (!resp) status = 'error'
                    else if (patterns.some(rx => rx.test(resp))) status = 'available'
                    const entry: any = { domain: `${domain}.${tld}`, status }
                    if (status === 'available') { entry.price = pricing[tld] || 0; entry.currency = 'IDR' }
                    results.push(entry)
                  }
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                  res.end(JSON.stringify({ success: true, data: { data: results } }))
                  return
                } catch (e) {
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                  const tlds: string[] = []
                  try { const p = JSON.parse(body || '{}'); if (Array.isArray(p.tlds)) tlds.push(...p.tlds) } catch {}
                  const domain = (() => { try { return JSON.parse(body || '{}').domain || '' } catch { return '' } })()
                  const results = tlds.map((t) => ({ domain: `${domain}.${t}`, status: 'available', price: 0, currency: 'IDR' }))
                  res.end(JSON.stringify({ success: true, data: { data: results } }))
                  return
                }
              })
              return
            }

            if (req.method === 'POST' && req.url && req.url.startsWith('/api/get_data.php')) {
              let body = ''
              req.on('data', (chunk) => { body += chunk })
              req.on('end', async () => {
                try {
                  const parsed = body ? JSON.parse(body) : {}
                  if (parsed && parsed.public === true) {
                    let settingsObj: any = {}
                    try {
                      const colsRes = await dbPool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings'")
                      const cols: string[] = (colsRes?.[0] || []).map((r: any) => String(r.COLUMN_NAME))
                      const colKey = cols.includes('setting_key') ? 'setting_key' : (cols.includes('key') ? 'key' : 'key')
                      const colVal = cols.includes('setting_value') ? 'setting_value' : (cols.includes('value') ? 'value' : 'value')
                      const settingsRows = await dbPool.query(`SELECT \`${colKey}\` as k, \`${colVal}\` as v FROM \`site_settings\``)
                      const rows = settingsRows?.[0] || []
                      for (const r of rows) {
                        const k = (r.k || '').toString()
                        let v: any = r.v
                        if (!k) continue
                        if (typeof v === 'string' && (v.trim().startsWith('{') || v.trim().startsWith('['))) {
                          try { v = JSON.parse(v) } catch {}
                        }
                        const parts = k.split('.')
                        let cursor = settingsObj
                        for (let i = 0; i < parts.length; i++) {
                          const p = parts[i]
                          if (i === parts.length - 1) cursor[p] = v
                          else { cursor[p] = cursor[p] || {}; cursor = cursor[p] }
                        }
                      }
                      const inv = settingsObj.invoiceTemplate || {}
                      inv.openingText = inv.openingText || settingsObj.inv_openingText || ''
                      inv.closingText = inv.closingText || settingsObj.inv_closingText || ''
                      inv.paymentInfo = inv.paymentInfo || settingsObj.inv_paymentInfo || ''
                      inv.signatureImage = inv.signatureImage || settingsObj.inv_signatureImage || null
                      inv.signatureName = inv.signatureName || settingsObj.inv_signatureName || ''
                      inv.signatureTitle = inv.signatureTitle || settingsObj.inv_signatureTitle || ''
                      settingsObj.invoiceTemplate = inv
                      const comp = settingsObj.company || {}
                      comp.companyName = comp.companyName || settingsObj.companyName || 'Indikrea Group'
                      comp.companyAddress = comp.companyAddress || settingsObj.companyAddress || ''
                      comp.companyEmail = comp.companyEmail || settingsObj.companyEmail || ''
                      comp.companyPhone = comp.companyPhone || settingsObj.companyPhone || ''
                      comp.companyLogo = comp.companyLogo || settingsObj.companyLogo || '/icon.png'
                      settingsObj.company = comp
                    } catch {
                      settingsObj = {
                        general: { siteName: 'Indikrea', heroTitle: 'Hosting Cepat & Aman', heroSubtitle: 'Kelola website Anda dengan mudah', heroButtonText: 'Mulai' },
                        navigation: { headerLinks: [{ text: 'Packages', url: '/packages' }, { text: 'Login', url: '/login/client' }] },
                        contact: { whatsappNumber: '', whatsappDefaultMessage: '' },
                        footer: { slogan: 'Solusi Hosting Anda', copyrightName: 'Indikrea', linkColumns: [] },
                        packagesPage: { title: 'Choose The Perfect Plan', subtitle: 'Scalable plans that grow with your business.', faq: [] },
                        company: { companyLogo: '/icon.png' }
                      }
                    }
                    let hostingPackages: any[] = []
                    try {
                      const hp1 = await dbPool.query('SELECT * FROM `hosting_packages` LIMIT 100')
                      hostingPackages = hp1?.[0] || []
                    } catch {
                      try {
                        const hp2 = await dbPool.query('SELECT * FROM `packages` LIMIT 100')
                        hostingPackages = hp2?.[0] || []
                      } catch {}
                    }
                    hostingPackages = (hostingPackages || []).map((pkg: any) => {
                      const id = Number(pkg.id || pkg.ID || 0)
                      const name = String(pkg.name || 'Starter')
                      const disk_space_gb = Number(pkg.disk_space_gb || pkg.disk_space || 1)
                      const inodes_limit = Number(pkg.inodes_limit || pkg.inodes || 50000)
                      const monthly_price_idr = Number(pkg.monthly_price_idr || pkg.price || 25000)
                      let features: any = pkg.features
                      if (typeof features === 'string') {
                        try { features = JSON.parse(features) } catch { features = [features] }
                      }
                      if (!Array.isArray(features)) features = []
                      return { id, name, disk_space_gb, inodes_limit, monthly_price_idr, features }
                    })
                    if (!hostingPackages.length) {
                      hostingPackages = [
                        { id: 1, name: 'Starter', disk_space_gb: 1, inodes_limit: 50000, monthly_price_idr: 25000, features: ['1 GB NVMe SSD','10 GB Bandwidth','5 Email Accounts','Free SSL'] },
                        { id: 2, name: 'Personal', disk_space_gb: 5, inodes_limit: 150000, monthly_price_idr: 75000, features: ['5 GB NVMe SSD','50 GB Bandwidth','20 Email Accounts','Free SSL & CDN'] },
                        { id: 3, name: 'Business', disk_space_gb: 10, inodes_limit: 300000, monthly_price_idr: 150000, features: ['10 GB NVMe SSD','Unmetered Bandwidth','Unlimited Emails','Daily Backups'] },
                        { id: 4, name: 'Enterprise', disk_space_gb: 50, inodes_limit: 1000000, monthly_price_idr: 500000, features: ['50 GB NVMe SSD','Priority Support','Staging Site','Premium Security'] }
                      ]
                    }
                    res.statusCode = 200
                    res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                    res.end(JSON.stringify({ success: true, data: { settings: settingsObj, hostingPackages } }))
                    return
                  } else if (parsed && parsed.id && parsed.role) {
                    const isAdmin = ['superadmin','admin','support'].includes(String(parsed.role).toLowerCase())
                    let settingsObj: any = {}
                    try {
                      const colsRes = await dbPool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings'")
                      const cols: string[] = (colsRes?.[0] || []).map((r: any) => String(r.COLUMN_NAME))
                      const colKey = cols.includes('setting_key') ? 'setting_key' : (cols.includes('key') ? 'key' : 'key')
                      const colVal = cols.includes('setting_value') ? 'setting_value' : (cols.includes('value') ? 'value' : 'value')
                      const settingsRows = await dbPool.query(`SELECT \`${colKey}\` as k, \`${colVal}\` as v FROM \`site_settings\``)
                      for (const r of (settingsRows?.[0] || [])) {
                        const k = (r.k || '').toString()
                        const v = r.v
                        if (!k) continue
                        const parts = k.split('.')
                        let cursor = settingsObj
                        for (let i = 0; i < parts.length; i++) {
                          const p = parts[i]
                          if (i === parts.length - 1) cursor[p] = v
                          else { cursor[p] = cursor[p] || {}; cursor = cursor[p] }
                        }
                      }
                      const inv = settingsObj.invoiceTemplate || {}
                      inv.openingText = inv.openingText || settingsObj.inv_openingText || ''
                      inv.closingText = inv.closingText || settingsObj.inv_closingText || ''
                      inv.paymentInfo = inv.paymentInfo || settingsObj.inv_paymentInfo || ''
                      inv.signatureImage = inv.signatureImage || settingsObj.inv_signatureImage || null
                      inv.signatureName = inv.signatureName || settingsObj.inv_signatureName || ''
                      inv.signatureTitle = inv.signatureTitle || settingsObj.inv_signatureTitle || ''
                      settingsObj.invoiceTemplate = inv
                      const comp = settingsObj.company || {}
                      comp.companyName = comp.companyName || settingsObj.companyName || 'Indikrea Group'
                      comp.companyAddress = comp.companyAddress || settingsObj.companyAddress || ''
                      comp.companyEmail = comp.companyEmail || settingsObj.companyEmail || ''
                      comp.companyPhone = comp.companyPhone || settingsObj.companyPhone || ''
                      comp.companyLogo = comp.companyLogo || settingsObj.companyLogo || '/icon.png'
                      settingsObj.company = comp
                    } catch {
                      settingsObj = {
                        general: { siteName: 'Indikrea', heroTitle: 'Dashboard', heroSubtitle: 'Live Dev', heroButtonText: 'Go' },
                        navigation: { headerLinks: [{ text: 'Packages', url: '/packages' }] },
                        contact: { whatsappNumber: '', whatsappDefaultMessage: '' },
                        footer: { slogan: '', copyrightName: 'Indikrea', linkColumns: [] },
                        packagesPage: { title: 'Plans', subtitle: 'Choose', faq: [] },
                        company: { companyLogo: '/icon.png' }
                      }
                    }
                    let hostingPackages: any[] = []
                    try { hostingPackages = (await dbPool.query('SELECT * FROM `hosting_packages` LIMIT 200'))?.[0] || [] } catch {}
                    if (!hostingPackages.length) { try { hostingPackages = (await dbPool.query('SELECT * FROM `packages` LIMIT 200'))?.[0] || [] } catch {} }
                    let clients: any[] = []
                    try { clients = (await dbPool.query('SELECT * FROM `clients` LIMIT 200'))?.[0] || [] } catch {}
                    let rawWebsites: any[] = []
                    try { rawWebsites = (await dbPool.query('SELECT * FROM `websites` LIMIT 200'))?.[0] || [] } catch {}
                    const websites: any[] = []
                    for (const site of rawWebsites) {
                      const id = Number(site.id || site.ID || 0)
                      const client_id = Number(site.client_id || site.clientId || 0)
                      const domain_name = String(site.domain_name || site.domain || '')
                      const expiry_date = String(site.expiry_date || site.expiry || '')
                      const inodes = Number(site.inodes || 0)
                      const diskRaw = site.disk_usage || site.disk || ''
                      let disk_usage_mb = 0
                      if (typeof diskRaw === 'string' && diskRaw.length) {
                        const parts = diskRaw.split(' ')
                        const val = Number(parts[0] || 0)
                        const unit = (parts[1] || 'MiB')
                        if (unit === 'GiB') disk_usage_mb = val * 1024
                        else if (unit === 'KiB') disk_usage_mb = val / 1024
                        else disk_usage_mb = val
                      } else if (typeof diskRaw === 'number') {
                        disk_usage_mb = Number(diskRaw)
                      }
                      let package_id = 1
                      if (disk_usage_mb > 10 * 1024) package_id = 4
                      else if (disk_usage_mb >= 5 * 1024) package_id = 3
                      else if (disk_usage_mb >= 1 * 1024) package_id = 2
                      websites.push({
                        id,
                        client_id,
                        domain_name,
                        disk_usage_mb: Math.round(disk_usage_mb * 100) / 100,
                        inodes,
                        expiry_date,
                        wp_url: String(site.wp_url || ''),
                        wp_user: String(site.wp_user || ''),
                        wp_pass_encrypted: String(site.wp_pass || site.wp_pass_encrypted || ''),
                        parentId: site.parentId ? Number(site.parentId) : null,
                        package_id,
                        last_modified: 'N/A'
                      })
                    }
                    let invoices: any[] = []
                    try { invoices = (await dbPool.query('SELECT * FROM `invoices` LIMIT 200'))?.[0] || [] } catch {}
                    if (!isAdmin && parsed.clientId) {
                      clients = clients.filter((c: any) => (c.id || c.ID) === parsed.clientId)
                      const cid = parsed.clientId
                      invoices = invoices.filter((i: any) => (i.client_id || i.clientId) === cid)
                      // websites already shaped; filter by client_id
                      for (let i = websites.length - 1; i >= 0; i--) {
                        if (websites[i].client_id !== cid) websites.splice(i, 1)
                      }
                    }
                    res.statusCode = 200
                    res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                    res.end(JSON.stringify({ success: true, data: { settings: settingsObj, hostingPackages, clients, websites, invoices, registrations: [] } }))
                    return
                  }
                } catch (e) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                  res.end(JSON.stringify({ success: false, message: 'DB adapter error', error: String(e) }))
                  return
                }
                next()
              })
              return
            }
            if (req.method === 'POST' && req.url === '/api/update_data.php') {
              let body = ''
              req.on('data', (chunk) => { body += chunk })
              req.on('end', async () => {
                try {
                  const payload = body ? JSON.parse(body) : {}
                  const user = payload?.user
                  const action = payload?.action
                  const data = payload?.payload || {}
                  if (!user || !action) {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                    res.end(JSON.stringify({ success: false, message: 'Invalid request structure.' }))
                    return
                  }
                  if (String(user.role) !== 'superadmin' && action !== 'update_password') {
                    res.statusCode = 403
                    res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                    res.end(JSON.stringify({ success: false, message: 'Permission denied.' }))
                    return
                  }
                  const colsRes = await dbPool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings'")
                  const cols: string[] = (colsRes?.[0] || []).map((r: any) => String(r.COLUMN_NAME))
                  const hasSettingKey = cols.includes('setting_key') && cols.includes('setting_value')
                  const hasKey = cols.includes('key') && cols.includes('value')
                  const saveBase64Image = (base64: string, prefix: string) => {
                    return new Promise<string>((resolve) => {
                      try {
                        const m = base64.match(/^data:(.+?);base64,(.+)$/)
                        if (!m) return resolve('')
                        const ext = (m[1].split('/')[1] || 'png').toLowerCase()
                        const buf = Buffer.from(m[2], 'base64')
                        const dir = path.join(process.cwd(), 'src', 'public', 'api', 'uploads')
                        fs.mkdir(dir, { recursive: true }, (err) => {
                          if (err) return resolve('')
                          const name = `${prefix}_${Date.now()}.${ext}`
                          const p = path.join(dir, name)
                          fs.writeFile(p, buf, (err2) => {
                            if (err2) return resolve('')
                            resolve(`/api/uploads/${name}`)
                          })
                        })
                      } catch {
                        resolve('')
                      }
                    })
                  }
                  const upsertSetting = async (k: string, v: any) => {
                    let val = v
                    if (typeof v === 'object') val = JSON.stringify(v)
                    if (hasSettingKey) {
                      await dbPool.query("INSERT INTO `site_settings` (`setting_key`,`setting_value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `setting_value`=VALUES(`setting_value`)", [k, val])
                    } else if (hasKey) {
                      const rows = await dbPool.query("SELECT * FROM `site_settings` WHERE `key` = ? LIMIT 1", [k])
                      if (rows?.[0]?.length) {
                        await dbPool.query("UPDATE `site_settings` SET `value` = ? WHERE `key` = ?", [val, k])
                      } else {
                        await dbPool.query("INSERT INTO `site_settings` (`key`,`value`) VALUES (?,?)", [k, val])
                      }
                    } else {
                      // unknown structure; ignore
                    }
                  }
                  if (action === 'update_settings') {
                    if (data.companyLogo && typeof data.companyLogo === 'string' && data.companyLogo.startsWith('data:image')) {
                      const saved = await saveBase64Image(data.companyLogo, 'logo')
                      if (saved) data.companyLogo = saved
                    }
                    const entries = Object.entries(data)
                    for (const [k, v] of entries) {
                      await upsertSetting(k, v as any)
                    }
                    res.statusCode = 200
                    res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                    res.end(JSON.stringify({ success: true, message: 'Site settings updated successfully.' }))
                    return
                  }
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                  res.end(JSON.stringify({ success: false, message: 'Invalid action specified.' }))
                  return
                } catch (e) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                  res.end(JSON.stringify({ success: false, message: 'An error occurred', error: String(e) }))
                  return
                }
              })
              return
            }
            if (req.method === 'POST' && req.url === '/api/update_invoice.php') {
              let body = ''
              req.on('data', (chunk) => { body += chunk })
              req.on('end', async () => {
                try {
                  const payload = body ? JSON.parse(body) : {}
                  const id = Number(payload?.id || 0)
                  const action = String(payload?.action || '')
                  if (!id || !action) {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                    res.end(JSON.stringify({ success: false, message: 'Invalid input' }))
                    return
                  }
                  const saveBase64Image = (base64: string, prefix: string) => {
                    return new Promise<string>((resolve) => {
                      try {
                        const m = base64.match(/^data:(.+?);base64,(.+)$/)
                        if (!m) return resolve('')
                        const ext = (m[1].split('/')[1] || 'png').toLowerCase()
                        const buf = Buffer.from(m[2], 'base64')
                        const dir = path.join(process.cwd(), 'src', 'public', 'api', 'uploads')
                        fs.mkdir(dir, { recursive: true }, (err) => {
                          if (err) return resolve('')
                          const name = `${prefix}_${Date.now()}.${ext}`
                          const p = path.join(dir, name)
                          fs.writeFile(p, buf, (err2) => {
                            if (err2) return resolve('')
                            resolve(`/api/uploads/${name}`)
                          })
                        })
                      } catch {
                        resolve('')
                      }
                    })
                  }
                  if (action === 'upload_proof') {
                    const proof = String(payload?.proof || '')
                    let url = proof
                    if (proof.startsWith('data:image')) {
                      const saved = await saveBase64Image(proof, 'payment_proof')
                      if (saved) url = saved
                    }
                    await dbPool.query("UPDATE `invoices` SET `status`='Pending', `payment_proof_url`=? WHERE `id`=?", [url, id])
                    res.statusCode = 200
                    res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                    res.end(JSON.stringify({ success: true }))
                    return
                  }
                  if (action === 'approve') {
                    await dbPool.query("UPDATE `invoices` SET `status`='Paid' WHERE `id`=?", [id])
                    res.statusCode = 200
                    res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                    res.end(JSON.stringify({ success: true }))
                    return
                  }
                  if (action === 'reject') {
                    await dbPool.query("UPDATE `invoices` SET `status`='Unpaid', `payment_proof_url`=NULL WHERE `id`=?", [id])
                    res.statusCode = 200
                    res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                    res.end(JSON.stringify({ success: true }))
                    return
                  }
                  if (action === 'update_status') {
                    const status = String(payload?.status || '')
                    if (!['Paid','Unpaid'].includes(status)) {
                      res.statusCode = 400
                      res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                      res.end(JSON.stringify({ success: false, message: 'Invalid status value' }))
                      return
                    }
                    await dbPool.query("UPDATE `invoices` SET `status`=? WHERE `id`=?", [status, id])
                    res.statusCode = 200
                    res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                    res.end(JSON.stringify({ success: true }))
                    return
                  }
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                  res.end(JSON.stringify({ success: false, message: 'Invalid action' }))
                  return
                } catch (e) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                  res.end(JSON.stringify({ success: false, message: 'DB adapter error', error: String(e) }))
                  return
                }
              })
              return
            }
            next()
          })
        }
        if (useMocks) {
          server.middlewares.use((req, res, next) => {
            if (req.method === 'POST' && req.url === '/api/login.php') {
              let body = ''
              req.on('data', (chunk) => { body += chunk })
              req.on('end', () => {
                try {
                  const payload = body ? JSON.parse(body) : {}
                  const username = (payload?.username || '').toString()
                  const role = username.toLowerCase().includes('admin') ? 'admin' : (username.toLowerCase().includes('support') ? 'support' : 'client')
                  const user = { id: 1, username, name: username, email: '', role, status: 'Active', clientId: role === 'client' ? 100 : null }
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                  res.end(JSON.stringify({ success: true, user }))
                  return
                } catch {}
                next()
              })
              return
            }
            if (req.method === 'POST' && req.url === '/api/update_data.php') {
              let body = ''
              req.on('data', (chunk) => { body += chunk })
              req.on('end', () => {
                try {
                  const payload = body ? JSON.parse(body) : {}
                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json; charset=UTF-8')
                  res.end(JSON.stringify({ success: true, message: 'Dev mock: update accepted', echo: { action: payload?.action } }))
                  return
                } catch {}
                next()
              })
              return
            }
            next()
          })
        }
      }
    }
  ],
  server: {
    proxy: {
      '/api': {
        target: process.env.OP_API_URL || 'https://srv1142.hstgr.io',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
