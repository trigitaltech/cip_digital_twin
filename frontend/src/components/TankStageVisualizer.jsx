import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, shadows } from '../styles/theme';

export default function TankStageVisualizer({
  stages,
  recommendedDensities,
  selectedStageIndex,
  onSelectStage,
  processType,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleInfo}>
          <Text style={styles.title}>COUNTERCURRENT CONTACT TRAIN SCHEMATIC</Text>
          <Text style={styles.subtitle}>
            {processType === 'CIL' ? 'Carbon-In-Leach (Simultaneous Leaching & Adsorption)' : 'Carbon-In-Pulp (Pulp Adsorption Cascade)'}
          </Text>
        </View>
        <View style={styles.legendContainer}>
          <View style={styles.legendBadgeSlurry}>
            <Text style={styles.legendArrow}>➔</Text>
            <Text style={styles.legendText}>Slurry Pulp Flow (T1 ➔ T{stages.length})</Text>
          </View>
          <View style={styles.legendBadgeCarbon}>
            <Text style={styles.legendArrow}>⬅</Text>
            <Text style={styles.legendText}>Carbon Advance (T{stages.length} ➔ T1)</Text>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        {stages.map((stage, idx) => {
          const isSelected = selectedStageIndex === stage.tank_index;
          const recDensity = recommendedDensities && recommendedDensities[idx];
          const alphaVal = Number(stage.fouling_factor_alpha) || 1.0;
          
          let alphaColor = colors.emeraldBright;
          if (alphaVal < 0.70) alphaColor = colors.roseBright;
          else if (alphaVal < 0.85) alphaColor = colors.goldBright;

          return (
            <TouchableOpacity
              key={stage.tank_index}
              style={[styles.tankCard, isSelected && styles.tankCardSelected]}
              onPress={() => onSelectStage(stage.tank_index)}
              activeOpacity={0.8}
            >
              {/* Vessel top agitator cap */}
              <View style={styles.agitatorMotor}>
                <View style={styles.agitatorShaft} />
              </View>

              <View style={styles.vesselBody}>
                <View style={styles.tankBadgeRow}>
                  <View style={[styles.tankIndexBadge, isSelected && styles.tankIndexBadgeActive]}>
                    <Text style={styles.tankIndexText}>TK-{stage.tank_index}</Text>
                  </View>
                  {stage.tank_index === 1 && (
                    <Text style={styles.tagHead}>HEAD</Text>
                  )}
                  {stage.tank_index === stages.length && (
                    <Text style={styles.tagTail}>TAIL</Text>
                  )}
                </View>

                {/* Solution Au */}
                <View style={styles.metricBlock}>
                  <Text style={styles.metricLabel}>SOLUTION AU</Text>
                  <Text style={styles.metricValueAu}>{Number(stage.solution_au_ppm).toFixed(2)}</Text>
                  <Text style={styles.metricUnit}>ppm (g/t)</Text>
                </View>

                {/* Carbon Load Au */}
                <View style={styles.metricBlock}>
                  <Text style={styles.metricLabel}>CARBON LOAD</Text>
                  <Text style={styles.metricValueCarbon}>{Math.round(Number(stage.carbon_load_au_gt))}</Text>
                  <Text style={styles.metricUnit}>g/t Au</Text>
                </View>

                {/* Carbon Density & Recommendation */}
                <View style={styles.densityBlock}>
                  <View style={styles.densityRow}>
                    <Text style={styles.densityLabel}>DENSITY:</Text>
                    <Text style={styles.densityValue}>{Number(stage.carbon_density_gl).toFixed(1)} g/L</Text>
                  </View>
                  {recDensity !== undefined && (
                    <View style={styles.recDensityRow}>
                      <Text style={styles.recDensityLabel}>OPT TARGET:</Text>
                      <Text style={styles.recDensityValue}>{recDensity.toFixed(1)} g/L</Text>
                    </View>
                  )}
                </View>

                {/* Fouling Alpha Indicator */}
                <View style={styles.alphaContainer}>
                  <Text style={styles.alphaLabel}>ACTIVITY α:</Text>
                  <View style={[styles.alphaPill, { borderColor: alphaColor }]}>
                    <Text style={[styles.alphaValue, { color: alphaColor }]}>
                      {(alphaVal * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* Countercurrent Flow connector line between tanks */}
              {idx < stages.length - 1 && (
                <View style={styles.connector}>
                  <Text style={styles.connectorArrowSlurry}>→</Text>
                  <Text style={styles.connectorArrowCarbon}>←</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 16,
    marginVertical: 12,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  titleInfo: {
    gap: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: typography.fontFamilyHeading,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: typography.fontFamilyBody,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  legendBadgeSlurry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  legendBadgeCarbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  legendArrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  legendText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMono,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  tankCard: {
    width: 140,
    alignItems: 'center',
    position: 'relative',
  },
  tankCardSelected: {
    transform: [{ scale: 1.02 }],
  },
  agitatorMotor: {
    width: 28,
    height: 12,
    backgroundColor: '#334155',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
  },
  agitatorShaft: {
    width: 4,
    height: 6,
    backgroundColor: '#64748B',
    marginTop: 11,
  },
  vesselBody: {
    width: '100%',
    backgroundColor: '#0B1222',
    borderWidth: 1.5,
    borderColor: colors.borderMedium,
    borderRadius: 10,
    padding: 10,
    marginTop: 2,
    alignItems: 'center',
    gap: 8,
  },
  tankBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  tankIndexBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tankIndexBadgeActive: {
    backgroundColor: colors.cyanDark,
    borderColor: colors.cyanBright,
  },
  tankIndexText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: typography.fontFamilyMono,
  },
  tagHead: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.goldBright,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  tagTail: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.cyanBright,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  metricBlock: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#162238',
  },
  metricLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: colors.textMuted,
    fontFamily: typography.fontFamilyMono,
    letterSpacing: 0.5,
  },
  metricValueAu: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.goldBright,
    fontFamily: typography.fontFamilyHeading,
    marginTop: 1,
  },
  metricValueCarbon: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.cyanBright,
    fontFamily: typography.fontFamilyMono,
    marginTop: 1,
  },
  metricUnit: {
    fontSize: 8,
    color: colors.textMuted,
  },
  densityBlock: {
    width: '100%',
    backgroundColor: '#111A2E',
    borderRadius: 4,
    padding: 4,
    gap: 2,
  },
  densityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  densityLabel: {
    fontSize: 8,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  densityValue: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: typography.fontFamilyMono,
  },
  recDensityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recDensityLabel: {
    fontSize: 8,
    color: colors.emeraldBright,
    fontWeight: '700',
  },
  recDensityValue: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.emeraldBright,
    fontFamily: typography.fontFamilyMono,
  },
  alphaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  alphaLabel: {
    fontSize: 8.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  alphaPill: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  alphaValue: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  connector: {
    position: 'absolute',
    right: -10,
    top: '50%',
    transform: [{ translateY: -10 }],
    alignItems: 'center',
    zIndex: 10,
  },
  connectorArrowSlurry: {
    fontSize: 12,
    color: colors.blueBright,
    fontWeight: '900',
  },
  connectorArrowCarbon: {
    fontSize: 12,
    color: colors.goldBright,
    fontWeight: '900',
    marginTop: -4,
  },
});
