# Carbon-In-Pulp (CIP) & Carbon-In-Leach (CIL) Digital Twin Service
## Standard Operating Documentation & Technical Manual

**Document Version:** 2.1.0  
**Target Audience:** Process Metallurgists, Plant Control Room Operators, SCADA/DCS Automation Engineers, and Software Site Reliability Engineers (SREs).

---

## 1. Executive Summary & Purpose

The **Carbon-In-Pulp (CIP) Digital Twin Optimization Service** is an automated metallurgical modeling and optimization microservice designed for gold processing plants. It bridges distributed control systems (DCS / SCADA) and analytical laboratory assays with predictive chemical and kinetic modeling.

The service performs three mission-critical functions in real time:
1. **Slurry Mass Balancing**: Continuously calculates dry ore throughput, slurry specific gravity, and process water volumetric flow from plant density gauges and flowmeters.
2. **Reagent Dosing Derivation**: Computes stoichiometric and kinetic setpoints for Lime ($Ca(OH)_2$), Sodium Cyanide ($NaCN$), and Oxidants ($H_2O_2$ / pure $O_2$), calibrated against empirical metallurgical testwork (Peacocke & Simpson testwork report PS/13264/26).
3. **Countercurrent Carbon Adsorption Optimization**: Uses SciPy Sequential Least Squares Programming (SLSQP) to calculate optimal carbon advance rates and per-tank carbon concentrations to minimize soluble gold tail losses while preventing carbon attrition.

```
                      +---------------------------------------+
                      | Plant DCS / SCADA / Laboratory Assays |
                      +---------------------------------------+
                                          |
                                          | HTTP POST /api/v2/telemetry
                                          v
+-----------------------------------------------------------------------------------+
|                        CIP/CIL DIGITAL TWIN ENGINE (FastAPI)                      |
|                                                                                   |
|  +------------------------+  +------------------------+  +---------------------+  |
|  | Slurry Throughput &    |  | Reagent Dosing Model   |  | Countercurrent CIP  |  |
|  | Mass Balance Model     |  | (Lime, NaCN, H2O2/O2)  |  | Kinetics Optimizer  |  |
|  +------------------------+  +------------------------+  +---------------------+  |
|                                                                                   |
|                     +---------------------------------------+                     |
|                     | PostgreSQL 16 Persistence (SQLAlchemy)|                     |
|                     +---------------------------------------+                     |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      | Recommended Dosing & Carbon Setpoints |
                      |    (Pump Frequencies & Airlift Timers)|
                      +---------------------------------------+
```

---

## 2. Process Chemistry & Metallurgical Principles

### 2.1 Slurry Physical Mechanics & Throughput Balance

The digital twin converts volumetric flow ($Q_{slurry}$) and solids percentage ($w$, % w/w) into true mass throughput:

$$w = \frac{\text{slurry\_density\_pct}}{100}$$

$$\text{Slurry Specific Gravity } (SG_{slurry}) = \frac{1}{\left(\frac{w}{SG_{ore}}\right) + (1 - w)}$$

Where:
* $SG_{ore} = 2.70 \text{ t/m}^3$ (Standard quartz/silicate gold ore matrix)
* $\text{Slurry Mass Rate } (t/h) = Q_{slurry} \times SG_{slurry}$
* $\text{Dry Ore Throughput } (t/h) = \text{Slurry Mass Rate } \times w$
* $\text{Process Water Rate } (m^3/h) = \text{Slurry Mass Rate } \times (1 - w)$
* $\text{Liquid-to-Solid Ratio } (L/S) = \frac{1 - w}{w}$

---

### 2.2 Reagent Dosing Chemistry

#### 2.2.1 Protective Alkalinity & Lime ($Ca(OH)_2$)
To prevent hazardous, deadly hydrogen cyanide gas ($HCN_{(g)}$) volatilization, leach slurry must operate in a protective alkaline window ($pH \ge 10.50$, default target $10.80$):

$$CN^- + H_2O \rightleftharpoons HCN_{(aq)} + OH^- \quad (pK_a \approx 9.24)$$

* **Target Range:** $pH\ 10.50 - 11.00$
* **Control Law:** When incoming slurry $pH_{in} < pH_{target}$:
  $$\text{Lime Dosage } (kg/t) = \text{Baseline Lime} \times \frac{pH_{target} - pH_{in}}{pH_{target} - pH_{base\_in}}$$
  *Where $\text{Baseline Lime} = 1.50\ kg/t$, $pH_{base\_in} = 4.41$, and $pH_{target} = 10.80$.*
