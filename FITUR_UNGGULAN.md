# 🌟 Fitur Unggulan & Audit Sistem E-Ticketing MANTARA

Dokumen ini berisi hasil audit sistem dan daftar fitur unggulan yang membuat platform **Mantara Speedboat E-Ticketing** menjadi solusi modern, premium, dan andal untuk transportasi laut di Kalimantan Utara (Kaltara).

---

## 🚀 1. Peta Rute Interaktif & Animasi Real-Time (`InteractiveMap.jsx`)
Sistem pemesanan dilengkapi dengan modul peta berbasis **MapLibre GL** yang sangat interaktif dan responsif:
* **Interactive Port Selection**: Pengguna dapat memilih pelabuhan asal dan tujuan langsung dengan mengklik pin lokasi pada peta.
* **Animated Route Path**: Garis rute antara dua pelabuhan memiliki efek animasi dinamis untuk memberikan indikasi visual perjalanan yang jelas.
* **Status Guides**: Petunjuk kontekstual di atas peta memandu pengguna langkah demi langkah (Pilih Asal ➔ Pilih Tujuan).

---

## 💳 2. Integrasi Pembayaran Midtrans & Manajemen Status (`App.jsx`)
Mantara mengintegrasikan gerbang pembayaran **Midtrans** dengan sistem manajemen status yang sangat aman dan transparan:
* **Seamless Payment Redirect**: Menghindari masalah pemblokiran pop-up browser dengan mengalihkan pengguna langsung ke halaman pembayaran resmi Midtrans secara aman.
* **Granular Payment States**: Sistem menangani semua status pembayaran dari Midtrans secara real-time:
  * **LUNAS**: Menghasilkan tiket aktif, hitung mundur keberangkatan, dan QR Code boarding pass.
  * **MENUNGGU PEMBAYARAN**: Menampilkan instruksi pembayaran dan membatasi akses tiket.
  * **GAGAL / DIBATALKAN**: Menampilkan pesan kesalahan khusus dan mencegah pembuatan boarding pass.

---

## 🎟️ 3. Boarding Pass Autentik & QR Code Generator (`helpers.jsx`)
Platform ini menyajikan tiket digital siap cetak yang ramah pengguna:
* **Real QR Code Generation**: Menggunakan pustaka `@qrcode.react` untuk menghasilkan kode QR unik yang berisi ID pemesanan dan nomor kursi secara instan.
* **Scanner Ready**: Kode QR siap dipindai oleh petugas di pelabuhan untuk validasi masuk yang cepat dan aman.
* **Departure Countdown**: Penghitung waktu mundur interaktif (`CountdownTimer.jsx`) yang menunjukkan sisa waktu sebelum kapal berangkat.

---

## 💺 4. Pemilihan Kursi Interaktif & Manifes Penumpang (`PassengerManifest.jsx`)
Mencegah pemesanan ganda dan meningkatkan kenyamanan penumpang:
* **Visual Seat Map**: Denah kursi kapal ditampilkan secara grafis, membedakan kursi kosong, kursi yang dipilih, dan kursi yang sudah dipesan oleh penumpang lain.
* **Multi-Passenger Manifest**: Memungkinkan pembelian beberapa tiket sekaligus dalam satu transaksi dengan pengisian data manifes (nama, nomor identitas, usia, dan kontak) untuk setiap penumpang.

---

## 📊 5. Panel Dashboard Admin & Operator Komprehensif (`src/components/admin/`)
Panel manajemen backend yang lengkap untuk mengontrol seluruh ekosistem Mantara:
* **Overview Analytics**: Grafik interaktif menggunakan **Recharts** untuk melacak pendapatan harian, bulanan, volume transaksi, dan jumlah manifes penumpang.
* **Schedule & Tariff Management**: Pengaturan jadwal keberangkatan, kapasitas kapal, operator kapal, dan harga tiket secara dinamis melalui interface drawer yang intuitif.
* **Report Exporting**: Fitur ekspor laporan transaksi dan manifes ke format CSV/Excel untuk mempermudah audit pembukuan.
* **Operator Accounts Control**: Membuat akun khusus operator speedboat agar mereka dapat mengelola armada dan manifes kapal mereka sendiri.

---

## 🔐 6. Autentikasi Firebase & Fallback Demo Pintar (`LoginPage.jsx`)
Keamanan tingkat tinggi dengan kemudahan akses pengujian:
* **Secure Auth**: Integrasi dengan **Firebase Authentication** untuk pendaftaran pengguna, masuk dengan email/kata sandi, serta login sosial menggunakan Google.
* **Smart Fallback Auto-Registration**: Jika pengguna masuk secara manual dengan akun demo default (`user@email.com` / `user123` atau `admin@email.com` / `admin123`) saat akun belum terdaftar di database Firebase, sistem akan secara otomatis mendaftarkan profil mereka secara instan di belakang layar dan melanjutkan proses login tanpa hambatan.
* **Bilingual Support (ID/EN)**: Interface login dan pendaftaran mendukung perpindahan bahasa instan (Bahasa Indonesia & English) dengan penanganan validasi formulir yang terlokalisasi.

---

## 🏨 7. Rekomendasi Hotel Sekitar Pelabuhan (`HotelRecommendations.jsx`)
Nilai tambah bagi pelancong dan wisatawan:
* **Location-based Recommendations**: Menampilkan hotel-hotel terdekat dan terbaik di pelabuhan tujuan.
* **Rich Metadata**: Menampilkan peringkat bintang, harga per malam, fasilitas utama, dan tautan pemesanan langsung untuk memudahkan akomodasi perjalanan.
