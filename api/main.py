import numpy as np
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from scipy.optimize import minimize

from database.db_connection import get_db, engine
from database.models import Base, CIPCircuit, CircuitTelemetry, TankStageMetric, ReagentMetric
from circuit_analytics.model import AdvancedFouledCIPModel
from circuit_analytics.reagent_model import SlurryReagentModel

# Ensure database schema is migrated / up to date
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Carbon-In-Pulp (CIP) & Carbon-In-Leach (CIL) Digital Twin Service",
    description="Metallurgical digital twin modeling slurry throughput, chemical reagent dosing (Lime, NaCN, Oxidants), and countercurrent carbon adsorption kinetics.",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

reagent_model = SlurryReagentModel()

class TankStageInput(BaseModel):
    tank_index: int = Field(..., ge=1, le=8, description="Stage index (1 to N)")
    solution_au_ppm: float = Field(..., description="Gold in solution (g/t or ppm)")
    carbon_load_au_gt: float = Field(..., description="Gold loaded on carbon (g/t)")
    carbon_density_gl: float = Field(..., description="Concentration of carbon in pulp (g/L)")
    fouling_factor_alpha: float = Field(1.0, description="Activity fouling factor (0.1 to 1.0)")

class GlobalMetricsInput(BaseModel):
    slurry_flow_rate_m3_h: float = Field(..., description="Volumetric slurry feed rate (m3/h)")
    slurry_density_pct: float = Field(..., description="Slurry solids percentage (% w/w)")
    slurry_ph: float = Field(..., description="Inlet slurry pH before lime addition")
    carbon_advance_rate_tons_h: float = Field(..., description="Current carbon advance rate (tons/h)")

class MineralogyAssayInput(BaseModel):
    head_grade_au_gt: Optional[float] = Field(3.41, description="Assayed ore head grade (g/t Au) - default from Peacocke & Simpson report")
    sulfur_pct: Optional[float] = Field(1.02, description="Sulfur percentage (% S) from XRF")
    copper_pct: Optional[float] = Field(0.12, description="Copper percentage (% Cu) from XRF (major cyanicide)")
    arsenic_pct: Optional[float] = Field(0.56, description="Arsenic percentage (% As) from XRF")
    target_ph: Optional[float] = Field(10.80, description="Target leach alkalinity pH (standard: 10.5 - 11.0)")
    target_free_cyanide_ppm: Optional[float] = Field(500.0, description="Target residual free NaCN in solution (ppm)")

class TelemetryPayload(BaseModel):
    circuit_id: str = Field(..., description="Unique circuit identifier (e.g. 'CIP-LINE-1')")
    process_type: Optional[str] = Field("CIP", description="Process configuration: 'CIP' or 'CIL'")
    timestamp: Optional[str] = None
    global_metrics: GlobalMetricsInput
    mineralogy_assay: Optional[MineralogyAssayInput] = Field(default_factory=MineralogyAssayInput)
    tank_stages: List[TankStageInput]

def run_circuit_optimization(slurry_flow: float, X_feed: float, fouling_profile: np.ndarray) -> dict:
    model = AdvancedFouledCIPModel(num_tanks=len(fouling_profile))
    Y_STRIPPED_BASELINE = 50.0
    
    def objective(variables):
        carbon_advance_rate = max(0.5, min(3.0, float(variables[0])))
        carbon_densities = [max(10.0, min(25.0, float(c))) for c in variables[1:]]
        X_profile, _ = model.simulate_steady_state(
            slurry_flow, X_feed, Y_STRIPPED_BASELINE, carbon_advance_rate, carbon_densities, fouling_profile
        )
        return X_profile[-1] + (0.005 * carbon_advance_rate)

    bounds = [(0.5, 3.0)] + [(10.0, 25.0) for _ in range(len(fouling_profile))]
    initial_guess = [1.2] + [15.0 for _ in range(len(fouling_profile))]
    
    res = minimize(objective, initial_guess, method='SLSQP', bounds=bounds)
    if not res.success:
        res = minimize(objective, initial_guess, method='trust-constr', bounds=bounds)
    if not res.success:
        res = minimize(objective, initial_guess, method='Powell', bounds=bounds)
    if not res.success:
        res = minimize(objective, initial_guess, method='L-BFGS-B', bounds=bounds)
    if not res.success:
        raise RuntimeError(f"Optimizer failed to settle: {res.message}")
        
    final_rate = float(np.clip(res.x[0], 0.5, 3.0))
    final_densities = [float(np.clip(val, 10.0, 25.0)) for val in res.x[1:]]

    final_X_profile, final_Y_profile = model.simulate_steady_state(
        slurry_flow, X_feed, Y_STRIPPED_BASELINE, final_rate, final_densities, fouling_profile
    )
    tail_grade = float(final_X_profile[-1])
    recovery_pct = float(max(0.0, min(99.9, ((X_feed - tail_grade) / (X_feed + 1e-6)) * 100.0)))

    return {
        "recommended_carbon_advance_rate_tons_h": round(final_rate, 3),
        "recommended_tank_carbon_densities_gl": [round(val, 2) for val in final_densities],
        "predicted_tail_solution_au_ppm": round(tail_grade, 4),
        "predicted_circuit_recovery_pct": round(recovery_pct, 2)
    }

