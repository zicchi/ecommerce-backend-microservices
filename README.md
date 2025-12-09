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

## Cara Menjalankan Project

### 1. Instalasi Dependencies

Project memakai npm workspaces. Jalankan perintah berikut untuk menginstal seluruh dependency dari root folder.

```bash
npm install
```

### 2. Menjalankan Database dan Redis

Gunakan Docker Compose.

```bash
docker-compose up -d
```

### 3. Konfigurasi Environment

Setiap service membutuhkan file .env sendiri. Sesuaikan dengan konfigurasi service masing-masing.

Contoh untuk API Gateway

```env
PORT=3000
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
```

Contoh variabel umum untuk setiap service

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommerce_db?schema=public"
JWT_SECRET="rahasia_sangat_aman"
REDIS_URL="redis://localhost:6379"
```

Pastikan lokasi file .env sesuai dengan konfigurasi yang dibaca di index.js masing-masing service.

### 4. Migrasi Database

Setiap service yang memiliki schema harus menjalankan migrasinya sendiri.

```bash
cd services/user-service
npx prisma migrate dev --name init
```

### 5. Menjalankan Aplikasi

Jalankan masing-masing service di terminal berbeda.

```bash
npm start -w services/api-gateway
npm start -w services/user-service
npm start -w services/product-service
npm start -w services/order-service
```

Jika tersedia script dev dengan nodemon

```bash
npm run dev -w services/api-gateway
npm run dev -w services/api-gateway
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
