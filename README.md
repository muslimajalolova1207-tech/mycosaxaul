# MycoSaxaul — Node.js versiyasi

## Talablar
- Node.js 18 yoki undan yangi versiya
- npm

## Ishga tushirish
```bash
npm install
npm start
```
Brauzerda: http://localhost:3000

## API
- `GET /api/health` — server holati
- `POST /api/calculate` — hisob-kitobni backendda bajarish
- `GET /api/saved` — saqlangan hisoblar
- `POST /api/saved` — hisobni saqlash
- `DELETE /api/saved/:id` — hisobni o‘chirish

Hisoblar `data/saved-calculations.json` faylida saqlanadi.
Hostingga joylaganda doimiy disk (persistent storage) kerak bo‘lishi mumkin.

## Eslatma
Yashab qolish foizlari va xarajatlar foydalanuvchi kiritgan qiymatlardir. Namuna qiymatlar ilmiy tasdiqlangan natija emas.