@app.post("/api/v2/telemetry", status_code=status.HTTP_201_CREATED)
async def accept_telemetry_and_optimize(payload: TelemetryPayload, db: Session = Depends(get_db)):
    circuit = db.query(CIPCircuit).filter(CIPCircuit.circuit_id == payload.circuit_id).first()
    if not circuit:
        circuit = CIPCircuit(
            circuit_id=payload.circuit_id,
            plant_location=f"{payload.process_type.upper()} Circuit",
            num_tanks=len(payload.tank_stages),
            tank_volume_m3=500.0
        )
        db.add(circuit)
        db.flush()

    parsed_time = datetime.fromisoformat(payload.timestamp.replace("Z", "+00:00")) if payload.timestamp else datetime.utcnow()
    
    telemetry_record = CircuitTelemetry(
        circuit_id=payload.circuit_id,
        timestamp=parsed_time,
        slurry_flow_rate_m3_h=payload.global_metrics.slurry_flow_rate_m3_h,
        slurry_density_pct=payload.global_metrics.slurry_density_pct,
        slurry_ph=payload.global_metrics.slurry_ph,
        carbon_advance_rate_tons_h=payload.global_metrics.carbon_advance_rate_tons_h
    )
    
    sorted_stages = sorted(payload.tank_stages, key=lambda s: s.tank_index)
    fouling_list = []
    
    for stage in sorted_stages:
        fouling_list.append(stage.fouling_factor_alpha)
        stage_orm = TankStageMetric(
            tank_index=stage.tank_index,
            solution_au_ppm=stage.solution_au_ppm,
            carbon_load_au_gt=stage.carbon_load_au_gt,
            carbon_density_gl=stage.carbon_density_gl,
            fouling_factor_alpha=stage.fouling_factor_alpha
        )
        telemetry_record.tank_stages.append(stage_orm)

    # 1. Throughput & Mass Balance
    throughput = reagent_model.calculate_throughput(
        slurry_flow_m3_h=payload.global_metrics.slurry_flow_rate_m3_h,
        slurry_density_pct=payload.global_metrics.slurry_density_pct
    )

    # 2. Chemical Reagents Derivation
    assay = payload.mineralogy_assay or MineralogyAssayInput()
    head_grade = assay.head_grade_au_gt if assay.head_grade_au_gt is not None else sorted_stages[0].solution_au_ppm

    reagent_output = reagent_model.compute_reagents(
        dry_solids_rate_t_h=throughput["dry_solids_rate_t_h"],
        water_rate_m3_h=throughput["water_rate_m3_h"],
        slurry_ph=payload.global_metrics.slurry_ph,
        head_grade_au_gt=head_grade,
        sulfur_pct=assay.sulfur_pct if assay.sulfur_pct is not None else 1.02,
        copper_pct=assay.copper_pct if assay.copper_pct is not None else 0.12,
        arsenic_pct=assay.arsenic_pct if assay.arsenic_pct is not None else 0.56,
        target_free_cyanide_ppm=assay.target_free_cyanide_ppm or 500.0
    )

    # 3. Persist Reagent Metrics
    reagent_record = ReagentMetric(
        dry_solids_rate_tons_h=throughput["dry_solids_rate_t_h"],
        water_rate_m3_h=throughput["water_rate_m3_h"],
        liquid_to_solid_ratio=throughput["liquid_to_solid_ratio"],
        lime_addition_kg_t=reagent_output["lime_addition_kg_t"],
        lime_addition_kg_h=reagent_output["lime_addition_kg_h"],
        lime_daily_tons=reagent_output["lime_daily_consumption_tons"],
        nacn_consumption_kg_t=reagent_output["nacn_consumption_kg_t"],
        nacn_consumption_kg_h=reagent_output["nacn_consumption_kg_h"],
        nacn_daily_tons=reagent_output["nacn_daily_consumption_tons"],
        h2o2_addition_kg_t=reagent_output["h2o2_addition_kg_t"],
        h2o2_addition_kg_h=reagent_output["h2o2_addition_kg_h"],
        h2o2_daily_tons=reagent_output["h2o2_daily_consumption_tons"],
        equivalent_pure_o2_kg_h=reagent_output["equivalent_pure_o2_kg_h"]
    )
    telemetry_record.reagents = reagent_record

    try:
        db.add(telemetry_record)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))

    # 4. Carbon Circuit Optimization
    try:
        head_grade_feed = sorted_stages[0].solution_au_ppm
        slurry_velocity = payload.global_metrics.slurry_flow_rate_m3_h
        fouling_array = np.array(fouling_list)
        
        optimized_targets = run_circuit_optimization(
            slurry_flow=slurry_velocity,
            X_feed=head_grade_feed,
            fouling_profile=fouling_array
        )
    except Exception as opt_err:
        raise HTTPException(status_code=422, detail=str(opt_err))

    # 5. Production Yield
    dry_t_h = throughput["dry_solids_rate_t_h"]
    rec_pct = optimized_targets["predicted_circuit_recovery_pct"]
    gold_produced_g_h = round(dry_t_h * head_grade * (rec_pct / 100.0), 2)
    gold_produced_oz_day = round((gold_produced_g_h * 24.0) / 31.1035, 2)

    return {
        "status": "success",
        "telemetry_id": telemetry_record.telemetry_id,
        "circuit_id": payload.circuit_id,
        "process_type": payload.process_type.upper(),
        "processed_at": datetime.utcnow().isoformat(),
        "mass_balance": {
            "slurry_specific_gravity": throughput["slurry_sg"],
            "slurry_mass_rate_t_h": throughput["slurry_mass_rate_t_h"],
            "dry_ore_throughput_t_h": throughput["dry_solids_rate_t_h"],
            "process_water_m3_h": throughput["water_rate_m3_h"],
            "liquid_to_solid_ratio": throughput["liquid_to_solid_ratio"]
        },
        "chemical_reagent_dosing_recommendations": {
            "lime": {
                "purpose": "Protective Alkalinity (Target pH 10.5 - 11.0)",
                "dosage_kg_per_dry_tonne": reagent_output["lime_addition_kg_t"],
                "dosing_rate_kg_per_hour": reagent_output["lime_addition_kg_h"],
                "daily_consumption_tons": reagent_output["lime_daily_consumption_tons"]
            },
            "sodium_cyanide_nacn": {
                "purpose": "Gold Complexation & Lixiviation (Au + 2CN-)",
                "consumption_kg_per_dry_tonne": reagent_output["nacn_consumption_kg_t"],
                "consumption_rate_kg_per_hour": reagent_output["nacn_consumption_kg_h"],
                "daily_consumption_tons": reagent_output["nacn_daily_consumption_tons"],
                "initial_fresh_solution_makeup_kg_h": reagent_output["initial_solution_nacn_makeup_kg_h"]
            },
            "oxidant_h2o2_or_oxygen": {
                "purpose": "Dissolved Oxygen Maintenance (DO2 10-20 mg/L) & Sulfide Passivation",
                "h2o2_dosage_kg_per_tonne": reagent_output["h2o2_addition_kg_t"],
                "h2o2_dosing_rate_kg_per_hour": reagent_output["h2o2_addition_kg_h"],
                "h2o2_daily_consumption_tons": reagent_output["h2o2_daily_consumption_tons"],
                "alternative_pure_o2_sparging_kg_per_hour": reagent_output["equivalent_pure_o2_kg_h"]
            }
        },
        "carbon_adsorption_recommendations": {
            "recommended_carbon_advance_rate_tons_h": optimized_targets["recommended_carbon_advance_rate_tons_h"],
            "recommended_tank_carbon_densities_gl": optimized_targets["recommended_tank_carbon_densities_gl"],
            "predicted_tail_solution_au_ppm": optimized_targets["predicted_tail_solution_au_ppm"],
            "predicted_circuit_recovery_pct": optimized_targets["predicted_circuit_recovery_pct"]
        },
        "projected_production_yield": {
            "estimated_gold_recovery_rate_g_h": gold_produced_g_h,
            "estimated_daily_gold_production_troy_oz": gold_produced_oz_day
        }
    }

