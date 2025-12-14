# Setup Game Scores & Leaderboard

## Langkah-langkah Setup

### 1. Stop Server Backend
Pastikan server backend **tidak berjalan** sebelum menjalankan migration dan generate.

### 2. Jalankan Migration Database
```bash
cd FP-PemrogramanWebsite-BE-2025
npx prisma migrate dev --name add_game_scores
```

Ini akan:
- Membuat table `GameScores` di database
- Menambahkan foreign keys ke `Users` dan `Games`

### 3. Generate Prisma Client
```bash
npx prisma generate
```

Ini akan:
- Generate TypeScript types untuk model `GameScores`
- Memperbarui Prisma client dengan model baru

### 4. Restart Server Backend
Setelah migration dan generate selesai, restart server backend.

## Verifikasi

Setelah setup selesai, pastikan:
- ✅ Table `GameScores` ada di database
- ✅ Tidak ada error TypeScript di `game-score.service.ts`
- ✅ API endpoint `/api/game/score` bisa diakses
- ✅ Leaderboard bisa ditampilkan

## Troubleshooting

### Error: "Property 'gameScores' does not exist"
**Solusi**: Jalankan `npx prisma generate`

### Error: "EPERM: operation not permitted"
**Solusi**: Stop server backend terlebih dahulu, lalu jalankan `npx prisma generate`

### Error: "Table 'GameScores' does not exist"
**Solusi**: Jalankan `npx prisma migrate dev --name add_game_scores`

