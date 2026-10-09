import numpy as np

class AdvancedFouledCIPModel:
    def __init__(self, num_tanks=6, volume=500.0):
        self.N = num_tanks
        self.V = volume
        self.k_baseline = 0.18  # Kinetic transfer coefficient
        self.K = 1100.0         # Theoretical equilibrium affinity maximum
        
    def simulate_steady_state(self, slurry_flow, X_feed, Y_stripped, 
                              carbon_advance_rate, carbon_densities, fouling_factors):
        X = np.linspace(max(0.001, X_feed), 0.02, self.N)
        Y = np.linspace(3500.0, max(0.0, Y_stripped), self.N)
        
        for _ in range(300):
            for i in range(self.N):
                X_in = X_feed if i == 0 else X[i-1]
                Y_in = Y_stripped if i == self.N - 1 else Y[i+1]
                
                k_effective = self.k_baseline * fouling_factors[i]
                A = k_effective * (carbon_densities[i] / 1000.0) * self.V
                
                # Mass balance for solution gold X[i]
                X[i] = max(1e-6, (slurry_flow * X_in + A * Y[i]) / (slurry_flow + A * self.K + 1e-9))
                
                # Mass balance for carbon gold Y[i]
                Y_calc = Y_in + (slurry_flow * (X_in - X[i])) / (carbon_advance_rate + 1e-6)
                Y[i] = max(Y_stripped, min(self.K * X[i], Y_calc))
                
        return X, Y

