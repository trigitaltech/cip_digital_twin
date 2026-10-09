import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { colors, typography, shadows } from '../styles/theme';

export default function TelemetryForm({
  formData,
  onChangeField,
  onChangeGlobalMetric,
  onChangeMineralogyAssay,
  onChangeTankStage,
  onAddTankStage,
  onRemoveTankStage,
  onSubmit,
  isLoading,
  selectedStageIndex,
  onSelectStage,
}) {
  const [activeTab, setActiveTab] = useState('tanks'); // 'tanks' | 'globals' | 'mineralogy'

  return (
    <View style={styles.card}>
      {/* Tab Header */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'tanks' && styles.tabButtonActive]}
          onPress={() => setActiveTab('tanks')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'tanks' && styles.tabButtonTextActive]}>
            TANK TRAIN STAGES ({formData.tank_stages.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'globals' && styles.tabButtonActive]}
          onPress={() => setActiveTab('globals')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'globals' && styles.tabButtonTextActive]}>
            GLOBAL SLURRY METRICS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'mineralogy' && styles.tabButtonActive]}
          onPress={() => setActiveTab('mineralogy')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'mineralogy' && styles.tabButtonTextActive]}>
            MINERALOGY & ASSAY (XRF)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab 1: Tank Train Stages */}
      {activeTab === 'tanks' && (
        <View style={styles.tabContent}>
          <View style={styles.stageActionsRow}>
            <Text style={styles.sectionHeading}>
              Per-Tank Adsorption Telemetry (Countercurrent Stages)
            </Text>
            <View style={styles.stageButtons}>
              <TouchableOpacity
                style={[
                  styles.stageAddBtn,
                  formData.tank_stages.length >= 8 && styles.stageBtnDisabled,
                ]}
                disabled={formData.tank_stages.length >= 8}
                onPress={onAddTankStage}
              >
                <Text style={styles.stageAddBtnText}>+ Add Stage</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.stageRemBtn,
                  formData.tank_stages.length <= 2 && styles.stageBtnDisabled,
                ]}
                disabled={formData.tank_stages.length <= 2}
                onPress={onRemoveTankStage}
              >
                <Text style={styles.stageRemBtnText}>- Remove Stage</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.stageCardsContainer} nestedScrollEnabled={true}>
            <View style={styles.stageGrid}>
              {formData.tank_stages.map((stage, idx) => {
                const isSelected = selectedStageIndex === stage.tank_index;
                return (
                  <View
                    key={stage.tank_index}
                    style={[styles.stageCard, isSelected && styles.stageCardSelected]}
                  >
                    <View style={styles.stageHeader}>
                      <View style={styles.stageTag}>
                        <Text style={styles.stageTagText}>TANK #{stage.tank_index}</Text>
                      </View>
                      <Text style={styles.stageRole}>
                        {idx === 0
                          ? 'Head Tank (Highest Au)'
                          : idx === formData.tank_stages.length - 1
                          ? 'Tail Tank (Fresh Carbon)'
                          : `Stage ${idx + 1}`}
                      </Text>
                    </View>

                    <View style={styles.inputRow}>
                      <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>SOLUTION AU (ppm)</Text>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          value={String(stage.solution_au_ppm)}
                          onChangeText={(val) =>
                            onChangeTankStage(idx, 'solution_au_ppm', parseFloat(val) || 0)
                          }
                        />
                      </View>

                      <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>CARBON LOAD (g/t)</Text>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          value={String(stage.carbon_load_au_gt)}
                          onChangeText={(val) =>
                            onChangeTankStage(idx, 'carbon_load_au_gt', parseFloat(val) || 0)
                          }
                        />
                      </View>
                    </View>

                    <View style={styles.inputRow}>
                      <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>CARBON DENSITY (g/L)</Text>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          value={String(stage.carbon_density_gl)}
                          onChangeText={(val) =>
                            onChangeTankStage(idx, 'carbon_density_gl', parseFloat(val) || 0)
                          }
                        />
                      </View>

                      <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>FOULING ALPHA (0.1 - 1.0)</Text>
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          value={String(stage.fouling_factor_alpha)}
                          onChangeText={(val) =>
                            onChangeTankStage(idx, 'fouling_factor_alpha', parseFloat(val) || 0)
                          }
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Tab 2: Global Slurry Metrics */}
      {activeTab === 'globals' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionHeading}>
            Hydraulic & Operating Feed Telemetry
          </Text>

          <View style={styles.formGrid}>
            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>CIRCUIT ID</Text>
              <TextInput
                style={styles.input}
                value={formData.circuit_id}
                onChangeText={(val) => onChangeField('circuit_id', val)}
                placeholder="e.g. CIP-LINE-1"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.fieldHint}>Unique metallurgical train identifier</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>SLURRY FLOW RATE (m³/h)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(formData.global_metrics.slurry_flow_rate_m3_h)}
                onChangeText={(val) =>
                  onChangeGlobalMetric('slurry_flow_rate_m3_h', parseFloat(val) || 0)
                }
              />
              <Text style={styles.fieldHint}>Total pulp volumetric flow rate entering Tank 1</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>SLURRY DENSITY (% SOLIDS w/w)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(formData.global_metrics.slurry_density_pct)}
                onChangeText={(val) =>
                  onChangeGlobalMetric('slurry_density_pct', parseFloat(val) || 0)
                }
              />
              <Text style={styles.fieldHint}>Pulp dry solids percentage (typical: 45 - 55%)</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>INLET SLURRY pH</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(formData.global_metrics.slurry_ph)}
                onChangeText={(val) => onChangeGlobalMetric('slurry_ph', parseFloat(val) || 0)}
              />
              <Text style={styles.fieldHint}>Raw slurry inlet pH before hydrated lime dosing</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>CARBON ADVANCE RATE (t/h)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(formData.global_metrics.carbon_advance_rate_tons_h)}
                onChangeText={(val) =>
                  onChangeGlobalMetric('carbon_advance_rate_tons_h', parseFloat(val) || 0)
                }
              />
              <Text style={styles.fieldHint}>Current carbon transfer speed along train</Text>
            </View>
          </View>
        </View>
      )}

      {/* Tab 3: Mineralogy & Assay (XRF) */}
      {activeTab === 'mineralogy' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionHeading}>
            Ore Mineralogy, Cyanicides & Leaching Chemistry
          </Text>

          <View style={styles.formGrid}>
            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>HEAD GRADE AU (g/t)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(formData.mineralogy_assay.head_grade_au_gt)}
                onChangeText={(val) =>
                  onChangeMineralogyAssay('head_grade_au_gt', parseFloat(val) || 0)
                }
              />
              <Text style={styles.fieldHint}>Assayed ore feed head grade (Fire Assay)</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>TOTAL SULFUR (% S)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(formData.mineralogy_assay.sulfur_pct)}
                onChangeText={(val) => onChangeMineralogyAssay('sulfur_pct', parseFloat(val) || 0)}
              />
              <Text style={styles.fieldHint}>Pyrite / arsenopyrite content consuming oxygen</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>TOTAL COPPER (% Cu)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(formData.mineralogy_assay.copper_pct)}
                onChangeText={(val) => onChangeMineralogyAssay('copper_pct', parseFloat(val) || 0)}
              />
              <Text style={styles.fieldHint}>Major cyanicide forming Cu(CN)₃²⁻ complexes</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>TOTAL ARSENIC (% As)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(formData.mineralogy_assay.arsenic_pct)}
                onChangeText={(val) => onChangeMineralogyAssay('arsenic_pct', parseFloat(val) || 0)}
              />
              <Text style={styles.fieldHint}>Refractory mineral indicator</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>TARGET LEACH pH</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(formData.mineralogy_assay.target_ph)}
                onChangeText={(val) => onChangeMineralogyAssay('target_ph', parseFloat(val) || 0)}
              />
              <Text style={styles.fieldHint}>Protective alkalinity setpoint (10.5 - 11.0)</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>TARGET RESIDUAL FREE NaCN (ppm)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(formData.mineralogy_assay.target_free_cyanide_ppm)}
                onChangeText={(val) =>
                  onChangeMineralogyAssay('target_free_cyanide_ppm', parseFloat(val) || 0)
                }
              />
              <Text style={styles.fieldHint}>Target free cyanide maintained in leach liquor</Text>
            </View>
          </View>
        </View>
      )}

      {/* Bottom Execute Button */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'OPTIMIZING CIRCUIT KINETICS...' : 'INGEST TELEMETRY & RUN DIGITAL TWIN (POST /api/v2/telemetry)'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    ...shadows.card,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0A0F1D',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.cyanBright,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
  },
  tabButtonText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: typography.fontFamilyMono,
  },
  tabButtonTextActive: {
    color: colors.cyanBright,
    fontWeight: '800',
  },
  tabContent: {
    padding: 16,
  },
  sectionHeading: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: typography.fontFamilyHeading,
  },
  stageActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  stageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  stageAddBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: colors.emeraldPrimary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  stageAddBtnText: {
    color: colors.emeraldBright,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  stageRemBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: colors.rosePrimary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  stageRemBtnText: {
    color: colors.roseBright,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  stageBtnDisabled: {
    opacity: 0.4,
  },
  stageCardsContainer: {
    maxHeight: 460,
  },
  stageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stageCard: {
    flexGrow: 1,
    flexBasis: 280,
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    padding: 12,
  },
  stageCardSelected: {
    borderColor: colors.cyanBright,
    backgroundColor: '#0E172C',
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stageTag: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stageTagText: {
    color: colors.goldBright,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: typography.fontFamilyMono,
  },
  stageRole: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: typography.fontFamilyMono,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 9.5,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: typography.fontFamilyMono,
  },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: 6,
    color: colors.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontFamily: typography.fontFamilyMono,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  formCard: {
    flexGrow: 1,
    flexBasis: 240,
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    padding: 12,
  },
  fieldHint: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 4,
    fontFamily: typography.fontFamilyBody,
  },
  footerRow: {
    padding: 16,
    backgroundColor: '#090E1A',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  submitButton: {
    backgroundColor: colors.cyanDark,
    borderWidth: 1,
    borderColor: colors.cyanBright,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glowCyan,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: typography.fontFamilyMono,
  },
});
