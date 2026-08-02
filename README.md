# 🚀 MediaFlow: Distributed Cloud Media Processing Platform

[![Deploy with Vercel](https://vercel.com/button)](https://mediaflow-platform.vercel.app)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19-000000?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb)](https://www.mongodb.com/)
[![BullMQ](https://img.shields.io/badge/BullMQ-5.8-red?logo=redis)](https://bullmq.io/)
[![Redis](https://img.shields.io/badge/Redis-7.2-DC382D?logo=redis)](https://redis.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![AWS S3](https://img.shields.io/badge/AWS-S3-569A31?logo=amazon-s3)](https://aws.amazon.com/s3/)

> **MediaFlow** is an enterprise-grade, microservice-based distributed cloud media processing platform designed using Node.js, Next.js (App Router), MongoDB, BullMQ, Redis, Sharp, and Fluent-FFmpeg. It decouples API Gateway request handling from CPU/GPU-intensive image transformation and video transcoding tasks using asynchronous distributed workers.

---

## 🌟 Live Demo & Deployments

- **🌐 Live Production Dashboard (Vercel)**: [https://mediaflow-platform.vercel.app](https://mediaflow-platform.vercel.app)
- **💻 GitHub Repository**: [https://github.com/navsharma26/mediaflow](https://github.com/navsharma26/mediaflow)

---

## 🏗️ System Architecture & Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as User / Browser
    participant UI as Next.js Dashboard (App Router)
    participant API as Express API Gateway
    participant Cloud as AWS S3 Storage Bucket
    participant DB as MongoDB Database
    participant Queue as Redis (BullMQ Engine)
    participant Worker as Image/Video Microservices

    Client->>UI: Select Media File & Preset (Resize / Transcode / Watermark)
    UI->>API: POST /api/assets/upload-intent (filename, mimeType)
    API->>API: AWS SDK generates S3 Presigned PUT URL
    API->>DB: Save placeholder Asset (Status: PENDING)
    API-->>UI: Return S3 Presigned URL & AssetID
    
    UI->>Cloud: axios.put(uploadUrl, fileBuffer) [Direct Cloud Upload]
    Cloud-->>UI: 200 OK Upload Finished
    
    UI->>API: POST /api/jobs (assetId, taskConfig)
    API->>DB: Save Job record (Status: PENDING)
    API->>Queue: Push Job to BullMQ (image-processing-queue / video-processing-queue)
    API-->>UI: 202 Accepted (Job ID & BullMQ ID)

    Queue->>Worker: Consume Processing Job
    Worker->>DB: Update Status: PROCESSING (Progress: 10%)
    Worker->>Cloud: Download raw media asset
    Worker->>Worker: Run Sharp (200x200 resize + watermark) OR FFmpeg transcode
    Worker->>Cloud: Upload processed output variant to processed/ directory
    Worker->>DB: Update Asset Status: PROCESSED & record processed_url
    Worker->>DB: Update Job Status: COMPLETED & record progress: 100%

    loop Live Status Polling (2s Interval)
        UI->>API: GET /api/assets & GET /api/jobs
        API->>DB: Fetch state
        API-->>UI: Return updated Asset status & Job progress (0% -> 100%)
    end
```

---

## 💡 Key Features & Architectural Capabilities

### 1. ⚡ High-Throughput API Gateway
- Express.js REST API with JWT Authentication (`/api/auth/register`, `/api/auth/login`).
- `POST /api/assets/upload-intent` endpoint generating secure AWS S3 Presigned URLs for direct browser-to-cloud file uploads.
- Rate limiting, security headers (`helmet`), and CORS protection.

### 2. 🔄 Asynchronous BullMQ & Redis Messaging
- Decouples client request loops from heavy media processing tasks.
- Exponential backoff retries, concurrency controls, and real-time execution progress updates (`0%` -> `100%`).

### 3. 🖼️ Image Worker Microservice (`sharp`)
- Standalone worker process consuming `image-processing-queue`.
- Performs fast `200x200` thumbnail resizing with smart gravity cropping.
- Composites dynamic SVG text watermarks over images.
- Format conversions (WebP, AVIF, PNG, JPEG).

### 4. 🎥 Video Worker Microservice (`fluent-ffmpeg`)
- Standalone worker process consuming `video-processing-queue`.
- Transcodes video files across standard resolution scaling presets (`1080p`, `720p`, `480p`, `360p`).
- Screenshot thumbnail extraction at configurable timestamps.

### 5. 🪟 Next.js 14 App Router User Dashboard
- Dark glassmorphism UI with real-time job execution monitor.
- Dynamic `AssetCard` and `JobCard` components displaying status badges (`Queued`, `Processing`, `Completed`, `Failed`).
- Direct S3 `axios.put` cloud upload integration.

### 6. 🗄️ Pluggable Abstract Storage Layer (`IStorageProvider`)
- Modular storage provider interface enabling effortless switching between `LocalStorageProvider` (for local development) and `S3StorageProvider` (AWS S3 / Cloudflare R2 for production).

---

## 📁 Repository Directory Structure

```
mediaflow/
├── vercel.json                          # Vercel Monorepo deployment configuration
├── docker-compose.yml                   # Local MongoDB & Redis service containers
├── package.json                         # Monorepo workspaces definition
├── README.md
│
├── packages/                            # Shared internal workspace libraries
│   ├── shared-types/                    # TypeScript interfaces (IUser, IAsset, IJob)
│   └── storage-service/                 # Abstract Storage Provider (Local FS & AWS S3)
│
└── apps/                                # Distributed microservices & frontend
    ├── api-gateway/                     # Express REST Gateway & Mongoose Models
    ├── image-worker/                    # Microservice worker for Sharp image pipeline
    ├── video-worker/                    # Microservice worker for FFmpeg video pipeline
    └── frontend/                        # Next.js 14 App Router User Dashboard
```

---

## 🛠️ Local Installation & Quickstart

### Prerequisites
- Node.js `v18+` or `v20+`
- MongoDB (`v7.0+`) & Redis (`v7.2+`)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/navsharma26/mediaflow.git
cd mediaflow
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory (or copy `.env.example`):
```env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/mediaflow
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=mediaflow_super_secret_jwt_key_2026

STORAGE_DRIVER=local
LOCAL_STORAGE_PATH=./uploads
PUBLIC_BASE_URL=http://localhost:5001
```

### 3. Start Infrastructure (Docker)
```bash
docker-compose up -d
```

### 4. Run Development Services
```bash
# Start Express API Gateway (Port 5001)
npm run dev:gateway

# Start Image Worker Microservice
npm run dev:image-worker

# Start Video Worker Microservice
npm run dev:video-worker

# Start Next.js Frontend Dashboard (Port 3000)
npm run dev:frontend
```

---

## 📡 REST API Endpoint Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | Login user & return JWT token | ❌ |
| `POST` | `/api/assets/upload-intent` | Generate S3 Presigned PUT URL & placeholder asset | ✅ |
| `GET` | `/api/assets` | Retrieve all uploaded user assets | ✅ |
| `POST` | `/api/jobs` | Enqueue processing job into BullMQ | ✅ |
| `GET` | `/api/jobs` | Retrieve user jobs & live progress | ✅ |
| `GET` | `/api/jobs/:id` | Get specific job status details | ✅ |
| `GET` | `/health` | API Gateway health check endpoint | ❌ |

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👨‍💻 Author

**Navneet Sharma**  
- **GitHub**: [@navsharma26](https://github.com/navsharma26)  
- **Project Link**: [https://github.com/navsharma26/mediaflow](https://github.com/navsharma26/mediaflow)
