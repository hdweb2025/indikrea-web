import http from 'http';
import { parse as parseUrl } from 'url';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import mysql from 'mysql2/promise';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const host = process.env.OP_DB_HOST || '193.203.166.17';
const user = process.env.OP_DB_USER || 'u573188607_hosting';
const password = process.env.OP_DB_PASS || 'ObB2^5rW';
const database = process.env.OP_DB_NAME || 'u573188607_hosting';

let dbPool = null;
async function ensureDb() {
  if (!dbPool) {
    dbPool = mysql.createPool({ host, user, password, database, waitForConnections: true, connectionLimit: 5, queueLimit: 0 });
  }
  return dbPool;
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => resolve(body));
  });
}

function json(res, status, data) {
  res.status(status).json(data);
}

// Middleware untuk API
app.use('/api', async (req, res) => {
    const parsedUrl = parseUrl(req.url, true);
    const pathname = parsedUrl.pathname;
    let payload = {};

    if (req.method === 'POST') {
        try {
            const body = await readBody(req);
            payload = JSON.parse(body);
        } catch (e) {
            return json(res, 400, { success: false, message: 'Invalid JSON payload.' });
        }
    }

    if (pathname.startsWith('/data')) {
        await handleGetData(req, res, payload);
    } else if (pathname.startsWith('/update')) {
        await handleUpdateData(req, res, payload);
    } else {
        json(res, 404, { success: false, message: 'API endpoint not found.' });
    }
});


// Menyajikan file statis dari folder 'dist'
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Rute catch-all untuk menyajikan index.html (untuk React Router)
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});


