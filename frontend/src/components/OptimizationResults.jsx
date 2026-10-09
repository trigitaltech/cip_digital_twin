import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, shadows } from '../styles/theme';

export default function OptimizationResults({ result, currentStages }) {
  if (!result) return null;

  const {
    telemetry_id,
    circuit_id,
    process_type,
    processed_at,
    mass_balance = {},
    chemical_reagent_dosing_recommendations = {},
    carbon_adsorption_recommendations = {},
    projected_production_yield = {},
  } = result;

  const lime = chemical_reagent_dosing_recommendations.lime || {};
  const nacn = chemical_reagent_dosing_recommendations.sodium_cyanide_nacn || {};
  const oxidant = chemical_reagent_dosing_recommendations.oxidant_h2o2_or_oxygen || {};

  const recDensities = carbon_adsorption_recommendations.recommended_tank_carbon_densities_gl || [];
  const recAdvance = carbon_adsorption_recommendations.recommended_carbon_advance_rate_tons_h;
  const tailGrade = carbon_adsorption_recommendations.predicted_tail_solution_au_ppm;
  const recoveryPct = carbon_adsorption_recommendations.predicted_circuit_recovery_pct;

  const goldPerHour = projected_production_yield.estimated_gold_recovery_rate_g_h || 0;
  const goldOzDay = projected_production_yield.estimated_daily_gold_production_troy_oz || 0;
  const goldOzYear = Math.round(goldOzDay * 365);

  return (
    <View style={styles.container}>
      {/* Success Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <View style={styles.checkIcon}>
            <Text style={styles.checkIconText}>✓</Text>
          </View>
          <View>
            <View style={styles.badgeRow}>
              <Text style={styles.bannerTitle}>DIGITAL TWIN OPTIMIZATION COMPLETE</Text>
              <View style={styles.telemetryBadge}>
                <Text style={styles.telemetryBadgeText}>RECORD #{telemetry_id}</Text>
              </View>
            </View>
            <Text style={styles.bannerSubtitle}>
              Circuit {circuit_id} ({process_type}) • Processed at {new Date(processed_at).toLocaleTimeString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Top 3 Metric Callout Cards */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, styles.kpiGold]}>
          <Text style={styles.kpiLabel}>PREDICTED CIRCUIT RECOVERY</Text>
          <Text style={styles.kpiValueGold}>{recoveryPct !== undefined ? `${recoveryPct.toFixed(2)}%` : '—'}</Text>
          <Text style={styles.kpiSub}>Tail Grade: {tailGrade !== undefined ? `${tailGrade.toFixed(4)} ppm Au` : '—'}</Text>
        </View>

        <View style={[styles.kpiCard, styles.kpiCyan]}>
          <Text style={styles.kpiLabel}>REC. CARBON ADVANCE RATE</Text>
          <Text style={styles.kpiValueCyan}>{recAdvance !== undefined ? `${recAdvance.toFixed(3)} t/h` : '—'}</Text>
          <Text style={styles.kpiSub}>Countercurrent Adsorption Optimum</Text>
        </View>

        <View style={[styles.kpiCard, styles.kpiEmerald]}>
          <Text style={styles.kpiLabel}>PROJECTED GOLD PRODUCTION</Text>
          <Text style={styles.kpiValueEmerald}>{goldOzDay ? `${goldOzDay.toFixed(1)} oz/day` : '—'}</Text>
          <Text style={styles.kpiSub}>{goldPerHour} g/h • ~{goldOzYear.toLocaleString()} oz/yr</Text>
        </View>
      </View>

      {/* Section 1: Tank Carbon Densities Optimization */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>STAGE-BY-STAGE CARBON INVENTORY RECOMMENDATION</Text>
          <Text style={styles.sectionNote}>Target pulp carbon densities (g/L) for optimal adsorption kinetics</Text>
        </View>

        <View style={styles.densityGrid}>
          {recDensities.map((recVal, idx) => {
            const currentStage = currentStages[idx];
            const currentVal = currentStage ? Number(currentStage.carbon_density_gl) : null;
            const diff = currentVal !== null ? recVal - currentVal : 0;
            const isHigher = diff > 0.05;
            const isLower = diff < -0.05;

            return (
              <View key={idx} style={styles.densityItemCard}>
                <View style={styles.densityItemHeader}>
                  <Text style={styles.densityTankName}>TANK {idx + 1}</Text>
                  {isHigher && <Text style={styles.diffUp}>+{diff.toFixed(1)} g/L</Text>}
                  {isLower && <Text style={styles.diffDown}>{diff.toFixed(1)} g/L</Text>}
                  {!isHigher && !isLower && <Text style={styles.diffOk}>ON TARGET</Text>}
                </View>

                <View style={styles.densityCompareRow}>
                  <View>
                    <Text style={styles.densitySubLabel}>CURRENT</Text>
                    <Text style={styles.densityCurrentVal}>{currentVal ? currentVal.toFixed(1) : '—'}</Text>
                  </View>
                  <Text style={styles.densityArrow}>➔</Text>
                  <View>
                    <Text style={styles.densitySubLabel}>OPTIMIZED</Text>
                    <Text style={styles.densityTargetVal}>{recVal.toFixed(1)}</Text>
                  </View>
                </View>
                <Text style={styles.densityUnit}>g/L Carbon in Pulp</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Section 2: Chemical Reagent Dosing Guidance */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CHEMICAL REAGENT DOSING DIRECTIVES</Text>
          <Text style={styles.sectionNote}>Stoichiometric & kinetic reagent addition rates derived from mineralogy</Text>
        </View>

        <View style={styles.reagentGrid}>
          {/* Lime Card */}
          <View style={[styles.reagentCard, { borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
            <View style={styles.reagentHeader}>
              <View style={[styles.reagentBadge, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <Text style={[styles.reagentBadgeText, { color: colors.goldBright }]}>Ca(OH)₂</Text>
              </View>
              <View>
                <Text style={styles.reagentName}>HYDRATED LIME</Text>
                <Text style={styles.reagentFormula}>Protective Alkalinity (pH 10.5 - 11.0)</Text>
              </View>
            </View>

            <View style={styles.reagentMetrics}>
              <View style={styles.reagentMetricRow}>
                <Text style={styles.reagentMetricLabel}>Dosage Rate:</Text>
                <Text style={styles.reagentMetricVal}>{lime.dosage_kg_per_dry_tonne ?? '—'} kg/t dry ore</Text>
              </View>
              <View style={styles.reagentMetricRow}>
                <Text style={styles.reagentMetricLabel}>Feed Rate:</Text>
                <Text style={styles.reagentMetricVal}>{lime.dosing_rate_kg_per_hour ?? '—'} kg/h</Text>
              </View>
              <View style={styles.reagentMetricRow}>
                <Text style={styles.reagentMetricLabel}>Daily Usage:</Text>
                <Text style={[styles.reagentMetricVal, { color: colors.goldBright, fontWeight: '800' }]}>
                  {lime.daily_consumption_tons ?? '—'} tons/day
                </Text>
              </View>
            </View>
          </View>

          {/* Cyanide Card */}
          <View style={[styles.reagentCard, { borderColor: 'rgba(6, 182, 212, 0.4)' }]}>
            <View style={styles.reagentHeader}>
              <View style={[styles.reagentBadge, { backgroundColor: 'rgba(6, 182, 212, 0.2)' }]}>
                <Text style={[styles.reagentBadgeText, { color: colors.cyanBright }]}>NaCN</Text>
              </View>
              <View>
                <Text style={styles.reagentName}>SODIUM CYANIDE</Text>
                <Text style={styles.reagentFormula}>Gold Complexation & Lixiviation</Text>
              </View>
            </View>

            <View style={styles.reagentMetrics}>
              <View style={styles.reagentMetricRow}>
                <Text style={styles.reagentMetricLabel}>Consumption Rate:</Text>
                <Text style={styles.reagentMetricVal}>{nacn.consumption_kg_per_dry_tonne ?? '—'} kg/t</Text>
              </View>
              <View style={styles.reagentMetricRow}>
                <Text style={styles.reagentMetricLabel}>Dosing Addition:</Text>
                <Text style={styles.reagentMetricVal}>{nacn.consumption_rate_kg_per_hour ?? '—'} kg/h</Text>
              </View>
              <View style={styles.reagentMetricRow}>
                <Text style={styles.reagentMetricLabel}>Daily Consumption:</Text>
                <Text style={[styles.reagentMetricVal, { color: colors.cyanBright, fontWeight: '800' }]}>
                  {nacn.daily_consumption_tons ?? '—'} tons/day
                </Text>
              </View>
              <View style={styles.reagentMetricRow}>
                <Text style={styles.reagentMetricLabel}>Fresh Makeup Rate:</Text>
                <Text style={styles.reagentMetricVal}>{nacn.initial_fresh_solution_makeup_kg_h ?? '—'} kg/h</Text>
              </View>
            </View>
          </View>

          {/* Oxidant Card */}
          <View style={[styles.reagentCard, { borderColor: 'rgba(139, 92, 246, 0.4)' }]}>
            <View style={styles.reagentHeader}>
              <View style={[styles.reagentBadge, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <Text style={[styles.reagentBadgeText, { color: colors.purpleBright }]}>H₂O₂ / O₂</Text>
              </View>
              <View>
                <Text style={styles.reagentName}>OXIDANT / OXYGEN</Text>
                <Text style={styles.reagentFormula}>DO₂ Maintenance (10-20 mg/L) & Sulfide Passivation</Text>
              </View>
            </View>

            <View style={styles.reagentMetrics}>
              <View style={styles.reagentMetricRow}>
                <Text style={styles.reagentMetricLabel}>H₂O₂ Dosage:</Text>
                <Text style={styles.reagentMetricVal}>{oxidant.h2o2_dosage_kg_per_tonne ?? '—'} kg/t</Text>
              </View>
              <View style={styles.reagentMetricRow}>
                <Text style={styles.reagentMetricLabel}>H₂O₂ Dosing Rate:</Text>
                <Text style={styles.reagentMetricVal}>{oxidant.h2o2_dosing_rate_kg_per_hour ?? '—'} kg/h</Text>
              </View>
              <View style={styles.reagentMetricRow}>
                <Text style={styles.reagentMetricLabel}>Daily H₂O₂ Usage:</Text>
                <Text style={[styles.reagentMetricVal, { color: colors.purpleBright, fontWeight: '800' }]}>
                  {oxidant.h2o2_daily_consumption_tons ?? '—'} tons/day
                </Text>
              </View>
              <View style={styles.reagentMetricRow}>
                <Text style={styles.reagentMetricLabel}>Pure O₂ Sparging Equiv:</Text>
                <Text style={styles.reagentMetricVal}>{oxidant.alternative_pure_o2_sparging_kg_per_hour ?? '—'} kg/h</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Section 3: Mass Balance & Pulp Rheology */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PULP MASS BALANCE & HYDRAULIC AUDIT</Text>
          <Text style={styles.sectionNote}>Steady-state slurry rheology computed from volumetric flow & density gauge</Text>
        </View>

        <View style={styles.massBalanceGrid}>
          <View style={styles.massCard}>
            <Text style={styles.massLabel}>DRY ORE THROUGHPUT</Text>
            <Text style={styles.massValue}>{mass_balance.dry_ore_throughput_t_h ?? '—'}</Text>
            <Text style={styles.massUnit}>dry tons/h</Text>
          </View>

          <View style={styles.massCard}>
            <Text style={styles.massLabel}>SLURRY MASS RATE</Text>
            <Text style={styles.massValue}>{mass_balance.slurry_mass_rate_t_h ?? '—'}</Text>
            <Text style={styles.massUnit}>tons/h (wet)</Text>
          </View>

          <View style={styles.massCard}>
            <Text style={styles.massLabel}>PROCESS WATER RATE</Text>
            <Text style={styles.massValue}>{mass_balance.process_water_m3_h ?? '—'}</Text>
            <Text style={styles.massUnit}>m³/h</Text>
          </View>

          <View style={styles.massCard}>
            <Text style={styles.massLabel}>SLURRY SPECIFIC GRAVITY</Text>
            <Text style={styles.massValue}>{mass_balance.slurry_specific_gravity ?? '—'}</Text>
            <Text style={styles.massUnit}>SG (g/cm³)</Text>
          </View>

          <View style={styles.massCard}>
            <Text style={styles.massLabel}>LIQUID TO SOLID RATIO</Text>
            <Text style={styles.massValue}>{mass_balance.liquid_to_solid_ratio ?? '—'}</Text>
            <Text style={styles.massUnit}>L:S ratio</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginTop: 16,
  },
  banner: {
    backgroundColor: '#0A1827',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.emeraldPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: typography.fontFamilyHeading,
  },
  telemetryBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  telemetryBadgeText: {
    color: colors.cyanBright,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  bannerSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    fontFamily: typography.fontFamilyMono,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    flexGrow: 1,
    flexBasis: 220,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    alignItems: 'flex-start',
    ...shadows.card,
  },
  kpiGold: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  kpiCyan: {
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  kpiEmerald: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  kpiLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: typography.fontFamilyMono,
    marginBottom: 6,
  },
  kpiValueGold: {
    color: colors.goldBright,
    fontSize: 28,
    fontWeight: '800',
    fontFamily: typography.fontFamilyHeading,
  },
  kpiValueCyan: {
    color: colors.cyanBright,
    fontSize: 28,
    fontWeight: '800',
    fontFamily: typography.fontFamilyHeading,
  },
  kpiValueEmerald: {
    color: colors.emeraldBright,
    fontSize: 28,
    fontWeight: '800',
    fontFamily: typography.fontFamilyHeading,
  },
  kpiSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    fontFamily: typography.fontFamilyMono,
  },
  sectionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 16,
    ...shadows.card,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: typography.fontFamilyHeading,
  },
  sectionNote: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: typography.fontFamilyBody,
  },
  densityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  densityItemCard: {
    flexGrow: 1,
    flexBasis: 140,
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    padding: 10,
  },
  densityItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  densityTankName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: typography.fontFamilyMono,
  },
  diffUp: {
    color: colors.emeraldBright,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  diffDown: {
    color: colors.roseBright,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  diffOk: {
    color: colors.cyanBright,
    fontSize: 9,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  densityCompareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  densitySubLabel: {
    fontSize: 8,
    color: colors.textMuted,
    fontFamily: typography.fontFamilyMono,
  },
  densityCurrentVal: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  densityArrow: {
    color: colors.cyanBright,
    fontWeight: '800',
    fontSize: 12,
  },
  densityTargetVal: {
    color: colors.emeraldBright,
    fontSize: 15,
    fontWeight: '800',
    fontFamily: typography.fontFamilyMono,
  },
  densityUnit: {
    fontSize: 8.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  reagentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reagentCard: {
    flexGrow: 1,
    flexBasis: 260,
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  reagentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  reagentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reagentBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: typography.fontFamilyMono,
  },
  reagentName: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: typography.fontFamilyHeading,
  },
  reagentFormula: {
    color: colors.textMuted,
    fontSize: 9.5,
    fontFamily: typography.fontFamilyBody,
  },
  reagentMetrics: {
    gap: 6,
  },
  reagentMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reagentMetricLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: typography.fontFamilyBody,
  },
  reagentMetricVal: {
    color: colors.textPrimary,
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  massBalanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  massCard: {
    flexGrow: 1,
    flexBasis: 140,
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    padding: 10,
    alignItems: 'flex-start',
  },
  massLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
    marginBottom: 4,
  },
  massValue: {
    color: colors.blueBright,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: typography.fontFamilyMono,
  },
  massUnit: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
  },
});
