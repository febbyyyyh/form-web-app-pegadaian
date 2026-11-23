# FormKanwil

Portal formulir digital untuk membantu administrator Kanwil Pegadaian membuat dan mengelola form, lalu meninjau jawaban yang dikirim responden.

## Fitur

- **Dashboard admin** untuk melihat ringkasan form dan jawaban, beserta visualisasi respons.
- **Pengelolaan form** untuk membuat, mengedit, mengaktifkan, mencari, dan menutup form.
- **Beragam jenis pertanyaan**, termasuk jawaban singkat, paragraf, pilihan, rating, angka, dan tanggal.
- **Akses responden dengan kode** tanpa perlu masuk ke akun admin.
- **Identitas responden wajib** berupa nama lengkap dan email, tercatat bersama setiap jawaban dan ekspor.
- **Peninjauan dan ekspor jawaban** berdasarkan form dan rentang tanggal, dengan pratinjau CSV serta unduhan CSV atau PDF.
- **Data demo tersimpan di browser** menggunakan `localStorage`; aplikasi dapat dicoba tanpa backend.

> **Catatan:** data hanya tersimpan di browser yang digunakan dan tidak dibagikan antarperangkat. Aplikasi ini merupakan demo, bukan sistem produksi untuk menyimpan data sensitif.

## Menjalankan secara lokal

Pastikan Node.js dan npm sudah terpasang, lalu jalankan:

```sh
git clone https://github.com/febbyyyyh/form-web-app-pegadaian.git
cd form-web-app-pegadaian
npm install
npm run dev
```

Buka URL lokal yang ditampilkan oleh Vite di terminal.

## Perintah yang tersedia

```sh
npm run dev     # Menjalankan server pengembangan
npm test        # Menjalankan test
npm run build   # Membuat build produksi
```

## Teknologi

- React dan TypeScript
- TanStack Start dan TanStack Router
- Vite
- Tailwind CSS
- Recharts
