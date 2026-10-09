export const PRESETS = [
  {
    id: 'peacocke_simpson',
    name: 'Peacocke & Simpson Baseline',
    description: 'Gold CIP standard 6-stage train with typical mineralogy and adsorption kinetics',
    circuit_id: 'CIP-LINE-1',
    process_type: 'CIP',
    global_metrics: {
      slurry_flow_rate_m3_h: 450.0,
      slurry_density_pct: 48.5,
      slurry_ph: 7.2,
      carbon_advance_rate_tons_h: 1.45,
    },
    mineralogy_assay: {
      head_grade_au_gt: 3.41,
      sulfur_pct: 1.15,
      copper_pct: 0.14,
      arsenic_pct: 0.52,
      target_ph: 10.80,
      target_free_cyanide_ppm: 500.0,
    },
    tank_stages: [
      { tank_index: 1, solution_au_ppm: 3.41, carbon_load_au_gt: 4200.0, carbon_density_gl: 18.5, fouling_factor_alpha: 0.82 },
      { tank_index: 2, solution_au_ppm: 1.85, carbon_load_au_gt: 2650.0, carbon_density_gl: 17.0, fouling_factor_alpha: 0.85 },
      { tank_index: 3, solution_au_ppm: 0.92, carbon_load_au_gt: 1450.0, carbon_density_gl: 16.5, fouling_factor_alpha: 0.88 },
      { tank_index: 4, solution_au_ppm: 0.41, carbon_load_au_gt: 780.0, carbon_density_gl: 16.0, fouling_factor_alpha: 0.90 },
      { tank_index: 5, solution_au_ppm: 0.15, carbon_load_au_gt: 340.0, carbon_density_gl: 15.5, fouling_factor_alpha: 0.95 },
      { tank_index: 6, solution_au_ppm: 0.04, carbon_load_au_gt: 110.0, carbon_density_gl: 15.0, fouling_factor_alpha: 0.98 },
    ],
  },
  {
    id: 'fouled_carbon',
    name: 'Severe Organic & Scale Fouling',
    description: 'Aged carbon circuit with heavy organic fouling (low alpha) requiring higher inventory',
    circuit_id: 'CIP-LINE-2',
    process_type: 'CIP',
    global_metrics: {
      slurry_flow_rate_m3_h: 420.0,
      slurry_density_pct: 47.0,
      slurry_ph: 6.8,
      carbon_advance_rate_tons_h: 1.10,
    },
    mineralogy_assay: {
      head_grade_au_gt: 3.85,
      sulfur_pct: 1.35,
      copper_pct: 0.22,
      arsenic_pct: 0.68,
      target_ph: 10.85,
      target_free_cyanide_ppm: 550.0,
    },
    tank_stages: [
      { tank_index: 1, solution_au_ppm: 3.85, carbon_load_au_gt: 3400.0, carbon_density_gl: 15.0, fouling_factor_alpha: 0.52 },
      { tank_index: 2, solution_au_ppm: 2.30, carbon_load_au_gt: 2200.0, carbon_density_gl: 15.0, fouling_factor_alpha: 0.55 },
      { tank_index: 3, solution_au_ppm: 1.45, carbon_load_au_gt: 1300.0, carbon_density_gl: 14.5, fouling_factor_alpha: 0.58 },
      { tank_index: 4, solution_au_ppm: 0.85, carbon_load_au_gt: 700.0, carbon_density_gl: 14.0, fouling_factor_alpha: 0.62 },
      { tank_index: 5, solution_au_ppm: 0.42, carbon_load_au_gt: 350.0, carbon_density_gl: 13.5, fouling_factor_alpha: 0.68 },
      { tank_index: 6, solution_au_ppm: 0.18, carbon_load_au_gt: 140.0, carbon_density_gl: 13.0, fouling_factor_alpha: 0.72 },
    ],
  },
  {
    id: 'copper_heavy',
    name: 'High Copper Refractory Ore (CIL)',
    description: 'High sulfide & cyanicide copper content consuming cyanide and oxygen',
    circuit_id: 'CIL-CIRCUIT-A',
    process_type: 'CIL',
    global_metrics: {
      slurry_flow_rate_m3_h: 480.0,
      slurry_density_pct: 50.0,
      slurry_ph: 7.5,
      carbon_advance_rate_tons_h: 1.80,
    },
    mineralogy_assay: {
      head_grade_au_gt: 4.65,
      sulfur_pct: 2.45,
      copper_pct: 0.38,
      arsenic_pct: 0.95,
      target_ph: 11.00,
      target_free_cyanide_ppm: 600.0,
    },
    tank_stages: [
      { tank_index: 1, solution_au_ppm: 4.65, carbon_load_au_gt: 4800.0, carbon_density_gl: 20.0, fouling_factor_alpha: 0.80 },
      { tank_index: 2, solution_au_ppm: 2.75, carbon_load_au_gt: 3100.0, carbon_density_gl: 19.0, fouling_factor_alpha: 0.82 },
      { tank_index: 3, solution_au_ppm: 1.35, carbon_load_au_gt: 1800.0, carbon_density_gl: 18.0, fouling_factor_alpha: 0.85 },
      { tank_index: 4, solution_au_ppm: 0.55, carbon_load_au_gt: 950.0, carbon_density_gl: 17.0, fouling_factor_alpha: 0.88 },
      { tank_index: 5, solution_au_ppm: 0.20, carbon_load_au_gt: 420.0, carbon_density_gl: 16.5, fouling_factor_alpha: 0.92 },
      { tank_index: 6, solution_au_ppm: 0.05, carbon_load_au_gt: 150.0, carbon_density_gl: 16.0, fouling_factor_alpha: 0.95 },
    ],
  },
];

export const API_BASE_URL = window.location.port === '5173' ? '' : 'http://127.0.0.1:8000';

export async function submitTelemetry(payload) {
  const endpoint = `${API_BASE_URL}/api/v2/telemetry`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch (e) {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return await response.json();
}

export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v2/health`, {
      method: 'GET',
    });
    if (response.ok) {
      return await response.json();
    }
    return { status: 'offline' };
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}
