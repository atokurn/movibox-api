# MovieBox HD API Provider

MovieBox HD API Provider adalah layanan REST API yang bertindak sebagai perantara (wrapper) untuk mengakses konten dari MovieBox HD / Gargan Video. Proyek ini memungkinkan pengembang untuk mengintegrasikan data film, drama, dan konten video dari platform MovieBox ke dalam aplikasi mereka sendiri dengan mudah.

API ini menyediakan akses ke berbagai fitur seperti pencarian konten, detail film/drama, daftar episode, video shorts/reels, dan URL streaming. Dengan menggunakan API ini, Anda dapat membangun aplikasi streaming kustom atau layanan agregator konten tanpa perlu melakukan reverse engineering langsung pada aplikasi aslinya.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Daftar Isi

- [Prasyarat dan Persyaratan Sistem](#prasyarat-dan-persyaratan-sistem)
- [Instalasi dan Setup](#instalasi-dan-setup)
- [Cara Penggunaan](#cara-penggunaan)
- [Struktur Proyek](#struktur-proyek)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)
- [Kontak dan Kredit](#kontak-dan-kredit)
- [FAQ](#faq)

## Prasyarat dan Persyaratan Sistem

Sebelum menjalankan proyek ini, pastikan sistem Anda telah memenuhi persyaratan berikut:

- **Node.js**: Versi 18.0.0 atau lebih baru
- **npm**: Versi 9.0.0 atau lebih baru (biasanya terinstal bersama Node.js)

Dependensi utama proyek ini meliputi:
- `express`: Framework web server
- `axios`: HTTP client untuk melakukan request ke API sumber
- `cors`: Middleware untuk mengizinkan Cross-Origin Resource Sharing
- `dotenv`: Manajemen variabel lingkungan
- `@scalar/express-api-reference`: Dokumentasi API interaktif
- `node-forge`: Utilitas kriptografi
- `cheerio`: Parsing HTML (untuk scraping web jika diperlukan)

## Instalasi dan Setup

Ikuti langkah-langkah berikut untuk menginstal dan menjalankan aplikasi di mesin lokal Anda:

1. **Clone Repository**
   ```bash
   git clone https://github.com/username/moviebox-api-provider.git
   cd moviebox-api-provider
   ```

2. **Instal Dependensi**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**
   Salin file contoh `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Sesuaikan variabel di dalam file `.env` jika diperlukan:
   ```env
   PORT=3000
   DEVICE_ID=6e4e81ec362f7630
   AD_ID=4071e87a-08cc-4ee3-9922-0577f83c73b2
   # LANGUAGE=en
   # TIMEZONE=7
   ```

4. **Jalankan Aplikasi**
   
   Untuk mode development (dengan auto-reload):
   ```bash
   npm run dev
   ```
   
   Untuk mode produksi:
   ```bash
   npm start
   ```

   Server akan berjalan di `http://localhost:3000`.

## Cara Penggunaan

Setelah server berjalan, Anda dapat mengakses dokumentasi API lengkap melalui browser di:
`http://localhost:3000/`

Dokumentasi ini menyediakan antarmuka interaktif (Scalar UI) untuk mencoba setiap endpoint secara langsung.

### Fitur Utama

1. **MovieBox Mobile API (`/moviebox`)**: API yang meniru klien mobile, mungkin memiliki batasan geo-lokasi.
2. **MovieBox Web API (`/movieboxph`)**: API dari versi web, biasanya tanpa batasan geo-lokasi dan menyediakan URL video yang lebih mudah diakses.

### Contoh API Endpoint

Berikut adalah beberapa contoh endpoint yang tersedia:

**Health Check**
```bash
curl http://localhost:3000/moviebox/health
```

**Mendapatkan Beranda (Home)**
```bash
curl "http://localhost:3000/moviebox/home?page=0&size=10"
```

**Pencarian Konten**
```bash
curl "http://localhost:3000/moviebox/search?keyword=avengers"
```

**Detail Film/Drama**
```bash
# Ganti :contentId dengan ID konten yang didapat dari search/home
curl http://localhost:3000/moviebox/detail/12345
```

**Mendapatkan URL Streaming (Web API)**
```bash
# Menggunakan route /movieboxph untuk akses video yang lebih stabil
curl "http://localhost:3000/movieboxph/sources/12345?season=1&episode=1"
```

## Struktur Proyek

Berikut adalah gambaran struktur direktori proyek:

```
moviebox-api-provider/
├── src/
│   ├── routes/           # Definisi rute API (endpoints)
│   │   ├── moviebox.js   # Rute untuk Mobile API
│   │   └── movieboxph.js # Rute untuk Web API
│   ├── services/         # Logika bisnis dan pemanggilan ke API eksternal
│   └── lib/              # Helper functions dan konfigurasi (OpenAPI spec, client)
├── public/               # File statis (jika ada)
├── .env.example          # Template variabel lingkungan
├── index.js              # Entry point aplikasi
├── package.json          # Manifest proyek dan dependensi
└── README.md             # Dokumentasi proyek
```

- **`index.js`**: File utama yang menginisialisasi Express app, middleware, dan routing.
- **`src/services/`**: Berisi logika inti untuk berkomunikasi dengan server MovieBox asli.
- **`src/routes/`**: Menangani request HTTP masuk dan meneruskannya ke service yang sesuai.

## Kontribusi

Kontribusi sangat diterima! Jika Anda ingin berkontribusi pada proyek ini, silakan ikuti langkah-langkah berikut:

1. **Fork** repository ini.
2. Buat branch fitur baru (`git checkout -b fitur-keren`).
3. Commit perubahan Anda (`git commit -m 'Menambahkan fitur keren'`).
4. Push ke branch (`git push origin fitur-keren`).
5. Buat **Pull Request**.

### Melaporkan Bug
Jika Anda menemukan bug, silakan buat issue baru di GitHub dengan menyertakan:
- Langkah-langkah untuk mereproduksi bug.
- Perilaku yang diharapkan vs perilaku yang terjadi.
- Screenshot atau log error jika ada.

## Lisensi

Proyek ini didistribusikan di bawah lisensi **MIT**. Lihat file `LICENSE` untuk informasi lebih lanjut.

## Kontak dan Kredit

**Maintainer:**
- Antigravity (GitHub: [link-profil-github])

**Kredit:**
- Terima kasih kepada komunitas open source yang telah menyediakan tool-tool hebat.
- Data disediakan oleh MovieBox HD / Gargan Video. Proyek ini hanya merupakan penyedia API pihak ketiga dan tidak berafiliasi resmi.

## FAQ

**Q: Apakah API ini gratis?**
A: Ya, wrapper API ini open source dan gratis. Namun, ketersediaan konten bergantung pada layanan MovieBox asli.

**Q: Mengapa saya mendapatkan error 403 atau Geo-restriction?**
A: Beberapa konten mungkin dibatasi berdasarkan wilayah IP Anda. Cobalah menggunakan endpoint `/movieboxph` yang biasanya lebih longgar, atau gunakan VPN/Proxy yang sesuai di konfigurasi server Anda.

**Q: Bagaimana cara mendapatkan API Key?**
A: Saat ini tidak diperlukan API Key khusus untuk menggunakan wrapper ini di lingkungan lokal.