@app.get("/api/v2/telemetry/history")
def get_telemetry_history(
    circuit_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(CircuitTelemetry)
    if circuit_id:
        query = query.filter(CircuitTelemetry.circuit_id == circuit_id)
    
    total = query.count()
    records = query.order_by(CircuitTelemetry.timestamp.desc(), CircuitTelemetry.telemetry_id.desc()).offset(offset).limit(limit).all()
    
    results = []
    for rec in records:
        stages_sorted = sorted(rec.tank_stages, key=lambda s: s.tank_index)
        head_au = float(stages_sorted[0].solution_au_ppm) if stages_sorted else 0.0
        tail_au = float(stages_sorted[-1].solution_au_ppm) if stages_sorted else 0.0
        approx_rec = round(max(0.0, min(99.9, ((head_au - tail_au) / (head_au + 1e-6)) * 100.0)), 2) if head_au > 0 else 0.0
        
        reagents_summary = None
        if rec.reagents:
            reagents_summary = {
                "dry_solids_rate_tons_h": float(rec.reagents.dry_solids_rate_tons_h or 0),
                "water_rate_m3_h": float(rec.reagents.water_rate_m3_h or 0),
                "liquid_to_solid_ratio": float(rec.reagents.liquid_to_solid_ratio or 0),
                "lime_addition_kg_t": float(rec.reagents.lime_addition_kg_t or 0),
                "lime_addition_kg_h": float(rec.reagents.lime_addition_kg_h or 0),
                "lime_daily_tons": float(rec.reagents.lime_daily_tons or 0),
                "nacn_consumption_kg_t": float(rec.reagents.nacn_consumption_kg_t or 0),
                "nacn_consumption_kg_h": float(rec.reagents.nacn_consumption_kg_h or 0),
                "nacn_daily_tons": float(rec.reagents.nacn_daily_tons or 0),
                "h2o2_addition_kg_t": float(rec.reagents.h2o2_addition_kg_t or 0),
                "h2o2_addition_kg_h": float(rec.reagents.h2o2_addition_kg_h or 0),
                "h2o2_daily_tons": float(rec.reagents.h2o2_daily_tons or 0),
                "equivalent_pure_o2_kg_h": float(rec.reagents.equivalent_pure_o2_kg_h or 0),
            }
            
        results.append({
            "telemetry_id": rec.telemetry_id,
            "circuit_id": rec.circuit_id,
            "timestamp": rec.timestamp.isoformat() if rec.timestamp else None,
            "slurry_flow_rate_m3_h": float(rec.slurry_flow_rate_m3_h),
            "slurry_density_pct": float(rec.slurry_density_pct),
            "slurry_ph": float(rec.slurry_ph),
            "carbon_advance_rate_tons_h": float(rec.carbon_advance_rate_tons_h),
            "head_grade_au_gt": head_au,
            "tail_grade_au_ppm": tail_au,
            "approx_recovery_pct": approx_rec,
            "stage_count": len(stages_sorted),
            "reagents": reagents_summary,
            "stages": [
                {
                    "tank_index": s.tank_index,
                    "solution_au_ppm": float(s.solution_au_ppm),
                    "carbon_load_au_gt": float(s.carbon_load_au_gt),
                    "carbon_density_gl": float(s.carbon_density_gl),
                    "fouling_factor_alpha": float(s.fouling_factor_alpha),
                } for s in stages_sorted
            ]
        })
        
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": results
    }