* **Maintenance Trim:** If slurry is already at or above target pH, a minimum maintenance dosage of $0.20\ kg/t$ is administered to maintain buffer capacity.

#### 2.2.2 Cyanidation & Cyanicide Matrix Compensation
Gold lixiviation follows Elsner's Equation:

$$4Au + 8NaCN + O_2 + 2H_2O \longrightarrow 4Na[Au(CN)_2] + 4NaOH$$

Cyanide consumption is heavily dictated by base metal cyanicides and sulfides rather than gold alone. The twin computes dynamic consumption multipliers:

$$\text{Gold Factor} = 1.0 + 0.08 \times (\text{Head Grade}_{Au} - 3.39)$$
$$\text{Copper Factor} = 1.0 + 0.80 \times (\%Cu - 0.12)$$
$$\text{Sulfide Factor} = 1.0 + 0.15 \times (\%S - 1.02)$$
$$\text{Composite Factor} = \max(0.50,\; \text{Gold Factor} \times \text{Copper Factor} \times \text{Sulfide Factor})$$

* **Cyanide Consumption Rate**:
  $$\text{NaCN } (kg/t) = 1.90 \times \text{Composite Factor}$$
* **Initial Solution Makeup**: In addition to consumption, process water requires initial makeup to maintain target residual free cyanide (default $500\ ppm$ or $g/m^3$):
  $$\text{Initial Solution Makeup } (kg/h) = Q_{water} \times \frac{\text{Target Free } NaCN\ (ppm)}{1000}$$

#### 2.2.3 Oxidant Dosing (Hydrogen Peroxide $H_2O_2$ & Oxygen $O_2$)
Dissolved oxygen (DO2) is maintained between $10 - 20\ mg/L$ to accelerate leaching kinetics and passivate reactive pyrrhotite and marcasite:

$$\text{Peroxide Factor} = \left(\frac{\%S}{1.02}\right) \times \left(1.0 + 0.25 \times (\%As - 0.56)\right)$$
$$\text{H}_2\text{O}_2\text{ Dosage } (kg/t) = 29.68 \times \max(0.30,\; \text{Peroxide Factor})$$

* **Pure Oxygen Equivalent:** If the plant operates cryogenic or PSA pure oxygen sparging instead of hydrogen peroxide dosing:
  $$\text{Equivalent Pure } O_2\ (kg/h) = \text{H}_2\text{O}_2\ (kg/h) \times 0.4705$$

---

### 2.3 Countercurrent Carbon Adsorption Kinetics

In a CIP circuit, slurry flows forward from Tank 1 to Tank $N$, while activated carbon is pumped countercurrently from Tank $N$ upstream to Tank 1.

```
Feed Slurry ---> [ Tank 1 ] ---> [ Tank 2 ] ---> ... ---> [ Tank N ] ---> Tails
Loaded Carbon <-- [ (Highest) ] <-- [         ] <-- ... <-- [ (Fresh) ] <-- Stripped Carbon
```

The adsorption mass transfer rate in stage $i$ is modeled via the modified Nicol-Fleming equation incorporating fouling factor $\alpha_i$:

$$k_{effective, i} = k_{baseline} \times \alpha_i \quad (k_{baseline} = 0.18\ h^{-1})$$
$$R_{transfer, i} = k_{effective, i} \times (K \cdot X_i - Y_i) \times \left(\frac{C_i}{1000}\right)$$

Where:
* $X_i$: Aqueous gold concentration in solution ($ppm$ or $g/t$)
* $Y_i$: Gold concentration loaded on carbon ($g/t$)
* $C_i$: Carbon concentration in pulp ($g/L$)
* $\alpha_i$: Carbon activity fouling factor ($0.10 \le \alpha \le 1.00$, where 1.00 is virgin/regenerated carbon)
* $K$: Theoretical equilibrium affinity maximum ($1100$)
* $V$: Tank volume ($500\ m^3$)

#### 2.3.1 Optimization Objective (SciPy SLSQP)
The twin optimizes carbon advance rate $R_{adv}$ and per-tank carbon densities $C_i$ by minimizing total gold lost in the tail plus carbon inventory movement cost:

$$\min_{R_{adv}, \vec{C}} \quad X_{tail} + 0.005 \times R_{adv}$$

**Subject to operational constraints:**
* $0.5 \le R_{adv} \le 3.0 \text{ tons/h}$
* $10.0 \le C_i \le 25.0 \text{ g/L}$ for each tank stage $i \in [1, N]$