async function handleGetData(req, res, payload) {
  const pool = await ensureDb()
  if (payload && payload.public === true) {
    let settingsObj = {}
    try {
      const colsRes = await pool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings'")
      const cols = (colsRes?.[0] || []).map((r) => String(r.COLUMN_NAME))
      const colKey = cols.includes('setting_key') ? 'setting_key' : (cols.includes('key') ? 'key' : 'key')
      const colVal = cols.includes('setting_value') ? 'setting_value' : (cols.includes('value') ? 'value' : 'value')
      const settingsRows = await pool.query(`SELECT \`${colKey}\` as k, \`${colVal}\` as v FROM \`site_settings\``)
      const rows = settingsRows?.[0] || []
      for (const r of rows) {
        const k = (r.k || '').toString()
        let v = r.v
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
      const pkgPage = settingsObj.packagesPage || {}
      pkgPage.title = pkgPage.title || 'Choose The Perfect Plan'
      pkgPage.subtitle = pkgPage.subtitle || 'Scalable plans that grow with your business. All plans include free web development.'
      pkgPage.faq = Array.isArray(pkgPage.faq) ? pkgPage.faq : []
      settingsObj.packagesPage = pkgPage
      const contact = settingsObj.contact || {}
      contact.whatsappNumber = contact.whatsappNumber || settingsObj.whatsappNumber || ''
      contact.whatsappDefaultMessage = contact.whatsappDefaultMessage || settingsObj.whatsappDefaultMessage || ''
      settingsObj.contact = contact
      const footer = settingsObj.footer || {}
      footer.slogan = footer.slogan || 'Solusi Hosting Anda'
      footer.copyrightName = footer.copyrightName || 'Indikrea'
      footer.linkColumns = Array.isArray(footer.linkColumns) ? footer.linkColumns : []
      settingsObj.footer = footer
      const nav = settingsObj.navigation || {}
      nav.headerLinks = Array.isArray(nav.headerLinks) ? nav.headerLinks : [
        { text: 'Packages', url: '/#packages' },
        { text: 'Login', url: '/#/login/client' }
      ]
      settingsObj.navigation = nav
      const gen = settingsObj.general || {}
      gen.siteName = gen.siteName || 'Indikrea'
      gen.heroTitle = gen.heroTitle || 'Reliable Hosting, [highlight]Simplified.[/highlight]'
      gen.heroSubtitle = gen.heroSubtitle || 'Powerful, secure, and easy-to-manage web hosting solutions designed for businesses of all sizes. Get started in minutes.'
      gen.heroButtonText = gen.heroButtonText || 'View Our Plans'
      settingsObj.general = gen
    } catch {
      settingsObj = {
        general: { siteName: 'Indikrea', heroTitle: 'Reliable Hosting, [highlight]Simplified.[/highlight]', heroSubtitle: 'Powerful, secure, and easy-to-manage web hosting solutions designed for businesses of all sizes. Get started in minutes.', heroButtonText: 'View Our Plans' },
        navigation: { headerLinks: [{ text: 'Packages', url: '/packages' }, { text: 'Login', url: '/login/client' }] },
        contact: { whatsappNumber: '', whatsappDefaultMessage: '' },
        footer: { slogan: 'Solusi Hosting Anda', copyrightName: 'Indikrea', linkColumns: [] },
        packagesPage: { title: 'Choose The Perfect Plan', subtitle: 'Scalable plans that grow with your business. All plans include free web development.', faq: [] },
        company: { companyLogo: '/icon.png' }
      }
    }
    let hostingPackages = []
    try {
      const hp1 = await pool.query('SELECT * FROM `hosting_packages` LIMIT 100')
      hostingPackages = hp1?.[0] || []
    } catch {
      try {
        const hp2 = await pool.query('SELECT * FROM `packages` LIMIT 100')
        hostingPackages = hp2?.[0] || []
      } catch {}
    }
    hostingPackages = (hostingPackages || []).map((pkg) => {
      const id = Number(pkg.id || pkg.ID || 0)
      const name = String(pkg.name || 'Starter')
      const disk_space_gb = Number(pkg.disk_space_gb || pkg.disk_space || 1)
      const inodes_limit = Number(pkg.inodes_limit || pkg.inodes || 50000)
      const monthly_price_idr = Number(pkg.monthly_price_idr || pkg.price || 25000)
      const subtitle = String(pkg.subtitle || 'Ideal for growing projects.')
      let features = pkg.features
      if (typeof features === 'string') { try { features = JSON.parse(features) } catch { features = [features] } }
      if (!Array.isArray(features)) features = []
      return { id, name, subtitle, disk_space_gb, inodes_limit, monthly_price_idr, features }
    })
    if (!hostingPackages.length) {
      hostingPackages = [
        { id: 1, name: 'Starter', disk_space_gb: 1, inodes_limit: 50000, monthly_price_idr: 25000, features: ['1 GB NVMe SSD', '10 GB Bandwidth', '5 Email Accounts', 'Free SSL'] },
        { id: 2, name: 'Personal', disk_space_gb: 5, inodes_limit: 150000, monthly_price_idr: 75000, features: ['5 GB NVMe SSD', '50 GB Bandwidth', '20 Email Accounts', 'Free SSL & CDN'] },
        { id: 3, name: 'Business', disk_space_gb: 10, inodes_limit: 300000, monthly_price_idr: 150000, features: ['10 GB NVMe SSD', 'Unmetered Bandwidth', 'Unlimited Emails', 'Daily Backups'] },
        { id: 4, name: 'Enterprise', disk_space_gb: 50, inodes_limit: 1000000, monthly_price_idr: 500000, features: ['50 GB NVMe SSD', 'Priority Support', 'Staging Site', 'Premium Security'] },
      ]
    }
    return json(res, 200, { success: true, data: { settings: settingsObj, hostingPackages } })
  }
  if (payload && payload.id && payload.role) {
    const pool = await ensureDb()
    const isAdmin = ['superadmin','admin','support'].includes(String(payload.role).toLowerCase())
    let settingsObj = {}
    try {
      const colsRes = await pool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings'")
      const cols = (colsRes?.[0] || []).map((r) => String(r.COLUMN_NAME))
      const colKey = cols.includes('setting_key') ? 'setting_key' : (cols.includes('key') ? 'key' : 'key')
      const colVal = cols.includes('setting_value') ? 'setting_value' : (cols.includes('value') ? 'value' : 'value')
      const settingsRows = await pool.query(`SELECT \`${colKey}\` as k, \`${colVal}\` as v FROM \`site_settings\``)
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
      const pkgPage = settingsObj.packagesPage || {}
      pkgPage.title = pkgPage.title || 'Choose The Perfect Plan'
      pkgPage.subtitle = pkgPage.subtitle || 'Scalable plans that grow with your business. All plans include free web development.'
      pkgPage.faq = Array.isArray(pkgPage.faq) ? pkgPage.faq : []
      settingsObj.packagesPage = pkgPage
      const gen = settingsObj.general || {}
      gen.siteName = gen.siteName || 'Indikrea'
      gen.heroTitle = gen.heroTitle || 'Reliable Hosting, [highlight]Simplified.[/highlight]'
      gen.heroSubtitle = gen.heroSubtitle || 'Powerful, secure, and easy-to-manage web hosting solutions designed for businesses of all sizes. Get started in minutes.'
      gen.heroButtonText = gen.heroButtonText || 'View Our Plans'
      settingsObj.general = gen
    } catch {
      settingsObj = { 
        general: { siteName: 'Indikrea', heroTitle: 'Reliable Hosting, [highlight]Simplified.[/highlight]', heroSubtitle: 'Powerful, secure, and easy-to-manage web hosting solutions designed for businesses of all sizes. Get started in minutes.', heroButtonText: 'View Our Plans' }, 
        company: { companyLogo: '/icon.png' },
        packagesPage: { title: 'Choose The Perfect Plan', subtitle: 'Scalable plans that grow with your business. All plans include free web development.', faq: [] }
      }
    }
    let hostingPackages = []
    try { hostingPackages = (await pool.query('SELECT * FROM `hosting_packages` LIMIT 200'))?.[0] || [] } catch {}
    if (!hostingPackages.length) { try { hostingPackages = (await pool.query('SELECT * FROM `packages` LIMIT 200'))?.[0] || [] } catch {} }
    hostingPackages = (hostingPackages || []).map((pkg) => {
      const id = Number(pkg.id || pkg.ID || 0)
      const name = String(pkg.name || 'Starter')
      const disk_space_gb = Number(pkg.disk_space_gb || pkg.disk_space || 1)
      const inodes_limit = Number(pkg.inodes_limit || pkg.inodes || 50000)
      const monthly_price_idr = Number(pkg.monthly_price_idr || pkg.price || 25000)
      const subtitle = String(pkg.subtitle || 'Ideal for growing projects.')
      let features = pkg.features
      if (typeof features === 'string') { try { features = JSON.parse(features) } catch { features = [features] } }
      if (!Array.isArray(features)) features = []
      return { id, name, subtitle, disk_space_gb, inodes_limit, monthly_price_idr, features }
    })
    if (!hostingPackages.length) {
      hostingPackages = [
        { id: 1, name: 'Starter', disk_space_gb: 1, inodes_limit: 50000, monthly_price_idr: 25000, features: ['1 GB NVMe SSD', '10 GB Bandwidth', '5 Email Accounts', 'Free SSL'] },
        { id: 2, name: 'Personal', disk_space_gb: 5, inodes_limit: 150000, monthly_price_idr: 75000, features: ['5 GB NVMe SSD', '50 GB Bandwidth', '20 Email Accounts', 'Free SSL & CDN'] },
        { id: 3, name: 'Business', disk_space_gb: 10, inodes_limit: 300000, monthly_price_idr: 150000, features: ['10 GB NVMe SSD', 'Unmetered Bandwidth', 'Unlimited Emails', 'Daily Backups'] },
        { id: 4, name: 'Enterprise', disk_space_gb: 50, inodes_limit: 1000000, monthly_price_idr: 500000, features: ['50 GB NVMe SSD', 'Priority Support', 'Staging Site', 'Premium Security'] },
      ]
    }
    let clients = []
    try { clients = (await pool.query('SELECT * FROM `clients` LIMIT 200'))?.[0] || [] } catch {}
    let users = []
    try { users = (await pool.query('SELECT `id`,`username`,`name`,`email`,`role`,`client_id`,`status` FROM `users` LIMIT 300'))?.[0] || [] } catch {}
    let rawWebsites = []
    try { rawWebsites = (await pool.query('SELECT * FROM `websites` LIMIT 200'))?.[0] || [] } catch {}
    const websites = []
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
      websites.push({ id, client_id, domain_name, disk_usage_mb: Math.round(disk_usage_mb * 100) / 100, inodes, expiry_date, wp_url: String(site.wp_url || ''), wp_user: String(site.wp_user || ''), wp_pass_encrypted: String(site.wp_pass || site.wp_pass_encrypted || ''), parentId: site.parentId ? Number(site.parentId) : null, package_id, last_modified: 'N/A' })
    }
    let invoices = []
    try {
      invoices = (await pool.query('SELECT i.*, w.domain_name AS domain_name FROM `invoices` i LEFT JOIN `websites` w ON w.id = i.website_id LIMIT 200'))?.[0] || []
    } catch {
      try {
        invoices = (await pool.query('SELECT * FROM `invoices` LIMIT 200'))?.[0] || []
      } catch {}
      invoices = (invoices || []).map((inv) => {
        const wid = Number(inv.website_id || inv.websiteId || 0)
        const w = websites.find((ws) => Number(ws.id || ws.ID || 0) === wid)
        const domain_name = w ? String(w.domain_name || '') : ''
        return { ...inv, domain_name }
      })
    }
    if (!isAdmin && payload.clientId) {
      clients = clients.filter((c) => (c.id || c.ID) === payload.clientId)
      const cid = payload.clientId
      invoices = invoices.filter((i) => (i.client_id || i.clientId) === cid)
      users = users.filter((u) => (u.client_id || u.clientId) === cid)
      for (let i = websites.length - 1; i >= 0; i--) { if (websites[i].client_id !== cid) websites.splice(i, 1) }
    }
    let registrations = []
    if (isAdmin) {
      try {
        const checkReg = await pool.query("SHOW TABLES LIKE 'registrations'")
        if (!checkReg?.[0]?.length) {
          await pool.query(`
            CREATE TABLE registrations (
              id INT AUTO_INCREMENT PRIMARY KEY,
              fullName VARCHAR(150) NOT NULL,
              email VARCHAR(150) NOT NULL,
              desiredDomain VARCHAR(255) NOT NULL,
              packageId INT NOT NULL,
              registrationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
              status ENUM('Pending Review','Contacted','Converted','Rejected') DEFAULT 'Pending Review'
            )
          `)
        }
        const rows = await pool.query("SELECT * FROM \`registrations\` ORDER BY \`registrationDate\` DESC")
        const list = rows?.[0] || []
        registrations = list.map((r) => ({
          id: Number(r.id || 0),
          fullName: String(r.fullName || ''),
          email: String(r.email || ''),
          desiredDomain: String(r.desiredDomain || ''),
          packageId: Number(r.packageId || 0),
          registrationDate: r.registrationDate ? new Date(r.registrationDate).toISOString() : new Date().toISOString(),
          status: String(r.status || 'Pending Review')
        }))
      } catch {}
    }
    const mappedUsers = (users || []).map((u) => ({
      id: Number(u.id || 0),
      username: String(u.username || u.email || ''),
      name: String(u.name || ''),
      email: String(u.email || ''),
      role: String(u.role || 'client'),
      status: String(u.status || 'Active'),
      clientId: u.client_id ? Number(u.client_id) : null
    }))
    return json(res, 200, { success: true, data: { settings: settingsObj, hostingPackages, clients, websites, invoices, registrations, users: mappedUsers } })
  }
  return json(res, 400, { success: false, message: 'Invalid request' })
}

