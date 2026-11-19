const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'saved-calculations.json');
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]', 'utf8');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const methodNames = ['Oddiy ekish', 'Faqat mikoriza', 'Faqat yopiq ildiz', 'Yopiq ildiz + mikoriza'];
function readDb() { try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch { return []; } }
function writeDb(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8'); }
function finiteNonNegative(v) { return Number.isFinite(Number(v)) && Number(v) >= 0; }

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'MycoSaxaul Node.js API' }));

app.post('/api/calculate', (req, res) => {
  const p = req.body || {};
  const area = Number(p.area), density = Number(p.density), years = Number(p.years);
  if (!(area > 0 && density > 0 && Number.isInteger(years) && years >= 1 && years <= 20))
    return res.status(400).json({ error: 'Maydon, ko‘chat zichligi yoki yil qiymati noto‘g‘ri.' });
  if (!p.shared || !Array.isArray(p.methods) || p.methods.length !== 4)
    return res.status(400).json({ error: 'Umumiy xarajatlar va 4 ta texnologiya ma’lumoti talab qilinadi.' });
  const sharedKeys = ['land','plant','transport','water','care','monitor'];
  if (sharedKeys.some(k => !finiteNonNegative(p.shared[k])))
    return res.status(400).json({ error: 'Umumiy xarajatlar manfiy yoki noto‘g‘ri kiritilgan.' });
  for (const m of p.methods) {
    if (['base','container','substrate','mycorrhiza','survival'].some(k => !finiteNonNegative(m[k])) ||
        Number(m.survival) <= 0 || Number(m.survival) > 100)
      return res.status(400).json({ error: 'Texnologiya narxlari yoki yashab qolish foizini tekshiring (0–100%).' });
  }
  const totalSeedlings = area * density;
  const common = area * Number(p.shared.land) + totalSeedlings * (Number(p.shared.plant) + Number(p.shared.transport));
  const annual = area * (Number(p.shared.water) + Number(p.shared.care) + Number(p.shared.monitor));
  const rows = p.methods.map((m, index) => {
    const unit = Number(m.base) + Number(m.container) + Number(m.substrate) + Number(m.mycorrhiza);
    const survival = Number(m.survival);
    const survivors = totalSeedlings * survival / 100;
    const total = totalSeedlings * unit + common + annual * years;
    return { index, unit, total, survival, survivors, cost: total / survivors };
  });
  const best = rows.reduce((a,b) => a.cost < b.cost ? a : b);
  const forecast = [1,3,5].filter(y => y <= years).map(y => ({
    years: y, costs: rows.map(r => (totalSeedlings*r.unit + common + annual*y)/r.survivors)
  }));
  const baseline = rows[0];
  const breakEven = rows.slice(1).map(r => {
    const required = r.total / baseline.total * baseline.survival;
    return { index:r.index, required, actual:r.survival, ok:r.survival >= required };
  });
  res.json({ totalSeedlings, years, rows, best, forecast, breakEven });
});

app.get('/api/saved', (_req,res) => res.json(readDb().sort((a,b)=>b.createdAt.localeCompare(a.createdAt))));
app.post('/api/saved', (req,res) => {
  const name = String(req.body?.name || '').trim();
  const inputs = req.body?.inputs;
  if (!name || name.length > 100 || !inputs || typeof inputs !== 'object')
    return res.status(400).json({ error: 'Hisob nomi (1–100 belgi) va qiymatlar talab qilinadi.' });
  const item = { id: crypto.randomUUID(), name, inputs, createdAt: new Date().toISOString() };
  const db = readDb(); db.push(item); writeDb(db);
  res.status(201).json(item);
});
app.delete('/api/saved/:id', (req,res) => {
  const db = readDb(), next = db.filter(x => x.id !== req.params.id);
  if (next.length === db.length) return res.status(404).json({ error: 'Hisob topilmadi.' });
  writeDb(next); res.json({ deleted: true });
});
app.get('*', (req,res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`MycoSaxaul ishlayapti: http://localhost:${PORT}`));