---

## 3. System Architecture & Components

| Directory / File | Description | Technologies |
| :--- | :--- | :--- |
| `api/main.py` | Primary FastAPI routing, Pydantic schemas, validation, SLSQP optimization runner | FastAPI, Pydantic v2, SciPy |
| `circuit_analytics/model.py` | Countercurrent steady-state numerical solver (`AdvancedFouledCIPModel`) | NumPy |
| `circuit_analytics/reagent_model.py` | Mass balancing and chemical reagent kinetic models (`SlurryReagentModel`) | NumPy, Pydantic |
| `database/db_connection.py` | Connection pooling engine, environment loading, context session provider | SQLAlchemy 2.0 |
| `database/models.py` | Relational ORM models (`CIPCircuit`, `CircuitTelemetry`, `TankStageMetric`, `ReagentMetric`) | SQLAlchemy ORM |
| `docker-compose.yml` | Multi-container composition (API and PostgreSQL with health checks) | Docker Compose |
| `Dockerfile` | Containerization recipe | Python 3.10-slim |

---

## 4. Setup, Deployment & Operational Configuration

### 4.1 Environment Configuration Matrix

Variables can be placed in a `.env` file at the repository root or set via container environment:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `POSTGRES_USER` | `user` | Database master username |
| `POSTGRES_PASSWORD` | `password` | Database master password |
| `POSTGRES_DB` | `metallurgy_db` | Primary metallurgical database name |
| `POSTGRES_PORT` | `5433` (or `5432`) | Exposed host port for PostgreSQL |
| `DATABASE_URL` | `postgresql://user:password@localhost:5433/metallurgy_db` | Connection URI used by SQLAlchemy |

> [!NOTE]
> If your workstation or server already runs an existing PostgreSQL instance on port `5432`, use port `5433` as defined in `.env.example` to prevent port collisions.

---

### 4.2 Deployment Options

#### Option A: Production Multi-Container Deployment (Docker Compose)
To start both PostgreSQL and the API service in the background:
```bash
docker compose up -d --build
```

Verify service health:
```bash
docker compose ps
curl http://localhost:8000/api/v2/health
```

To view live service logs:
```bash
docker compose logs -f api
```

To stop all services:
```bash
docker compose down
```

#### Option B: Dedicated Database with Local API (Development / Plant Laptop)
1. Start only the PostgreSQL database container:
   ```bash
   docker compose up -d postgres
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   # Linux / macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Uvicorn web server:
   ```bash
   uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

## 5. API Reference & Ingestion Guide

Interactive OpenAPI Swagger UI is available at `http://localhost:8000/docs` and Redoc at `http://localhost:8000/redoc`.

### 5.1 Service Health Verification
* **Endpoint:** `GET /api/v2/health`
* **Response (HTTP 200 OK):**
```json
{
  "status": "online",
  "service": "CIP/CIL Digital Twin Reagent & Optimization Engine"
}
```

---

### 5.2 Circuit Telemetry & Optimization Ingestion
* **Endpoint:** `POST /api/v2/telemetry`
* **Content-Type:** `application/json`

#### Request Payload Structure

```json
{
  "circuit_id": "CIP-LINE-1",
  "process_type": "CIP",
  "timestamp": "2026-10-03T18:00:00Z",
  "global_metrics": {
    "slurry_flow_rate_m3_h": 450.0,
    "slurry_density_pct": 48.5,
    "slurry_ph": 7.2,
    "carbon_advance_rate_tons_h": 1.45
  },
  "mineralogy_assay": {
    "head_grade_au_gt": 3.41,
    "sulfur_pct": 1.15,
    "copper_pct": 0.14,
    "arsenic_pct": 0.52,
    "target_ph": 10.80,
    "target_free_cyanide_ppm": 500.0
  },
  "tank_stages": [
    {
      "tank_index": 1,
      "solution_au_ppm": 3.41,
      "carbon_load_au_gt": 4200.0,
      "carbon_density_gl": 18.5,
      "fouling_factor_alpha": 0.82
    },
    {
      "tank_index": 2,
      "solution_au_ppm": 1.85,
      "carbon_load_au_gt": 2650.0,
      "carbon_density_gl": 17.0,
      "fouling_factor_alpha": 0.85
    },
    {
      "tank_index": 3,
      "solution_au_ppm": 0.92,
      "carbon_load_au_gt": 1450.0,
      "carbon_density_gl": 16.5,
      "fouling_factor_alpha": 0.88
    },
    {
      "tank_index": 4,
      "solution_au_ppm": 0.41,
      "carbon_load_au_gt": 780.0,
      "carbon_density_gl": 16.0,
      "fouling_factor_alpha": 0.90
    },
    {
      "tank_index": 5,
      "solution_au_ppm": 0.15,
      "carbon_load_au_gt": 340.0,
      "carbon_density_gl": 15.5,
      "fouling_factor_alpha": 0.95
    },
    {
      "tank_index": 6,
      "solution_au_ppm": 0.04,
      "carbon_load_au_gt": 110.0,
      "carbon_density_gl": 15.0,
      "fouling_factor_alpha": 0.98
    }
  ]
}
```

