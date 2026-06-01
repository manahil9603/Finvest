const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const OUT_DIR = path.join(process.cwd(), 'docs', 'finvest_user_guide_assets')
const W = 1400
const H = 900

fs.mkdirSync(OUT_DIR, { recursive: true })

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function rect(x, y, w, h, fill, stroke = 'none', rx = 18, opacity = 1) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" opacity="${opacity}"/>`
}

function circle(cx, cy, r, fill, opacity = 1) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}"/>`
}

function line(x1, y1, x2, y2, stroke = '#27272a', width = 1) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}"/>`
}

function txt(value, x, y, size = 24, fill = '#f8fafc', weight = 600, anchor = 'start') {
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-family="Inter, Arial, sans-serif" font-weight="${weight}" text-anchor="${anchor}">${esc(value)}</text>`
}

function small(value, x, y, fill = '#a1a1aa') {
  return txt(value, x, y, 18, fill, 500)
}

function pill(value, x, y, fill = '#2a1244', color = '#c4b5fd', w = 150) {
  return `${rect(x, y, w, 34, fill, '#4c1d95', 17)}${txt(value, x + w / 2, y + 23, 15, color, 700, 'middle')}`
}

function metric(label, value, x, y, color = '#a78bfa', w = 245) {
  return [
    rect(x, y, w, 120, '#15151a', '#2f2f36', 22),
    small(label.toUpperCase(), x + 22, y + 36, '#71717a'),
    txt(value, x + 22, y + 82, 34, color, 800),
  ].join('')
}

function cardTitle(title, subtitle, x, y, w) {
  return [
    rect(x, y, w, 66, '#101014', '#27272a', 18),
    txt(title, x + 22, y + 29, 19, '#f8fafc', 800),
    subtitle ? small(subtitle, x + 22, y + 53, '#a1a1aa') : '',
  ].join('')
}

function businessCard(title, meta, price, trust, x, y, w = 320, h = 210, accent = '#8b5cf6') {
  return [
    rect(x, y, w, h, '#111115', '#2a2a31', 22),
    rect(x, y, w, 64, `url(#grad-${accent.slice(1)})`, 'none', 22),
    circle(x + 38, y + 38, 19, '#ffffff', 0.9),
    txt(title, x + 22, y + 95, 20, '#f8fafc', 800),
    small(meta, x + 22, y + 123),
    pill(price, x + 22, y + 142, 'rgba(139,92,246,0.17)', '#c4b5fd', 138),
    rect(x + 178, y + 142, 104, 34, 'rgba(16,185,129,0.12)', '#14532d', 17),
    txt(`${trust}/100`, x + 230, y + 165, 15, '#34d399', 800, 'middle'),
  ].join('')
}

function tableRow(cols, x, y, widths, muted = false) {
  let out = ''
  let cursor = x
  cols.forEach((col, i) => {
    out += txt(col, cursor + 14, y + 28, 17, muted ? '#a1a1aa' : '#e4e4e7', i === 0 ? 700 : 500)
    cursor += widths[i]
  })
  out += line(x, y + 45, x + widths.reduce((a, b) => a + b, 0), y + 45, '#25252b')
  return out
}

