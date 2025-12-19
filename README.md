# E-Commerce Microservices Backend

Ini adalah backend E-Commerce yang dibangun menggunakan arsitektur microservices dengan Node.js. Setiap layanan dibuat sebagai unit mandiri yang berkomunikasi melalui API Gateway.

## Arsitektur Sistem

Sistem terbagi menjadi beberapa service yang berjalan sendiri dan saling terhubung melalui HTTP.

| Service         | Port | Deskripsi                                                                                      |
| --------------- | ---- | ---------------------------------------------------------------------------------------------- |
| API Gateway     | 3000 | Titik masuk utama. Meneruskan request ke service sesuai routing. Tersedia dokumentasi Swagger. |
| User Service    | 3001 | Mengelola autentikasi berbasis JWT dan data profil pengguna.                                   |
| Product Service | 3002 | Mengelola katalog dan detail produk.                                                           |
| Order Service   | 3003 | Mengelola pemesanan dan transaksi.                                                             |

### Infrastruktur Pendukung

* PostgreSQL sebagai database utama.
* Redis untuk caching dan penyimpanan session.
* Shared Package untuk utilitas yang digunakan lintas service.

## Tech Stack

* Node.js
* Express.js
* Prisma ORM (PostgreSQL)
* Redis
* http-proxy-middleware (API Gateway)
* Docker dan Docker Compose
* Swagger UI

## Prerequisites

Pastikan perangkat sudah terpasang:

* Node.js versi 18 atau lebih baru
* Docker Desktop

## Cara Menjalankan Project (Docker)

Metode ini paling mudah karena semua service, database, dan redis akan dijalankan otomatis dalam container.

### 1. Setup Environment
Karena file `.env` bersifat rahasia, Anda perlu membuatnya dari contoh yang ada.

1.  Copy file `.env.example` di root folder.
2.  Rename menjadi `.env`.
3.  Sesuaikan isinya (password DB, dll) jika perlu.

### 2. Build & Run
Jalankan perintah ini di terminal root:

```bash
docker-compose up --build
```
Tunggu hingga semua container (gateway, services, postgres, redis) berstatus `Started`.

### 3. Migrasi Database (Pertama Kali)
Karena database di dalam Docker masih kosong, kita perlu membuat tabelnya secara manual.
Buka terminal baru, lalu jalankan:

```bash
# Migrasi User Service
docker exec ecommerce_user_service npx prisma db push

# Migrasi Product Service
docker exec ecommerce_product_service npx prisma db push

# Migrasi Order Service
docker exec ecommerce_order_service npx prisma db push
```

### 4. Seeding Data (Optional)
Untuk mengisi data awal (Admin & Produk Dummy):

```bash
# Isi data User (Admin & User Biasa)
docker exec ecommerce_user_service node prisma/seed.js

# Isi data Produk Dummy (20 items)
docker exec ecommerce_product_service node prisma/seed.js
```

---

## Cara Menjalankan Project (Manual / Tanpa Docker)

Gunakan cara ini jika Anda ingin menjalankan satu per satu service secara manual untuk development.

### 1. Instalasi Dependencies

Project memakai npm workspaces. Jalankan perintah berikut untuk menginstal seluruh dependency dari root folder.

```bash
npm install
```

### 2. Menjalankan Database dan Redis

Gunakan Docker Compose hanya untuk DB & Redis (bukan servicenya).

I. Edit `docker-compose.yml`, comment/hapus bagian service (api-gateway, user-service, dll), sisakan `postgres` dan `redis`.
II. Jalankan:
```bash
docker-compose up -d
```

### 3. Konfigurasi Environment

Setiap service membutuhkan file .env sendiri di folder masing-masing (`services/user-service/.env`, dll).
Pastikan `DATABASE_URL` mengarah ke `localhost:5432`.

### 4. Migrasi Database

```bash
cd services/user-service
npx prisma db push
# Ulangi untuk service lain...
```

### 5. Menjalankan Aplikasi

Jalankan masing-masing service di terminal berbeda.

```bash
npm run dev -w services/api-gateway
npm run dev -w services/user-service
npm run dev -w services/product-service
npm run dev -w services/order-service
```

### 6. Seeding Data User & Produk

Untuk mengisi database dengan data awal (User Admin & Produk Dummy):

**User & Admin:**
```bash
# Di dalam folder services/user-service
npx prisma db seed
```

**Produk:**
```bash
# Di dalam folder services/product-service
npx prisma db seed
```

### 7. Akses & Kredensial

Setelah seeding, Anda dapat menggunakan akun berikut untuk Login:

| Role | Email | Password | Akses |
|------|-------|----------|-------|
| **Admin** | `admin@example.com` | `admin123` | Full Access (Create/Edit/Delete Product) |
| **User** | `user@cc.cc` | `admin123` | View Product, Create Order |

> **Catatan Penting**: Sejak update terakhir, service `product-service` menerapkan **Role-Based Access Control (RBAC)**. Hanya token dari user dengan role `admin` yang bisa melakukan operasi tulis (POST/PUT/DELETE) pada produk. Pastikan login ulang untuk mendapatkan token terbaru.

## Dokumentasi API

Swagger dapat diakses melalui API Gateway.

[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Struktur Project

```
ecommerce-root/
├── docker-compose.yml
├── package.json
├── packages/
│   └── shared/
└── services/
    ├── api-gateway/
    ├── user-service/
    ├── product-service/
    └── order-service/
```

---