#### Field Specifications & Constraints

| Field | Type | Mandatory? | Range / Units | Description |
| :--- | :--- | :--- | :--- | :--- |
| `circuit_id` | String | Yes | Max 50 chars | Unique plant circuit identifier (e.g. `CIP-LINE-1`) |
| `process_type` | String | No | `"CIP"` or `"CIL"` | Circuit configuration |
| `timestamp` | String | No | ISO 8601 | Sampling timestamp (defaults to UTC now if omitted) |
| **`global_metrics`** | Object | Yes | — | Real-time plant instrumentation data |
| `.slurry_flow_rate_m3_h` | Float | Yes | $> 0\ m^3/h$ | Volumetric slurry feed rate into Tank 1 |
| `.slurry_density_pct` | Float | Yes | $1.0 - 70.0\ \%$ | Solids percentage (% w/w) from nuclear density gauge |
| `.slurry_ph` | Float | Yes | $0.0 - 14.0$ | Inlet raw pulp pH prior to lime dosing |
| `.carbon_advance_rate_tons_h` | Float | Yes | $0.0 - 10.0\ t/h$ | Measured average carbon advance rate |
| **`mineralogy_assay`** | Object | No | — | Laboratory XRF / fire assay values |
| `.head_grade_au_gt` | Float | No | $g/t\ Au$ | Ore head grade (defaults to $3.41$) |
| `.sulfur_pct` | Float | No | $\%$ | Total sulfur (defaults to $1.02$) |
| `.copper_pct` | Float | No | $\%$ | Total copper (major cyanicide, defaults to $0.12$) |
| `.arsenic_pct` | Float | No | $\%$ | Total arsenic (arsenopyrite, defaults to $0.56$) |
| `.target_ph` | Float | No | $10.0 - 12.0$ | Target alkalinity (defaults to $10.80$) |
| `.target_free_cyanide_ppm`| Float | No | $ppm$ ($g/m^3$) | Residual free NaCN target (defaults to $500.0$) |
| **`tank_stages`** | Array | Yes | 1 to 8 items | Per-tank physical sample measurements |
| `.tank_index` | Integer | Yes | $1 \le i \le 8$ | Tank stage index (1 = Head tank, $N$ = Tail tank) |
| `.solution_au_ppm` | Float | Yes | $ppm$ ($g/t$) | Dissolved gold in pulp liquor |
| `.carbon_load_au_gt` | Float | Yes | $g/t\ Au$ | Gold concentration on activated carbon |
| `.carbon_density_gl` | Float | Yes | $g/L$ | Carbon concentration in pulp |
| `.fouling_factor_alpha` | Float | No | $0.10 - 1.00$ | Relative kinetic activity ($\alpha=1.00$ for virgin carbon) |

---

#### Response Format (HTTP 201 Created)