function base(content) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#08080a"/>
        <stop offset="52%" stop-color="#111016"/>
        <stop offset="100%" stop-color="#071511"/>
      </linearGradient>
      <linearGradient id="grad-8b5cf6" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#6b21a8"/>
        <stop offset="100%" stop-color="#8b5cf6"/>
      </linearGradient>
      <linearGradient id="grad-10b981" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#047857"/>
        <stop offset="100%" stop-color="#10b981"/>
      </linearGradient>
      <linearGradient id="grad-3b82f6" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1d4ed8"/>
        <stop offset="100%" stop-color="#3b82f6"/>
      </linearGradient>
    </defs>
    ${rect(0, 0, W, H, 'url(#bg)', 'none', 0)}
    ${circle(1120, 140, 220, '#6b21a8', 0.18)}
    ${circle(190, 720, 230, '#10b981', 0.11)}
    ${content}
  </svg>`
}

const screens = {
  '01-marketplace.png': [
    rect(54, 42, 1292, 76, 'rgba(255,255,255,0.045)', '#25252b', 24),
    rect(76, 60, 42, 42, '#6b21a8', 'none', 13), txt('F', 97, 88, 24, '#fff', 900, 'middle'),
    txt('Finvest', 134, 87, 30, '#f8fafc', 900),
    small('Explore', 970, 88, '#d4d4d8'), small('Pricing', 1060, 88), small('FAQ', 1140, 88),
    rect(1210, 58, 105, 44, '#7c3aed', 'none', 14), txt('Sign up', 1262, 86, 17, '#fff', 800, 'middle'),
    txt('Discover Pakistani businesses', 86, 205, 48, '#fff', 900),
    txt('for investment and acquisition', 86, 258, 42, '#c4b5fd', 900),
    small('Search verified SMEs by industry, province, stage, deal size and trust score.', 89, 304, '#cbd5e1'),
    rect(86, 340, 700, 62, '#101014', '#2d2d34', 18), small('Search by name, industry, or keyword...', 118, 379),
    rect(804, 340, 160, 62, '#19191f', '#32323a', 18), txt('Filters', 884, 379, 18, '#e4e4e7', 700, 'middle'),
    rect(986, 340, 210, 62, '#19191f', '#32323a', 18), txt('Sort: Featured', 1091, 379, 18, '#e4e4e7', 700, 'middle'),
    cardTitle('Filter Sidebar', 'Industry, province, stage, price and trust score', 86, 430, 410),
    pill('Technology', 112, 526, 'rgba(59,130,246,0.14)', '#93c5fd', 146),
    pill('Punjab', 274, 526, 'rgba(16,185,129,0.12)', '#6ee7b7', 120),
    pill('Growing', 112, 576, 'rgba(245,158,11,0.13)', '#fde68a', 120),
    pill('Trust 70+', 250, 576, 'rgba(139,92,246,0.15)', '#c4b5fd', 128),
    rect(112, 640, 330, 12, '#27272a', 'none', 6), rect(112, 640, 220, 12, '#8b5cf6', 'none', 6),
    small('Deal size range', 112, 682),
    txt('Results', 540, 427, 28, '#f8fafc', 900),
    businessCard('Karachi Textile Export Co.', 'Textile - Karachi', 'PKR 25M', 86, 540, 460, 350, 220, '#8b5cf6'),
    businessCard('Lahore SaaS Platform', 'Technology - Lahore', 'PKR 40M', 91, 925, 460, 350, 220, '#10b981'),
    businessCard('Islamabad Clinic Group', 'Healthcare - Islamabad', 'PKR 60M', 78, 540, 710, 350, 150, '#3b82f6'),
    businessCard('Multan Food Brand', 'Food - Multan', 'PKR 12M', 74, 925, 710, 350, 150, '#8b5cf6'),
  ].join(''),

  '02-auth.png': [
    txt('Account access and onboarding', 84, 96, 42, '#fff', 900),
    small('Users choose a role, create an account, then land on the right dashboard.', 88, 132, '#cbd5e1'),
    rect(86, 178, 560, 620, '#111115', '#2b2b33', 28),
    txt('Choose your role', 126, 232, 32, '#f8fafc', 900),
    ['Business Owner - list and grow a business', 'Investor - discover funding opportunities', 'Buyer - acquire businesses'].forEach((v, i) => {
      // intentionally empty; rendered below for clarity
    }),
    rect(126, 270, 470, 112, 'rgba(245,158,11,0.08)', '#92400e', 22), txt('Business Owner', 160, 315, 22, '#fde68a', 800), small('Create listings, review connections and manage messages.', 160, 348),
    rect(126, 404, 470, 112, 'rgba(16,185,129,0.08)', '#14532d', 22), txt('Investor', 160, 449, 22, '#86efac', 800), small('Set preferences, save businesses and send requests.', 160, 482),
    rect(126, 538, 470, 112, 'rgba(59,130,246,0.08)', '#1e3a8a', 22), txt('Buyer', 160, 583, 22, '#93c5fd', 800), small('Find acquisition targets and track enquiries.', 160, 616),
    rect(126, 690, 470, 60, '#7c3aed', 'none', 18), txt('Continue', 361, 729, 19, '#fff', 800, 'middle'),
    rect(742, 178, 572, 620, '#111115', '#2b2b33', 28),
    txt('Sign in', 790, 232, 32, '#f8fafc', 900),
    small('Use your account or one of the demo accounts in development.', 792, 263),
    small('Email address', 792, 326, '#d4d4d8'), rect(792, 344, 450, 56, '#0d0d10', '#34343c', 16), small('you@example.com', 816, 379),
    small('Password', 792, 440, '#d4d4d8'), rect(792, 458, 450, 56, '#0d0d10', '#34343c', 16), small('********', 816, 493),
    rect(792, 552, 450, 58, '#7c3aed', 'none', 17), txt('Sign in', 1017, 590, 19, '#fff', 800, 'middle'),
    line(792, 655, 1242, 655, '#2a2a31'),
    txt('Demo accounts', 792, 704, 22, '#f8fafc', 800),
    small('Business Owner: ahmed@finvest.pk', 792, 740), small('Investor: sara@finvest.pk', 792, 770), small('Buyer: omar@finvest.pk', 792, 800),
  ].join(''),

  '03-business-profile.png': [
    rect(60, 52, 1280, 260, 'url(#grad-8b5cf6)', 'none', 32),
    txt('Karachi Textile Export Co.', 96, 378, 42, '#fff', 900),
    pill('Verified Owner', 96, 396, 'rgba(16,185,129,0.18)', '#86efac', 160),
    pill('Featured', 270, 396, 'rgba(139,92,246,0.22)', '#c4b5fd', 120),
    pill('Seeking Investment', 404, 396, 'rgba(59,130,246,0.15)', '#93c5fd', 180),
    pill('Growing', 598, 396, 'rgba(16,185,129,0.12)', '#6ee7b7', 110),
    small('Textile - Karachi, Sindh - Listed May 2026', 98, 470, '#cbd5e1'),
    rect(96, 516, 760, 250, '#111115', '#2b2b33', 24),
    txt('Full Description', 128, 568, 26, '#f8fafc', 900),
    small('Export-focused textile manufacturer with recurring wholesale contracts, stable margins,', 128, 610),
    small('and new capacity expansion planned for the next 12 months. Financial figures are', 128, 640),
    small('self-reported and should be independently verified during due diligence.', 128, 670),
    metric('Funding required', 'PKR 25M', 910, 350, '#c4b5fd', 350),
    metric('Revenue range', 'PKR 100M', 910, 490, '#34d399', 350),
    rect(910, 630, 350, 156, '#111115', '#2b2b33', 24),
    small('TRUST SCORE', 938, 670, '#71717a'), txt('86 / 100', 938, 720, 42, '#34d399', 900),
    rect(938, 740, 250, 12, '#27272a', 'none', 6), rect(938, 740, 215, 12, '#34d399', 'none', 6),
    rect(96, 794, 250, 56, '#7c3aed', 'none', 17), txt('Connect', 221, 830, 18, '#fff', 800, 'middle'),
    rect(366, 794, 190, 56, '#18181d', '#34343c', 17), txt('Save', 461, 830, 18, '#e4e4e7', 800, 'middle'),
    rect(586, 794, 270, 56, '#101014', '#2b2b33', 17), txt('Similar businesses below', 721, 830, 17, '#cbd5e1', 700, 'middle'),
  ].join(''),

  '04-owner-dashboard.png': [
    txt('Business Owner Dashboard', 72, 94, 40, '#fff', 900),
    small('Manage listings, submit for admin review, boost visibility and respond to requests.', 76, 132, '#cbd5e1'),
    metric('My listings', '3', 76, 172, '#c4b5fd', 285),
    metric('Connections', '14', 386, 172, '#34d399', 285),
    metric('Pending requests', '5', 696, 172, '#fde68a', 285),
    metric('Unread messages', '2', 1006, 172, '#93c5fd', 285),
    cardTitle('My Businesses', 'Edit, delete, boost and open analytics placeholder', 76, 334, 610),
    tableRow(['Business', 'Status', 'Actions'], 96, 420, [260, 130, 170]),
    tableRow(['Karachi Textile Export Co.', 'Active', 'Boost/Edit/Delete'], 96, 475, [260, 130, 170], true),
    tableRow(['Lahore SaaS Platform', 'Draft', 'Edit/Delete'], 96, 530, [260, 130, 170], true),
    rect(96, 605, 220, 54, '#7c3aed', 'none', 17), txt('List New Business', 206, 639, 17, '#fff', 800, 'middle'),
    cardTitle('Add/Edit Business Form', 'Name, description, industry, location, funding, revenue, stage, sale/investment, 5 images', 724, 334, 600),
    small('Submit for admin review keeps listings in DRAFT until approved.', 752, 424, '#cbd5e1'),
    rect(752, 455, 240, 48, '#0d0d10', '#34343c', 14), small('Business name', 772, 486),
    rect(1015, 455, 240, 48, '#0d0d10', '#34343c', 14), small('Industry', 1035, 486),
    rect(752, 525, 503, 80, '#0d0d10', '#34343c', 14), small('Description', 772, 568),
    pill('Is for sale', 752, 630, 'rgba(59,130,246,0.14)', '#93c5fd', 136),
    pill('Seeking investment', 904, 630, 'rgba(139,92,246,0.14)', '#c4b5fd', 190),
    rect(76, 700, 620, 140, '#111115', '#2b2b33', 24), txt('Connection Requests', 104, 744, 24, '#f8fafc', 900), tableRow(['From', 'Business', 'Action'], 104, 770, [190, 230, 160], true),
    rect(1120, 712, 136, 44, '#065f46', 'none', 14), txt('Accept', 1188, 740, 16, '#fff', 800, 'middle'), rect(1120, 770, 136, 44, '#7f1d1d', 'none', 14), txt('Reject', 1188, 798, 16, '#fff', 800, 'middle'),
  ].join(''),

  '05-investor-dashboard.png': [
    txt('Investor Dashboard', 72, 94, 40, '#fff', 900),
    small('Set investment preferences, review recommended businesses, save targets and track requests.', 76, 132, '#cbd5e1'),
    metric('Saved businesses', '8', 76, 172, '#c4b5fd', 285),
    metric('Connections', '6', 386, 172, '#34d399', 285),
    metric('Pending', '3', 696, 172, '#fde68a', 285),
    metric('Unread messages', '4', 1006, 172, '#93c5fd', 285),
    rect(76, 336, 360, 470, '#111115', '#2b2b33', 26),
    txt('Investment Preferences', 106, 386, 25, '#f8fafc', 900),
    small('Industries', 106, 436), pill('Technology', 106, 454, 'rgba(59,130,246,0.14)', '#93c5fd', 132), pill('Healthcare', 250, 454, 'rgba(16,185,129,0.12)', '#6ee7b7', 136),
    small('Provinces', 106, 526), pill('Punjab', 106, 544, 'rgba(139,92,246,0.14)', '#c4b5fd', 108), pill('Sindh', 226, 544, 'rgba(139,92,246,0.14)', '#c4b5fd', 96),
    small('Investment range', 106, 616), rect(106, 636, 270, 12, '#27272a', 'none', 6), rect(106, 636, 190, 12, '#8b5cf6', 'none', 6),
    rect(106, 704, 270, 54, '#7c3aed', 'none', 17), txt('Save Preferences', 241, 738, 17, '#fff', 800, 'middle'),
    txt('Recommended for You', 488, 380, 28, '#f8fafc', 900),
    businessCard('Lahore SaaS Platform', 'Technology - Lahore', 'PKR 40M', 91, 488, 416, 360, 230, '#10b981'),
    businessCard('Islamabad Clinic Group', 'Healthcare - Islamabad', 'PKR 60M', 78, 880, 416, 360, 230, '#3b82f6'),
    rect(488, 690, 752, 116, '#111115', '#2b2b33', 22),
    txt('My Connection Requests', 516, 732, 23, '#f8fafc', 900),
    tableRow(['Business', 'Owner', 'Status'], 516, 752, [260, 200, 180], true),
  ].join(''),

  '06-buyer-dashboard.png': [
    txt('Buyer Dashboard', 72, 94, 40, '#fff', 900),
    small('Browse acquisition targets, save a watchlist and track acquisition enquiries.', 76, 132, '#cbd5e1'),
    metric('Saved targets', '5', 76, 172, '#c4b5fd', 285),
    metric('Acquisition chats', '2', 386, 172, '#93c5fd', 285),
    metric('Pending enquiries', '4', 696, 172, '#fde68a', 285),
    metric('Unread messages', '1', 1006, 172, '#34d399', 285),
    txt('Businesses Open to Acquisition', 76, 374, 29, '#f8fafc', 900),
    businessCard('Multan Food Brand', 'Food - Multan', 'PKR 12M', 74, 76, 416, 360, 230, '#8b5cf6'),
    businessCard('Faisalabad Packaging', 'Manufacturing - Faisalabad', 'PKR 55M', 82, 468, 416, 360, 230, '#3b82f6'),
    businessCard('Karachi Retail Chain', 'Retail - Karachi', 'PKR 90M', 88, 860, 416, 360, 230, '#10b981'),
    rect(76, 690, 560, 134, '#111115', '#2b2b33', 24), txt('Acquisition Watchlist', 104, 734, 24, '#f8fafc', 900), small('Saved targets stay here until removed.', 104, 770),
    rect(678, 690, 560, 134, '#111115', '#2b2b33', 24), txt('Acquisition Enquiries', 706, 734, 24, '#f8fafc', 900), tableRow(['Target', 'Status', 'Owner'], 706, 760, [220, 150, 150], true),
  ].join(''),

  '07-admin.png': [
    txt('Admin Control Centre', 72, 94, 40, '#fff', 900),
    small('Review listings, verify owners, manage users and monitor growth.', 76, 132, '#cbd5e1'),
    metric('Total users', '238', 76, 172, '#c4b5fd', 285),
    metric('Businesses', '512', 386, 172, '#34d399', 285),
    metric('Connections', '1,204', 696, 172, '#93c5fd', 285),
    metric('Pending review', '9', 1006, 172, '#fde68a', 285),
    rect(76, 338, 530, 210, '#111115', '#2b2b33', 26),
    txt('Growth Snapshot', 108, 386, 25, '#f8fafc', 900),
    [0,1,2,3,4,5,6,7].map((i) => rect(120 + i * 48, 500 - i * 12, 24, 58 + i * 12, i % 3 === 0 ? '#8b5cf6' : i % 3 === 1 ? '#10b981' : '#3b82f6', 'none', 8)).join(''),
    rect(650, 338, 650, 210, '#111115', '#2b2b33', 26),
    txt('Pending Verifications', 682, 386, 25, '#f8fafc', 900),
    tableRow(['Business', 'Trust', 'Decision'], 682, 420, [260, 120, 210], true),
    rect(1080, 458, 90, 36, '#065f46', 'none', 12), txt('Approve', 1125, 482, 14, '#fff', 800, 'middle'),
    rect(1182, 458, 90, 36, '#7f1d1d', 'none', 12), txt('Reject', 1227, 482, 14, '#fff', 800, 'middle'),
    rect(76, 590, 1224, 230, '#111115', '#2b2b33', 26),
    txt('All Users', 108, 638, 25, '#f8fafc', 900),
    rect(108, 662, 360, 46, '#0d0d10', '#34343c', 14), small('Search name or email...', 128, 692),
    pill('All roles', 492, 668, 'rgba(255,255,255,0.06)', '#d4d4d8', 120),
    tableRow(['Name', 'Role', 'Status', 'Actions'], 108, 730, [280, 220, 190, 240], true),
  ].join(''),

  '08-messages-profile.png': [
    txt('Messages and Profile', 72, 94, 40, '#fff', 900),
    small('Accepted connections can message directly; users can keep profile details current.', 76, 132, '#cbd5e1'),
    rect(76, 178, 610, 640, '#111115', '#2b2b33', 28),
    txt('Direct Messages', 112, 230, 28, '#f8fafc', 900),
    rect(112, 260, 210, 46, '#0d0d10', '#34343c', 14), small('Search threads...', 132, 290),
    rect(112, 334, 210, 82, '#17171d', '#34343c', 18), txt('Sara Investor', 136, 368, 19, '#f8fafc', 800), small('Latest message preview...', 136, 396),
    rect(112, 432, 210, 82, '#101014', '#27272a', 18), txt('Omar Buyer', 136, 466, 19, '#f8fafc', 800), small('Can we schedule a call?', 136, 494),
    rect(354, 334, 292, 388, '#0d0d10', '#34343c', 20),
    txt('Sara Investor', 386, 378, 22, '#f8fafc', 900),
    rect(386, 420, 210, 54, '#1f2937', 'none', 16), small('Thanks for accepting.', 406, 453, '#e4e4e7'),
    rect(430, 502, 180, 54, '#7c3aed', 'none', 16), small('Happy to share details.', 452, 535, '#fff'),
    rect(386, 656, 226, 48, '#111115', '#34343c', 14), small('Write a message...', 406, 686),
    rect(746, 178, 572, 640, '#111115', '#2b2b33', 28),
    txt('My Profile', 786, 230, 28, '#f8fafc', 900),
    circle(828, 300, 38, '#7c3aed'), txt('A', 828, 314, 34, '#fff', 900, 'middle'),
    txt('Ahmed Khan', 886, 292, 24, '#f8fafc', 900), small('BUSINESS OWNER - Verified', 886, 322, '#86efac'),
    small('Full Name', 786, 390), rect(786, 408, 430, 50, '#0d0d10', '#34343c', 14), small('Ahmed Khan', 806, 439),
    small('Phone', 786, 498), rect(786, 516, 200, 50, '#0d0d10', '#34343c', 14), small('+92 300...', 806, 547),
    small('City', 1016, 498), rect(1016, 516, 200, 50, '#0d0d10', '#34343c', 14), small('Karachi', 1036, 547),
    small('Bio', 786, 606), rect(786, 624, 430, 86, '#0d0d10', '#34343c', 14), small('Tell other users about yourself...', 806, 666),
    rect(786, 740, 430, 54, '#7c3aed', 'none', 17), txt('Save Changes', 1001, 775, 17, '#fff', 800, 'middle'),
  ].join(''),
}

async function main() {
  const files = []
  for (const [name, content] of Object.entries(screens)) {
    const file = path.join(OUT_DIR, name)
    await sharp(Buffer.from(base(content))).png().toFile(file)
    files.push(file)
  }
  console.log(files.join('\n'))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