@app.get("/api/v2/telemetry/history/{telemetry_id}")
def get_telemetry_history_detail(telemetry_id: int, db: Session = Depends(get_db)):
    rec = db.query(CircuitTelemetry).filter(CircuitTelemetry.telemetry_id == telemetry_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"Telemetry record #{telemetry_id} not found")
        
    stages_sorted = sorted(rec.tank_stages, key=lambda s: s.tank_index)
    fouling_list = [float(s.fouling_factor_alpha) for s in stages_sorted]
    head_grade = float(stages_sorted[0].solution_au_ppm) if stages_sorted else 1.0
    slurry_flow = float(rec.slurry_flow_rate_m3_h)
    
    # Calculate mass balance
    throughput = reagent_model.calculate_throughput(
        slurry_flow_m3_h=slurry_flow,
        slurry_density_pct=float(rec.slurry_density_pct)
    )
    
    # Run optimization for complete dashboard restoration
    try:
        optimized_targets = run_circuit_optimization(
            slurry_flow=slurry_flow,
            X_feed=head_grade,
            fouling_profile=np.array(fouling_list)
        )
    except Exception:
        optimized_targets = {
            "recommended_carbon_advance_rate_tons_h": float(rec.carbon_advance_rate_tons_h),
            "recommended_tank_carbon_densities_gl": [float(s.carbon_density_gl) for s in stages_sorted],
            "predicted_tail_solution_au_ppm": float(stages_sorted[-1].solution_au_ppm) if stages_sorted else 0.05,
            "predicted_circuit_recovery_pct": 94.5
        }
        
    dry_t_h = throughput["dry_solids_rate_t_h"]
    rec_pct = optimized_targets["predicted_circuit_recovery_pct"]
    gold_produced_g_h = round(dry_t_h * head_grade * (rec_pct / 100.0), 2)
    gold_produced_oz_day = round((gold_produced_g_h * 24.0) / 31.1035, 2)
    
    reagents_detail = {}
    if rec.reagents:
        reagents_detail = {
            "lime": {
                "purpose": "Protective Alkalinity (Target pH 10.5 - 11.0)",
                "dosage_kg_per_dry_tonne": float(rec.reagents.lime_addition_kg_t or 0),
                "dosing_rate_kg_per_hour": float(rec.reagents.lime_addition_kg_h or 0),
                "daily_consumption_tons": float(rec.reagents.lime_daily_tons or 0)
            },
            "sodium_cyanide_nacn": {
                "purpose": "Gold Complexation & Lixiviation (Au + 2CN-)",
                "consumption_kg_per_dry_tonne": float(rec.reagents.nacn_consumption_kg_t or 0),
                "consumption_rate_kg_per_hour": float(rec.reagents.nacn_consumption_kg_h or 0),
                "daily_consumption_tons": float(rec.reagents.nacn_daily_tons or 0)
            },
            "oxidant_h2o2_or_oxygen": {
                "purpose": "Dissolved Oxygen Maintenance & Passivation",
                "h2o2_dosage_kg_per_tonne": float(rec.reagents.h2o2_addition_kg_t or 0),
                "h2o2_dosing_rate_kg_per_hour": float(rec.reagents.h2o2_addition_kg_h or 0),
                "h2o2_daily_consumption_tons": float(rec.reagents.h2o2_daily_tons or 0),
                "alternative_pure_o2_sparging_kg_per_hour": float(rec.reagents.equivalent_pure_o2_kg_h or 0)
            }
        }
        
    return {
        "status": "success",
        "telemetry_id": rec.telemetry_id,
        "circuit_id": rec.circuit_id,
        "process_type": "CIL" if "CIL" in rec.circuit_id.upper() else "CIP",
        "processed_at": rec.timestamp.isoformat() if rec.timestamp else datetime.utcnow().isoformat(),
        "mass_balance": {
            "slurry_specific_gravity": throughput["slurry_sg"],
            "slurry_mass_rate_t_h": throughput["slurry_mass_rate_t_h"],
            "dry_ore_throughput_t_h": throughput["dry_solids_rate_t_h"],
            "process_water_m3_h": throughput["water_rate_m3_h"],
            "liquid_to_solid_ratio": throughput["liquid_to_solid_ratio"]
        },
        "chemical_reagent_dosing_recommendations": reagents_detail,
        "carbon_adsorption_recommendations": optimized_targets,
        "projected_production_yield": {
            "estimated_gold_recovery_rate_g_h": gold_produced_g_h,
            "estimated_daily_gold_production_troy_oz": gold_produced_oz_day
        },
        "stages": [
            {
                "tank_index": s.tank_index,
                "solution_au_ppm": float(s.solution_au_ppm),
                "carbon_load_au_gt": float(s.carbon_load_au_gt),
                "carbon_density_gl": float(s.carbon_density_gl),
                "fouling_factor_alpha": float(s.fouling_factor_alpha),
            } for s in stages_sorted
        ],
        "global_metrics": {
            "slurry_flow_rate_m3_h": float(rec.slurry_flow_rate_m3_h),
            "slurry_density_pct": float(rec.slurry_density_pct),
            "slurry_ph": float(rec.slurry_ph),
            "carbon_advance_rate_tons_h": float(rec.carbon_advance_rate_tons_h)
        }
    }

@app.delete("/api/v2/telemetry/history/{telemetry_id}")
def delete_telemetry_history(telemetry_id: int, db: Session = Depends(get_db)):
    rec = db.query(CircuitTelemetry).filter(CircuitTelemetry.telemetry_id == telemetry_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"Telemetry record #{telemetry_id} not found")
    db.delete(rec)
    db.commit()
    return {"status": "deleted", "telemetry_id": telemetry_id}

@app.get("/api/v2/health")
def health_check():
    return {"status": "online", "service": "CIP/CIL Digital Twin Reagent & Optimization Engine"}