```json
{
  "status": "success",
  "telemetry_id": 142,
  "circuit_id": "CIP-LINE-1",
  "process_type": "CIP",
  "processed_at": "2026-10-03T18:00:02.148102",
  "mass_balance": {
    "slurry_specific_gravity": 1.4582,
    "slurry_mass_rate_t_h": 656.19,
    "dry_ore_throughput_t_h": 318.25,
    "process_water_m3_h": 337.94,
    "liquid_to_solid_ratio": 1.06
  },
  "chemical_reagent_dosing_recommendations": {
    "lime": {
      "purpose": "Protective Alkalinity (Target pH 10.5 - 11.0)",
      "dosage_kg_per_dry_tonne": 0.845,
      "dosing_rate_kg_per_hour": 268.92,
      "daily_consumption_tons": 6.45
    },
    "sodium_cyanide_nacn": {
      "purpose": "Gold Complexation & Lixiviation (Au + 2CN-)",
      "consumption_kg_per_dry_tonne": 2.215,
      "consumption_rate_kg_per_hour": 704.92,
      "daily_consumption_tons": 16.92,
      "initial_fresh_solution_makeup_kg_h": 168.97
    },
    "oxidant_h2o2_or_oxygen": {
      "purpose": "Dissolved Oxygen Maintenance (DO2 10-20 mg/L) & Sulfide Passivation",
      "h2o2_dosage_kg_per_tonne": 32.84,
      "h2o2_dosing_rate_kg_per_hour": 10451.33,
      "h2o2_daily_consumption_tons": 250.83,
      "alternative_pure_o2_sparging_kg_per_hour": 4917.35
    }
  },
  "carbon_adsorption_recommendations": {
    "recommended_carbon_advance_rate_tons_h": 1.582,
    "recommended_tank_carbon_densities_gl": [18.2, 17.5, 16.8, 16.0, 15.4, 15.0],
    "predicted_tail_solution_au_ppm": 0.0185,
    "predicted_circuit_recovery_pct": 99.46
  },
  "projected_production_yield": {
    "estimated_gold_recovery_rate_g_h": 1079.41,
    "estimated_daily_gold_production_troy_oz": 832.89
  }
}
```

---

## 6. Standard Operating Procedures (SOPs) for Plant Operators

### SOP 6.1: Shift Handoff & Telemetry Verification
1. **Frequency:** Every 2 hours or on shift changeover.
2. **Procedure:**
   * Confirm that DCS density and magnetic flowmeter signals are active.
   * Send a sample payload using `curl` or automated DCS webhook.
   * Review the `mass_balance.dry_ore_throughput_t_h` value against the plant weightometer. If discrepancy exceeds $\pm 5\%$, inspect slurry density calibration ($SG_{ore} = 2.70$).
   * Record the predicted recovery percentage (`predicted_circuit_recovery_pct`).

### SOP 6.2: Reagent Dosing Adjustments
1. **Lime Dosing:**
   * Feed `chemical_reagent_dosing_recommendations.lime.dosing_rate_kg_per_hour` directly into the lime milk ring-main variable frequency drive (VFD).
   * Verify that slurry pH entering Tank 1 reaches between $10.50$ and $10.80$ within 30 minutes.
2. **Cyanide Dosing:**
   * Check `copper_pct` from laboratory XRF. If copper exceeds $0.20\%$, note the increased `consumption_rate_kg_per_hour`.
   * Set the cyanide metering pump to the recommended consumption rate plus initial makeup required for fresh water addition.
3. **Oxygenation:**
   * If using pure $O_2$ sparging, set down-hole diffuser gas flow to match `alternative_pure_o2_sparging_kg_per_hour`.
   * Verify using handheld or in-line DO2 probe that Tank 1 and Tank 2 hold $\ge 12\ mg/L\ O_2$.

### SOP 6.3: Carbon Advance Rate & Density Management
1. **Carbon Concentration ($g/L$):**
   * If a tank's carbon concentration drops below `recommended_tank_carbon_densities_gl`, hold carbon transfers out of that tank until concentration is restored.
2. **Advance Rate Execution:**
   * Adjust recessed impeller carbon transfer pumps or airlifts so that hourly dry carbon movement matches `recommended_carbon_advance_rate_tons_h`.
   * Never exceed $3.0\ t/h$ to prevent excess carbon breakage and attrition losses to tailings.

### SOP 6.4: Responding to Carbon Activity Fouling ($\alpha$)
* **Threshold Warning ($\alpha < 0.70$):** Carbon pores are accumulating inorganic scale (calcium carbonate $CaCO_3$) or organic humic acids/flotation reagents.
* **Action:**
  1. Trigger an immediate 3% hydrochloric acid ($HCl$) wash cycle in the elution/acid-wash column.
  2. Increase regeneration kiln temperature to $650^\circ C - 700^\circ C$ in steam-purged atmosphere to restore activity factor $\alpha$ to $\ge 0.95$.
  3. Increase carbon density setpoint in downstream tanks by $+2.0\ g/L$ temporarily until regenerated carbon is reintroduced.

---

## 7. Database Schema & Metallurgical History

The microservice persists every reading in a normalized PostgreSQL relational database:

