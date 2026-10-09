import numpy as np
from pydantic import BaseModel, Field
from typing import Optional

class SlurryReagentModel:
    """
    Mathematical and empirical reagent calculation model for CIL/CIP gold circuits,
    calibrated against Peacocke & Simpson metallurgical testwork (Report PS/13264/26).
    """
    def __init__(
        self,
        specific_gravity_ore: float = 2.70,
        baseline_head_grade: float = 3.39,
        baseline_lime_kg_t: float = 1.50,
        baseline_nacn_kg_t: float = 1.90,
        baseline_h2o2_kg_t: float = 29.68,
        baseline_ph_in: float = 4.41,
        target_ph: float = 10.80
    ):
        self.sg_ore = specific_gravity_ore
        self.base_head = baseline_head_grade
        self.base_lime = baseline_lime_kg_t
        self.base_nacn = baseline_nacn_kg_t
        self.base_h2o2 = baseline_h2o2_kg_t
        self.base_ph_in = baseline_ph_in
        self.target_ph = target_ph

    def calculate_throughput(self, slurry_flow_m3_h: float, slurry_density_pct: float) -> dict:
        """
        Calculates slurry specific gravity, mass flow, dry ore tonnage rate, and water volume.
        """
        solids_frac = max(0.01, min(0.70, slurry_density_pct / 100.0))
        # Slurry specific gravity: 1 / [ (solids_frac / sg_ore) + (1 - solids_frac) ]
        slurry_sg = 1.0 / ((solids_frac / self.sg_ore) + (1.0 - solids_frac))
        slurry_mass_rate_t_h = slurry_flow_m3_h * slurry_sg
        dry_solids_rate_t_h = slurry_mass_rate_t_h * solids_frac
        water_rate_m3_h = slurry_mass_rate_t_h * (1.0 - solids_frac)
        liquid_to_solid_ratio = (1.0 - solids_frac) / solids_frac

        return {
            "slurry_sg": float(slurry_sg),
            "slurry_mass_rate_t_h": float(slurry_mass_rate_t_h),
            "dry_solids_rate_t_h": float(dry_solids_rate_t_h),
            "water_rate_m3_h": float(water_rate_m3_h),
            "liquid_to_solid_ratio": float(liquid_to_solid_ratio)
        }

    def compute_reagents(
        self,
        dry_solids_rate_t_h: float,
        water_rate_m3_h: float,
        slurry_ph: float,
        head_grade_au_gt: float,
        sulfur_pct: float = 1.02,
        copper_pct: float = 0.12,
        arsenic_pct: float = 0.56,
        target_free_cyanide_ppm: float = 500.0
    ) -> dict:
        """
        Derives lime, cyanide, and oxidant additions based on ore feed chemistry.
        """
        # 1. Lime addition (Protective Alkalinity)
        delta_ph = max(0.0, self.target_ph - slurry_ph)
        if delta_ph > 0:
            lime_kg_t = self.base_lime * (delta_ph / (self.target_ph - self.base_ph_in))
        else:
            lime_kg_t = 0.20  # Minimum maintenance trimming dosage
        lime_kg_h = dry_solids_rate_t_h * lime_kg_t

        # 2. Sodium Cyanide (NaCN) consumption
        # Accounts for Au dissolution and cyanicide base metal loads (Cu, As, Fe)
        gold_factor = 1.0 + 0.08 * (head_grade_au_gt - self.base_head)
        copper_factor = 1.0 + 0.80 * (copper_pct - 0.12)
        sulfide_factor = 1.0 + 0.15 * (sulfur_pct - 1.02)
        
        composite_factor = max(0.5, gold_factor * copper_factor * sulfide_factor)
        nacn_kg_t = self.base_nacn * composite_factor
        nacn_kg_h = dry_solids_rate_t_h * nacn_kg_t
        
        # Initial makeup cyanide needed to reach target ppm in solution
        initial_solution_nacn_kg_h = water_rate_m3_h * (target_free_cyanide_ppm / 1000.0)

        # 3. Oxidant Addition (Hydrogen Peroxide H2O2 or equivalent pure O2)
        # H2O2 dosage scales with sulfur and arsenic presence
        peroxide_factor = (sulfur_pct / 1.02) * (1.0 + 0.25 * (arsenic_pct - 0.56))
        h2o2_kg_t = self.base_h2o2 * max(0.3, peroxide_factor)
        h2o2_kg_h = dry_solids_rate_t_h * h2o2_kg_t
        
        # Equivalent pure gaseous oxygen demand (1 kg H2O2 ~ 0.47 kg O2)
        pure_o2_kg_h = h2o2_kg_h * 0.4705

        return {
            "lime_addition_kg_t": round(float(lime_kg_t), 3),
            "lime_addition_kg_h": round(float(lime_kg_h), 2),
            "lime_daily_consumption_tons": round(float(lime_kg_h * 24 / 1000.0), 2),
            
            "nacn_consumption_kg_t": round(float(nacn_kg_t), 3),
            "nacn_consumption_kg_h": round(float(nacn_kg_h), 2),
            "nacn_daily_consumption_tons": round(float(nacn_kg_h * 24 / 1000.0), 2),
            "initial_solution_nacn_makeup_kg_h": round(float(initial_solution_nacn_kg_h), 2),
            
            "h2o2_addition_kg_t": round(float(h2o2_kg_t), 3),
            "h2o2_addition_kg_h": round(float(h2o2_kg_h), 2),
            "h2o2_daily_consumption_tons": round(float(h2o2_kg_h * 24 / 1000.0), 2),
            "equivalent_pure_o2_kg_h": round(float(pure_o2_kg_h), 2)
        }
