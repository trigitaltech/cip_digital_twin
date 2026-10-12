import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, shadows } from '../styles/theme';
import TankStageVisualizer from './TankStageVisualizer';

export default function DashboardPage({
  result,
  currentStages,
  processType,
  selectedStageIndex,
  onSelectStage,
  onNavigateToIngest,
  onOpenRawJson,
  history,
  onSelectHistoryItem,
}) {
  // Empty state if no telemetry has been processed yet
  if (!result) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBadge}>
            <Text style={styles.emptyIconText}>📊</Text>
          </View>
          <Text style={styles.emptyTitle}>NO OPTIMIZATION RESULTS AVAILABLE</Text>
          <Text style={styles.emptySubtitle}>
            To generate metallurgical recovery predictions, carbon advance setpoints, and chemical reagent dosing directives, you must first ingest circuit telemetry.
          </Text>

          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={onNavigateToIngest}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyActionBtnText}>➔ GO TO TELEMETRY INGESTION PAGE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const {
    telemetry_id,
    circuit_id,
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
    <View style={styles.pageContainer}>
      {/* Top Action & Status Bar */}
      <View style={styles.dashHeaderBar}>
        <View style={styles.dashHeaderLeft}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>OPTIMIZATION ACTIVE</Text>
          </View>
          <Text style={styles.dashHeaderTitle}>
            CIRCUIT {circuit_id} • RECORD #{telemetry_id}
          </Text>
          <Text style={styles.dashHeaderTime}>
            Computed at {new Date(processed_at).toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.dashHeaderActions}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onNavigateToIngest}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>✏ Ingest New / Modify Inputs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.inspectBtn}
            onPress={onOpenRawJson}
            activeOpacity={0.8}
          >
            <Text style={styles.inspectBtnText}>{'< / >'} View JSON</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Top 4 KPI Executive Summary Tiles */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, styles.kpiGold]}>
          <Text style={styles.kpiLabel}>PREDICTED CIRCUIT RECOVERY</Text>
          <Text style={styles.kpiValueGold}>
            {recoveryPct !== undefined ? `${recoveryPct.toFixed(2)}%` : '—'}
          </Text>
          <View style={styles.kpiPill}>
            <Text style={styles.kpiPillText}>Tail: {tailGrade !== undefined ? `${tailGrade.toFixed(4)} ppm Au` : '—'}</Text>
          </View>
        </View>

        <View style={[styles.kpiCard, styles.kpiCyan]}>
          <Text style={styles.kpiLabel}>REC. CARBON ADVANCE RATE</Text>
          <Text style={styles.kpiValueCyan}>
            {recAdvance !== undefined ? `${recAdvance.toFixed(3)} t/h` : '—'}
          </Text>
          <View style={styles.kpiPill}>
            <Text style={styles.kpiPillText}>Countercurrent Equilibrium</Text>
          </View>
        </View>

        <View style={[styles.kpiCard, styles.kpiEmerald]}>
          <Text style={styles.kpiLabel}>PROJECTED GOLD PRODUCTION</Text>
          <Text style={styles.kpiValueEmerald}>
            {goldOzDay ? `${goldOzDay.toFixed(1)} oz/d` : '—'}
          </Text>
          <View style={styles.kpiPill}>
            <Text style={styles.kpiPillText}>{goldPerHour} g/h • ~{goldOzYear.toLocaleString()} oz/yr</Text>
          </View>
        </View>

        <View style={[styles.kpiCard, styles.kpiPurple]}>
          <Text style={styles.kpiLabel}>DAILY REAGENT CONSUMPTION</Text>
          <Text style={styles.kpiValuePurple}>
            {lime.daily_consumption_tons ? `${lime.daily_consumption_tons.toFixed(1)} t/d` : '—'}
          </Text>
          <View style={styles.kpiPill}>
            <Text style={styles.kpiPillText}>Lime • NaCN: {nacn.daily_consumption_tons?.toFixed(1) || '0'} t/d</Text>
          </View>
        </View>
      </View>

      {/* Visual Countercurrent Cascade with Model Target Overlays */}
      <TankStageVisualizer
        stages={currentStages}
        recommendedDensities={recDensities}
        selectedStageIndex={selectedStageIndex}
        onSelectStage={onSelectStage}
        processType={processType}
      />

      {/* Section 1: Tank Carbon Densities Optimization */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>STAGE-BY-STAGE CARBON INVENTORY RECOMMENDATION</Text>
            <Text style={styles.sectionNote}>Target pulp carbon concentrations (g/L) to maximize gold extraction kinetics</Text>
          </View>
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
          <View>
            <Text style={styles.sectionTitle}>CHEMICAL REAGENT DOSING DIRECTIVES</Text>
            <Text style={styles.sectionNote}>Stoichiometric consumption & dosing additions derived from feed mineralogy</Text>
          </View>
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
                <Text style={styles.reagentFormula}>Protective Alkalinity (Target pH 10.5 - 11.0)</Text>
              </View>
            </View>

            <View style={styles.reagentMetrics}>
              <View style={styles.reagentMetricRow}>
                <Text style={styles.reagentMetricLabel}>Dosage per Dry Tonne:</Text>
                <Text style={styles.reagentMetricVal}>{lime.dosage_kg_per_dry_tonne ?? '—'} kg/t</Text>
              </View>
              <View style={styles.reagentMetricRow}>
                <Text style={styles.reagentMetricLabel}>Feed Addition Rate:</Text>
                <Text style={styles.reagentMetricVal}>{lime.dosing_rate_kg_per_hour ?? '—'} kg/h</Text>
              </View>
              <View style={styles.reagentMetricRow}>
                <Text style={styles.reagentMetricLabel}>Daily Consumption:</Text>
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
                <Text style={styles.reagentFormula}>Gold Complexation (Au + 2CN⁻ ➔ Au(CN)₂⁻)</Text>
              </View>
            </View>

            <View style={styles.reagentMetrics}>
              <View style={styles.reagentMetricRow}>
                <Text style={styles.reagentMetricLabel}>Consumption per Tonne:</Text>
                <Text style={styles.reagentMetricVal}>{nacn.consumption_kg_per_dry_tonne ?? '—'} kg/t</Text>
              </View>
              <View style={styles.reagentMetricRow}>
                <Text style={styles.reagentMetricLabel}>Dosing Addition Rate:</Text>
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
                <Text style={styles.reagentFormula}>DO₂ (10-20 mg/L) & Sulfide Passivation</Text>
              </View>
            </View>

            <View style={styles.reagentMetrics}>
              <View style={styles.reagentMetricRow}>
                <Text style={styles.reagentMetricLabel}>H₂O₂ Dosage Rate:</Text>
                <Text style={styles.reagentMetricVal}>{oxidant.h2o2_dosage_kg_per_tonne ?? '—'} kg/t</Text>
              </View>
              <View style={styles.reagentMetricRow}>
                <Text style={styles.reagentMetricLabel}>H₂O₂ Feed Addition:</Text>
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
          <View>
            <Text style={styles.sectionTitle}>PULP MASS BALANCE & HYDRAULIC AUDIT</Text>
            <Text style={styles.sectionNote}>Steady-state slurry rheology derived from volumetric flow rate and density gauge</Text>
          </View>
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

      {/* Session Telemetry History Bar */}
      {history && history.length > 0 && (
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>SESSION TELEMETRY RUN AUDIT ({history.length} RUNS)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyRow}>
            {history.map((item, i) => (
              <TouchableOpacity
                key={item.id + '-' + i}
                style={[
                  styles.historyPill,
                  item.id === result.telemetry_id && styles.historyPillActive,
                ]}
                onPress={() => onSelectHistoryItem(item)}
              >
                <Text style={styles.historyTime}>{item.time}</Text>
                <Text style={styles.historyCircuit}>{item.circuit}</Text>
                <Text style={styles.historyRecovery}>{item.recovery?.toFixed(1)}% Rec</Text>
                <Text style={styles.historyGold}>{item.goldOz} oz/d</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    gap: 16,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    maxWidth: 580,
    width: '100%',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    ...shadows.card,
  },
  emptyIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0A1224',
    borderWidth: 1,
    borderColor: colors.cyanPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 28,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: typography.fontFamilyHeading,
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: typography.fontFamilyBody,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyActionBtn: {
    backgroundColor: colors.cyanDark,
    borderWidth: 1,
    borderColor: colors.cyanBright,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    ...shadows.glowCyan,
  },
  emptyActionBtnText: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: typography.fontFamilyMono,
  },
  dashHeaderBar: {
    backgroundColor: '#0A1322',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.35)',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  dashHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.emeraldSubtle,
    borderWidth: 1,
    borderColor: colors.emeraldPrimary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.emeraldBright,
  },
  liveText: {
    color: colors.emeraldBright,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: typography.fontFamilyMono,
  },
  dashHeaderTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    fontFamily: typography.fontFamilyHeading,
    letterSpacing: 0.5,
  },
  dashHeaderTime: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: typography.fontFamilyMono,
  },
  dashHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  backBtn: {
    backgroundColor: colors.bgCardSubtle,
    borderWidth: 1,
    borderColor: colors.cyanPrimary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  backBtnText: {
    color: colors.cyanBright,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  inspectBtn: {
    backgroundColor: colors.bgCardSubtle,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inspectBtnText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
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
  kpiPurple: {
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  kpiLabel: {
    color: colors.textMuted,
    fontSize: 9.5,
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
  kpiValuePurple: {
    color: colors.purpleBright,
    fontSize: 28,
    fontWeight: '800',
    fontFamily: typography.fontFamilyHeading,
  },
  kpiPill: {
    marginTop: 6,
    backgroundColor: '#0A0F1D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  kpiPillText: {
    color: colors.textSecondary,
    fontSize: 10.5,
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
  historyCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  historyTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  historyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  historyPill: {
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderColor: colors.borderMedium,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 3,
  },
  historyPillActive: {
    borderColor: colors.cyanBright,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  historyTime: {
    color: colors.textMuted,
    fontSize: 9,
    fontFamily: typography.fontFamilyMono,
  },
  historyCircuit: {
    color: colors.goldBright,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  historyRecovery: {
    color: colors.emeraldBright,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: typography.fontFamilyMono,
  },
  historyGold: {
    color: colors.cyanBright,
    fontSize: 9.5,
    fontFamily: typography.fontFamilyMono,
  },
});