```mermaid
erDiagram
    cip_circuits ||--o{ circuit_telemetry : "records"
    circuit_telemetry ||--|{ tank_stage_metrics : "samples"
    circuit_telemetry ||--|| reagent_metrics : "derives"

    cip_circuits {
        varchar(50) circuit_id PK
        varchar(100) plant_location
        integer num_tanks
        numeric tank_volume_m3
        timestamptz created_at
    }

    circuit_telemetry {
        integer telemetry_id PK
        varchar(50) circuit_id FK
        timestamptz timestamp
        numeric slurry_flow_rate_m3_h
        numeric slurry_density_pct
        numeric slurry_ph
        numeric carbon_advance_rate_tons_h
    }

    tank_stage_metrics {
        integer sample_id PK
        integer telemetry_id FK
        integer tank_index
        numeric solution_au_ppm
        numeric carbon_load_au_gt
        numeric carbon_density_gl
        numeric fouling_factor_alpha
    }

    reagent_metrics {
        integer reagent_id PK
        integer telemetry_id FK
        numeric dry_solids_rate_tons_h
        numeric water_rate_m3_h
        numeric liquid_to_solid_ratio
        numeric lime_addition_kg_t
        numeric lime_addition_kg_h
        numeric lime_daily_tons
        numeric nacn_consumption_kg_t
        numeric nacn_consumption_kg_h
        numeric nacn_daily_tons
        numeric h2o2_addition_kg_t
        numeric h2o2_addition_kg_h
        numeric h2o2_daily_tons
        numeric equivalent_pure_o2_kg_h
    }
```

### Useful Metallurgical SQL Queries

#### Daily Reagent Consumption Audit
```sql
SELECT 
    DATE(t.timestamp) AS production_date,
    ROUND(AVG(r.dry_solids_rate_tons_h) * 24, 2) AS total_dry_tonnes_milled,
    ROUND(AVG(r.lime_daily_tons), 2) AS total_lime_tons,
    ROUND(AVG(r.nacn_daily_tons), 2) AS total_nacn_tons,
    ROUND(AVG(r.equivalent_pure_o2_kg_h * 24 / 1000), 2) AS total_pure_o2_tons
FROM circuit_telemetry t
JOIN reagent_metrics r ON t.telemetry_id = r.telemetry_id
WHERE t.circuit_id = 'CIP-LINE-1'
GROUP BY DATE(t.timestamp)
ORDER BY production_date DESC;
```

#### Soluble Gold Tail Trend & Carbon Fouling Tracker
```sql
SELECT 
    t.timestamp,
    m.tank_index,
    m.solution_au_ppm,
    m.carbon_load_au_gt,
    m.carbon_density_gl,
    m.fouling_factor_alpha
FROM circuit_telemetry t
JOIN tank_stage_metrics m ON t.telemetry_id = m.telemetry_id
WHERE m.tank_index = 6
ORDER BY t.timestamp DESC
LIMIT 50;
```

---

## 8. Troubleshooting & Diagnostics Runbook

| Symptom / Error | Probable Root Cause | Resolution Action |
| :--- | :--- | :--- |
| **HTTP 422: `Optimizer failed to settle`** | Non-physical input values (e.g. negative flow, zero feed grade, or severe stage inversions). | Check input payload. Verify `solution_au_ppm` $> 0$ and stages are ordered correctly from Tank 1 to $N$. Verify carbon densities are within $[5.0, 35.0]\ g/L$. |
| **HTTP 500: Database connection error** | PostgreSQL container offline or connection pool saturated. | Run `docker compose ps` to verify `cip_postgres` health. Verify `.env` port matches host mapping (`5433` vs `5432`). |
| **Recovery $< 85\%$ predicted** | Severe carbon fouling ($\alpha < 0.50$) or carbon advance rate bottleneck ($< 0.8\ t/h$). | Inspect fouling factors across tanks. Trigger acid wash on carbon batch. Increase fresh stripped carbon flow into Tank $N$. |
| **High Soluble Tail Loss ($X_{tail} > 0.05\ ppm$)** | Insufficient carbon density in tail stages or high slurry throughput exceeding residence time. | Increase carbon density in Tank 5 and 6 toward $18\ g/L$. Check slurry volume and density. |
| **Cyanide Consumption Spikes ($> 3.0\ kg/t$)** | High copper ($Cu > 0.25\%$) or active pyrrhotite ($S > 2.0\%$). | Verify ore blend. Increase lime to maintain $pH \ge 11.0$ to passivate copper dissolution. Increase oxidant dosing to oxidize reactive sulfides before leach contact. |

---

## 9. Contacts & Support

* **Metallurgical Engineering:** Metallurgy & Process Control Team
* **Software & Digital Infrastructure:** Process Automation & SRE Team
* **Service Documentation Path:** `file:///e:/claude_repos/cip_digital_twin/OPERATING_DOCUMENTATION.md`
