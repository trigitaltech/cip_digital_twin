# Carbon-In-Pulp (CIP) Digital Twin Optimization Service

A production-ready digital twin microservice that tracks, persists, and optimizes metallurgical gold extraction metrics.

## Architecture Structure
- `circuit_analytics/`: Contains the advanced countercurrent simulation and SciPy non-linear optimizer logic.
- `database/`: Contains the SQLAlchemy 2.0 ORM database schema definitions and connection pooling context.
- `api/`: Main FastAPI application router mapping incoming instrumentation to data structures.

## Installation & Setup

### Option 1: Docker Compose (Quickstart)
Start PostgreSQL and the API service:
```bash
docker compose up -d
```
Or start only the PostgreSQL database container (for local development):
```bash
docker compose up -d postgres
```

### Option 2: Local Setup
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the database (e.g. using `docker compose up -d postgres`).
3. (Optional) Set `DATABASE_URL` in `.env` or your environment:
   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/metallurgy_db
   ```
4. Spin up the server:
   ```bash
   uvicorn api.main:app --reload --port 8000
   ```

## Operating Documentation & Manual
For complete engineering theory, reagent dosing formulas, countercurrent adsorption equations, API schemas, and operator SOPs, see the comprehensive [Operating Documentation](file:///e:/claude_repos/cip_digital_twin/OPERATING_DOCUMENTATION.md).


-------------------------------------------------------------------------------------------------------------

This is a fascinating API. Here's a breakdown of what it does based on the request and response:

POST /api/v2/telemetry — CIP Process Telemetry & Analytics Engine
This endpoint accepts real-time operational data from a Carbon-In-Pulp (CIP) gold leaching circuit and returns a rich set of computed analytics, recommendations, and projections. It appears to be a backend for a gold mining / mineral processing plant.

What you send (Request)
Field	Description
circuit_id	Identifies the CIP line (e.g. CIP-LINE-2)
process_type	Process type — CIP (Carbon-In-Pulp)
timestamp	ISO 8601 timestamp of the telemetry snapshot
global_metrics	Slurry flow rate, density, pH, and carbon advance rate
mineralogy_assay	Ore head grade (Au g/t), sulfur/copper/arsenic content, target pH and cyanide levels
tank_stages	Per-tank data: solution gold (ppm), carbon load (g/t), carbon density (g/L), and fouling factor
What you get back (Response — HTTP 201)
The API computes and returns four major analytical outputs:

1. Mass Balance Calculates derived physical quantities from the slurry inputs:

Slurry specific gravity, mass rate (t/h)
Dry ore throughput (t/h)
Process water consumption (m³/h)
Liquid-to-solid ratio
2. Chemical Reagent Dosing Recommendations Prescribes dosing rates for three key reagents:

Lime — for protective alkalinity (target pH 10.5–11.0)
Sodium Cyanide (NaCN) — for gold complexation and lixiviation
Oxidant (H₂O₂ or O₂) — for dissolved oxygen maintenance and sulfide passivation
Each reagent recommendation includes kg/dry tonne, kg/hour, and daily consumption in tonnes.

3. Carbon Adsorption Recommendations Optimizes the carbon circuit:

Recommended carbon advance rate (t/h)
Recommended carbon densities per tank (g/L)
Predicted tail solution gold (ppm) — i.e. gold lost to tailings
Predicted circuit recovery percentage
4. Projected Production Yield

Estimated gold recovery rate (g/h)
Estimated daily gold production in troy ounces
Summary
This API is essentially a real-time process optimization engine for a CIP gold extraction plant. You feed it live sensor/assay data, and it returns actionable recommendations for reagent dosing, carbon management, and production forecasting — likely powering a plant operations dashboard or control system.

The v2 in the path suggests there's a versioned API, so there may be other endpoints (e.g. for retrieving historical telemetry, circuit configuration, or alerts).

