# High-Scale Energy Ingestion Engine

A NestJS ingestion layer for Fleet Smart Meter and EV telemetry: polymorphic ingestion, hot/cold data stores, and 24-hour performance analytics with indexed queries (no full table scan).

## Quick Start

```bash
# With Docker
docker-compose up -d
# API: http://localhost:3000/v1

# Or local (requires Node 20+ and PostgreSQL)
cp .env.example .env
npm install
npm run start:dev
```

## Architecture Overview

### Data correlation

- **Smart meter (grid)**: Reports `kwhConsumedAc` (AC energy billed). Stored per `meterId`.
- **EV/charger (vehicle)**: Reports `kwhDeliveredDc` (DC into battery) and `soc` (state of charge). Stored per `vehicleId`.
- **Correlation**: Each vehicle is linked to one meter via `vehicle_meter_mapping` (the meter that feeds that vehicle’s charger). Analytics join meter history and vehicle history in the same time window to compute **efficiency = DC/AC**. A drop below ~85% can indicate faults or leakage.

### Handling 14.4M+ records per day

- **Two streams, 60s heartbeats**: 10,000+ meters and 10,000+ vehicles × 2 × 60 × 24 ≈ 28.8M rows/day; the design targets this scale.
- **Separation of stores**:
  - **Hot (operational)**: `meter_readings_live`, `vehicle_readings_live` — one row per meter/vehicle. **UPSERT** on each heartbeat so dashboards read “current” state without scanning history.
  - **Cold (historical)**: `meter_readings_history`, `vehicle_readings_history` — **append-only INSERT** for every reading to build a full audit trail.
- **Indexes**: History tables use composite indexes `(meter_id, timestamp)` and `(vehicle_id, timestamp)` so 24h analytics use **index range scans**, not full table scans.
- **Optional scaling**: For billions of rows, add time-based partitioning (e.g. by day) on history tables; the same indexed queries apply per partition.

### API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/telemetry/ingest` | Polymorphic ingest: body must include `type: "meter"` or `"vehicle"` and the corresponding fields. |
| GET | `/v1/analytics/performance/:vehicleId` | 24h summary: total AC, total DC, efficiency ratio (DC/AC), average battery temp. |
| POST | `/v1/analytics/vehicle-mapping` | Register `{ vehicleId, meterId }` for AC/DC correlation. |

### Ingestion payloads

**Meter** (`type: "meter"`):

```json
{
  "type": "meter",
  "meterId": "M001",
  "kwhConsumedAc": 12.5,
  "voltage": 240,
  "timestamp": "2025-01-15T12:00:00Z"
}
```

**Vehicle** (`type: "vehicle"`):

```json
{
  "type": "vehicle",
  "vehicleId": "V001",
  "soc": 85,
  "kwhDeliveredDc": 10.2,
  "batteryTemp": 28.5,
  "timestamp": "2025-01-15T12:00:00Z"
}
```

### Persistence

- **History**: Every ingest does an **INSERT** into the relevant `*_readings_history` table (append-only).
- **Live**: Same ingest **UPSERT**s into the relevant `*_readings_live` table by `meter_id` or `vehicle_id`, so “current SoC” and “last voltage” are a single row read.

### Tech stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **ORM**: TypeORM (entities, migrations, indexed queries)

## Project layout

```
src/
├── main.ts                 # Bootstrap, global prefix /v1, validation pipe
├── app.module.ts
├── database/
│   ├── typeorm-config.ts
│   ├── entities/           # Hot + cold entities, vehicle_meter_mapping
│   └── migrations/         # Initial schema (tables + indexes)
├── telemetry/              # Polymorphic ingestion
│   ├── dto/
│   ├── telemetry.controller.ts  # POST /telemetry/ingest
│   ├── telemetry.service.ts     # INSERT history + UPSERT live
│   └── telemetry.module.ts
└── analytics/
    ├── analytics.controller.ts  # GET /analytics/performance/:id, POST vehicle-mapping
    ├── analytics.service.ts     # 24h aggregates via indexed range scans
    └── analytics.module.ts
```

## Environment

Copy `.env.example` to `.env` and set variables.

- **Local**: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` (or `DATABASE_URL`), `PORT`, `NODE_ENV`.
- **Render**: In production you **must** set `DATABASE_URL`. In the Render dashboard: create a Postgres service, then in your Web Service → Environment add `DATABASE_URL` with the **Internal Connection String** from the Postgres service. Also set `NODE_ENV=production`.