async function handleUpdateData(req, res, payload) {
  const pool = await ensureDb()
  const user = payload?.user
  const action = payload?.action
  const data = payload?.payload || {}
  if (!user || !action) return json(res, 400, { success: false, message: 'Invalid request structure.' })
  const role = String(user.role || '').toLowerCase()
  if (!['superadmin','admin','support'].includes(role) && action !== 'update_password') return json(res, 403, { success: false, message: 'Permission denied.' })
  const colsRes = await pool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_settings'")
  const cols = (colsRes?.[0] || []).map((r) => String(r.COLUMN_NAME))
  const hasSettingKey = cols.includes('setting_key') && cols.includes('setting_value')
  const hasKey = cols.includes('key') && cols.includes('value')
  const upsertSetting = async (k, v) => {
    let val = v
    if (typeof v === 'object') val = JSON.stringify(v)
    if (hasSettingKey) {
      await pool.query("INSERT INTO `site_settings` (`setting_key`,`setting_value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `setting_value`=VALUES(`setting_value`)", [k, val])
    } else if (hasKey) {
      const rows = await pool.query("SELECT * FROM `site_settings` WHERE `key` = ? LIMIT 1", [k])
      if (rows?.[0]?.length) {
        await pool.query("UPDATE `site_settings` SET `value` = ? WHERE `key` = ?", [val, k])
      } else {
        await pool.query("INSERT INTO `site_settings` (`key`,`value`) VALUES (?,?)", [k, val])
      }
    }
  }
  if (action === 'update_settings') {
    for (const key in data) {
      await upsertSetting(key, data[key])
    }
    return json(res, 200, { success: true, message: 'Settings updated successfully.' })
  }
  return json(res, 400, { success: false, message: 'Invalid action.' })
}

const port = process.env.PORT || process.env.API_PORT || 8787;
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
