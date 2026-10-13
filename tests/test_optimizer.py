import numpy as np
import pytest
from circuit_analytics.model import AdvancedFouledCIPModel

def test_cip_model_steady_state():
    model = AdvancedFouledCIPModel(num_tanks=6, volume=500.0)
    X, Y = model.simulate_steady_state(
        slurry_flow=500.0,
        X_feed=3.41,
        Y_stripped=50.0,
        carbon_advance_rate=1.2,
        carbon_densities=[15.0] * 6,
        fouling_factors=[1.0] * 6
    )
    assert len(X) == 6
    assert len(Y) == 6
    # X should strictly decrease along the countercurrent tanks
    for i in range(len(X) - 1):
        assert X[i] > X[i + 1]
    # Gold solution tail should be positive and physical
    assert 0.0 < X[-1] < 3.41

def test_circuit_optimization_settles():
    from scipy.optimize import minimize
    model = AdvancedFouledCIPModel(num_tanks=6, volume=500.0)
    
    slurry_flow = 500.0
    X_feed = 3.41
    Y_STRIPPED_BASELINE = 50.0
    fouling_profile = np.array([1.0] * 6)

    def objective(variables):
        carbon_advance_rate = variables[0]
        carbon_densities = variables[1:]
        X_profile, _ = model.simulate_steady_state(
            slurry_flow, X_feed, Y_STRIPPED_BASELINE, carbon_advance_rate, carbon_densities, fouling_profile
        )
        return X_profile[-1] + (0.005 * carbon_advance_rate)

    bounds = [(0.5, 3.0)] + [(10.0, 25.0) for _ in range(len(fouling_profile))]
    initial_guess = [1.2] + [15.0 for _ in range(len(fouling_profile))]

    res = minimize(objective, initial_guess, method='SLSQP', bounds=bounds)
    if not res.success:
        res = minimize(objective, initial_guess, method='L-BFGS-B', bounds=bounds)
    
    assert bool(res.success)
    assert res.x[0] >= 0.5
