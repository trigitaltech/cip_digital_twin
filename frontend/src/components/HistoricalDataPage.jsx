import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, shadows } from '../styles/theme';
import {
  fetchTelemetryHistory,
  fetchTelemetryDetail,
  deleteTelemetryRecord,
} from '../api/telemetryApi';

export default function HistoricalDataPage({
  onLoadIntoDashboard,
  onLoadIntoIngest,
  onOpenRawJson,
}) {
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedCircuit, setSelectedCircuit] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Load history from API
  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchTelemetryHistory(selectedCircuit === 'ALL' ? null : selectedCircuit);
      setHistoryItems(data.items || []);
    } catch (err) {
      setErrorMessage(`Failed to retrieve historical telemetry logs: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCircuit]);

  // Handle Load in Dashboard
  const handleLoadDashboard = async (item) => {
    setActionLoadingId(`dash-${item.telemetry_id}`);
    try {
      const detail = await fetchTelemetryDetail(item.telemetry_id);
      onLoadIntoDashboard(detail);
    } catch (err) {
      alert(`Could not load full telemetry: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Load in Ingest
  const handleLoadIngest = (item) => {
    onLoadIntoIngest(item);
  };

  // Handle Delete
  const handleDelete = async (telemetryId) => {
    if (!window.confirm(`Are you sure you want to permanently delete Telemetry Record #${telemetryId}?`)) {
      return;
    }
    setActionLoadingId(`del-${telemetryId}`);
    try {
      await deleteTelemetryRecord(telemetryId);
      setHistoryItems((prev) => prev.filter((it) => it.telemetry_id !== telemetryId));
    } catch (err) {
      alert(`Error deleting record: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!historyItems.length) return;
    const headers = [
      'Telemetry ID',
      'Circuit ID',
      'Timestamp',
      'Slurry Flow (m3/h)',
      'Slurry Density (%)',
      'pH',
      'Carbon Advance (t/h)',
      'Head Grade (g/t Au)',
      'Tail Grade (ppm Au)',
      'Recovery (%)',
      'Stages Count',
      'Lime (t/d)',
      'NaCN (t/d)',
      'H2O2 (t/d)',
    ];

    const rows = historyItems.map((item) => [
      item.telemetry_id,
      item.circuit_id,
      item.timestamp || '',
      item.slurry_flow_rate_m3_h,
      item.slurry_density_pct,
      item.slurry_ph,
      item.carbon_advance_rate_tons_h,
      item.head_grade_au_gt,
      item.tail_grade_au_ppm,
      item.approx_recovery_pct,
      item.stage_count,
      item.reagents?.lime_daily_tons || 0,
      item.reagents?.nacn_daily_tons || 0,
      item.reagents?.h2o2_daily_tons || 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `metallurgy_telemetry_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter items by search query
  const filteredItems = historyItems.filter((it) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(it.telemetry_id).includes(q) ||
      it.circuit_id.toLowerCase().includes(q) ||
      String(it.head_grade_au_gt).includes(q)
    );
  });

  // Calculate aggregates
  const totalCount = historyItems.length;
  const avgHead = totalCount
    ? (historyItems.reduce((acc, curr) => acc + (curr.head_grade_au_gt || 0), 0) / totalCount).toFixed(2)
    : '0.00';
  const avgRec = totalCount
    ? (historyItems.reduce((acc, curr) => acc + (curr.approx_recovery_pct || 0), 0) / totalCount).toFixed(1)
    : '0.0';
  const totalLimeTons = totalCount
    ? historyItems.reduce((acc, curr) => acc + (curr.reagents?.lime_daily_tons || 0), 0).toFixed(1)
    : '0.0';

  return (
    <View style={styles.pageContainer}>
      {/* Top Banner & Control Bar */}
      <View style={styles.topControlCard}>
        <View style={styles.titleRow}>
          <View>
            <View style={styles.badgeRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.liveTagText}>ORACLE & POSTGRESQL HISTORICAL ARCHIVE</Text>
            </View>
            <Text style={styles.pageTitle}>HISTORICAL TELEMETRY AUDIT LOGS</Text>
            <Text style={styles.pageSubtitle}>
              Persistent records of gold leaching kinetics, chemical dosing prescriptions, and countercurrent stages.
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={loadData}
              activeOpacity={0.7}
            >
              <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportBtn}
              onPress={handleExportCsv}
              activeOpacity={0.7}
            >
              <Text style={styles.exportBtnText}>📥 Export CSV</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Aggregated Quick Metrics Row */}
        <View style={styles.aggregateGrid}>
          <View style={styles.aggregateCard}>
            <Text style={styles.aggregateLabel}>TOTAL RUNS ARCHIVED</Text>
            <Text style={[styles.aggregateValue, { color: colors.cyanBright }]}>{totalCount}</Text>
            <Text style={styles.aggregateSub}>Telemetry snapshots in DB</Text>
          </View>

          <View style={styles.aggregateCard}>
            <Text style={styles.aggregateLabel}>AVERAGE HEAD GRADE</Text>
            <Text style={[styles.aggregateValue, { color: colors.goldBright }]}>{avgHead} g/t</Text>
            <Text style={styles.aggregateSub}>Inlet solution assay</Text>
          </View>

          <View style={styles.aggregateCard}>
            <Text style={styles.aggregateLabel}>AVERAGE RECOVERY</Text>
            <Text style={[styles.aggregateValue, { color: colors.emeraldBright }]}>{avgRec}%</Text>
            <Text style={styles.aggregateSub}>Mean circuit recovery</Text>
          </View>

          <View style={styles.aggregateCard}>
            <Text style={styles.aggregateLabel}>CUMULATIVE LIME DEMAND</Text>
            <Text style={[styles.aggregateValue, { color: colors.purpleBright }]}>{totalLimeTons} t/d</Text>
            <Text style={styles.aggregateSub}>Sum of active prescriptions</Text>
          </View>
        </View>

        {/* Filter & Search Bar */}
        <View style={styles.filterBar}>
          <View style={styles.filterPills}>
            <Text style={styles.filterLabel}>CIRCUIT:</Text>
            {['ALL', 'CIP-LINE-1', 'CIP-LINE-2', 'CIL-CIRCUIT-A'].map((cId) => {
              const isActive = selectedCircuit === cId;
              return (
                <TouchableOpacity
                  key={cId}
                  style={[styles.circuitPill, isActive && styles.circuitPillActive]}
                  onPress={() => setSelectedCircuit(cId)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.circuitPillText, isActive && styles.circuitPillTextActive]}>
                    {cId}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by Record ID, Grade, or Circuit..."
              placeholderTextColor={colors.textMuted}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.searchClear}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Error Banner */}
      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Loading Indicator */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.goldBright} />
          <Text style={styles.loadingText}>QUERYING METALLURGY TELEMETRY DATABASE ARCHIVE...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📜</Text>
          <Text style={styles.emptyTitle}>NO HISTORICAL RECORDS FOUND</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? `No records matching "${searchQuery}". Try clearing search filter.`
              : 'Submit telemetry runs from the Ingestion form to build an audit history.'}
          </Text>
        </View>
      ) : (
        /* History Records List with Custom Vertical Scrollbar */
        <ScrollView
          style={styles.recordsList}
          contentContainerStyle={styles.recordsListContent}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
        >
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.telemetry_id;
            const timeStr = item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A';
            const isDashLoading = actionLoadingId === `dash-${item.telemetry_id}`;
            const isDelLoading = actionLoadingId === `del-${item.telemetry_id}`;

            return (
              <View key={item.telemetry_id} style={styles.recordCard}>
                {/* Main Summary Header */}
                <View style={styles.recordTopRow}>
                  <View style={styles.recordLeftGroup}>
                    <View style={styles.recordIdBadge}>
                      <Text style={styles.recordIdText}>#{item.telemetry_id}</Text>
                    </View>
                    <View>
                      <View style={styles.circuitRow}>
                        <Text style={styles.recordCircuitTitle}>{item.circuit_id}</Text>
                        <View style={styles.processTypeTag}>
                          <Text style={styles.processTypeText}>
                            {item.circuit_id.includes('CIL') ? 'CIL' : 'CIP'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.recordTimestamp}>🕒 {timeStr}</Text>
                    </View>
                  </View>

                  {/* Core Metrics Preview */}
                  <View style={styles.metricsSummaryGroup}>
                    <View style={styles.miniMetric}>
                      <Text style={styles.miniMetricLabel}>HEAD GRADE</Text>
                      <Text style={[styles.miniMetricVal, { color: colors.goldBright }]}>
                        {item.head_grade_au_gt.toFixed(2)} g/t
                      </Text>
                    </View>

                    <View style={styles.miniMetric}>
                      <Text style={styles.miniMetricLabel}>SLURRY FEED</Text>
                      <Text style={[styles.miniMetricVal, { color: colors.cyanBright }]}>
                        {item.slurry_flow_rate_m3_h} m³/h
                      </Text>
                    </View>

                    <View style={styles.miniMetric}>
                      <Text style={styles.miniMetricLabel}>RECOVERY</Text>
                      <Text style={[styles.miniMetricVal, { color: colors.emeraldBright }]}>
                        {item.approx_recovery_pct}%
                      </Text>
                    </View>

                    <View style={styles.miniMetric}>
                      <Text style={styles.miniMetricLabel}>C-ADVANCE</Text>
                      <Text style={styles.miniMetricVal}>
                        {item.carbon_advance_rate_tons_h} t/h
                      </Text>
                    </View>

                    <View style={styles.miniMetric}>
                      <Text style={styles.miniMetricLabel}>STAGES</Text>
                      <Text style={styles.miniMetricVal}>{item.stage_count} Tanks</Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.recordActionsRow}>
                    <TouchableOpacity
                      style={styles.btnDashboard}
                      onPress={() => handleLoadDashboard(item)}
                      disabled={isDashLoading}
                      activeOpacity={0.8}
                    >
                      {isDashLoading ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <Text style={styles.btnDashboardText}>📊 View Dashboard</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnIngest}
                      onPress={() => handleLoadIngest(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.btnIngestText}>📡 Load into Ingest</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnExpand}
                      onPress={() => setExpandedId(isExpanded ? null : item.telemetry_id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.btnExpandText}>
                        {isExpanded ? '▲ Hide Stages' : '▼ Tank Stages'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.btnDelete}
                      onPress={() => handleDelete(item.telemetry_id)}
                      disabled={isDelLoading}
                      activeOpacity={0.8}
                    >
                      {isDelLoading ? (
                        <ActivityIndicator size="small" color={colors.roseBright} />
                      ) : (
                        <Text style={styles.btnDeleteText}>🗑️</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Expanded Tank Stages & Reagent Audit Drawer */}
                {isExpanded && (
                  <View style={styles.expandedDrawer}>
                    <View style={styles.drawerSectionHeader}>
                      <Text style={styles.drawerTitle}>
                        TANK-BY-TANK COUNTERCURRENT CONTACT PROFILE ({item.stage_count} STAGES)
                      </Text>
                    </View>

                    {/* Tank Stages Grid */}
                    <View style={styles.drawerStagesGrid}>
                      {item.stages?.map((stage) => (
                        <View key={stage.tank_index} style={styles.drawerStageCard}>
                          <View style={styles.stageIndexTag}>
                            <Text style={styles.stageIndexText}>Tank #{stage.tank_index}</Text>
                          </View>
                          <View style={styles.stageDataRow}>
                            <Text style={styles.stageDataLabel}>Au in Solution:</Text>
                            <Text style={styles.stageDataValGold}>{stage.solution_au_ppm} ppm</Text>
                          </View>
                          <View style={styles.stageDataRow}>
                            <Text style={styles.stageDataLabel}>Carbon Load:</Text>
                            <Text style={styles.stageDataVal}>{stage.carbon_load_au_gt} g/t</Text>
                          </View>
                          <View style={styles.stageDataRow}>
                            <Text style={styles.stageDataLabel}>Carbon Density:</Text>
                            <Text style={styles.stageDataVal}>{stage.carbon_density_gl} g/L</Text>
                          </View>
                          <View style={styles.stageDataRow}>
                            <Text style={styles.stageDataLabel}>Fouling Alpha:</Text>
                            <Text
                              style={[
                                styles.stageDataVal,
                                {
                                  color:
                                    stage.fouling_factor_alpha < 0.7
                                      ? colors.roseBright
                                      : stage.fouling_factor_alpha < 0.85
                                      ? colors.goldBright
                                      : colors.emeraldBright,
                                },
                              ]}
                            >
                              {stage.fouling_factor_alpha}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* Reagents Snapshot */}
                    {item.reagents && (
                      <View style={styles.reagentsDrawerSection}>
                        <Text style={styles.reagentsDrawerTitle}>
                          CHEMICAL DOSING PRESCRIPTION SUMMARY
                        </Text>
                        <View style={styles.reagentsGrid}>
                          <View style={styles.reagentCard}>
                            <Text style={styles.reagentCardLabel}>LIME DOSING</Text>
                            <Text style={[styles.reagentCardVal, { color: colors.purpleBright }]}>
                              {item.reagents.lime_daily_tons} t/d
                            </Text>
                            <Text style={styles.reagentCardSub}>
                              {item.reagents.lime_addition_kg_t} kg/t ore
                            </Text>
                          </View>

                          <View style={styles.reagentCard}>
                            <Text style={styles.reagentCardLabel}>SODIUM CYANIDE (NaCN)</Text>
                            <Text style={[styles.reagentCardVal, { color: colors.cyanBright }]}>
                              {item.reagents.nacn_daily_tons} t/d
                            </Text>
                            <Text style={styles.reagentCardSub}>
                              {item.reagents.nacn_consumption_kg_t} kg/t ore
                            </Text>
                          </View>

                          <View style={styles.reagentCard}>
                            <Text style={styles.reagentCardLabel}>OXIDANT (H₂O₂)</Text>
                            <Text style={[styles.reagentCardVal, { color: colors.roseBright }]}>
                              {item.reagents.h2o2_daily_tons} t/d
                            </Text>
                            <Text style={styles.reagentCardSub}>
                              Equiv pure O₂: {item.reagents.equivalent_pure_o2_kg_h} kg/h
                            </Text>
                          </View>

                          <View style={styles.reagentCard}>
                            <Text style={styles.reagentCardLabel}>DRY ORE THROUGHPUT</Text>
                            <Text style={[styles.reagentCardVal, { color: colors.textPrimary }]}>
                              {item.reagents.dry_solids_rate_tons_h} t/h
                            </Text>
                            <Text style={styles.reagentCardSub}>
                              Water: {item.reagents.water_rate_m3_h} m³/h
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    gap: 16,
  },
  topControlCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    padding: 20,
    gap: 16,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.emeraldBright,
    boxShadow: '0 0 6px #10B981',
  },
  liveTagText: {
    color: colors.emeraldBright,
    fontSize: 10.5,
    fontWeight: '800',
    fontFamily: typography.fontFamilyMono,
    letterSpacing: 0.8,
  },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: typography.fontFamilyHeading,
  },
  pageSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontFamily: typography.fontFamilyBody,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  refreshBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: colors.borderMedium,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  refreshBtnText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  exportBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: colors.goldPrimary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  exportBtnText: {
    color: colors.goldBright,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  aggregateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  aggregateCard: {
    flexGrow: 1,
    flexBasis: 160,
    backgroundColor: '#090E1A',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    padding: 12,
  },
  aggregateLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  aggregateValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
    fontFamily: typography.fontFamilyHeading,
  },
  aggregateSub: {
    color: colors.textSecondary,
    fontSize: 9.5,
    marginTop: 2,
    fontFamily: typography.fontFamilyBody,
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  filterPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
    marginRight: 4,
  },
  circuitPill: {
    backgroundColor: '#090E1A',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  circuitPillActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: colors.cyanBright,
  },
  circuitPillText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMono,
  },
  circuitPillTextActive: {
    color: colors.cyanBright,
    fontWeight: '800',
  },
  searchBox: {
    flexGrow: 1,
    maxWidth: 360,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090E1A',
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 8,
  },
  searchIcon: {
    fontSize: 13,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 12,
    fontFamily: typography.fontFamilyMono,
    outlineStyle: 'none',
  },
  searchClear: {
    color: colors.textMuted,
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: colors.rosePrimary,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorIcon: {
    fontSize: 18,
  },
  errorText: {
    color: colors.roseBright,
    fontSize: 12,
    fontFamily: typography.fontFamilyMono,
  },
  loadingContainer: {
    padding: 40,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.goldBright,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  emptyCard: {
    padding: 48,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    gap: 10,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: typography.fontFamilyHeading,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 480,
    fontFamily: typography.fontFamilyBody,
  },
  recordsList: {
    flex: 1,
  },
  recordsListContent: {
    gap: 12,
    paddingBottom: 40,
  },
  recordCard: {
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    padding: 16,
    gap: 12,
  },
  recordTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  recordLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordIdBadge: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: colors.borderMedium,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  recordIdText: {
    color: colors.goldBright,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: typography.fontFamilyMono,
  },
  circuitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordCircuitTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: typography.fontFamilyHeading,
  },
  processTypeTag: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: colors.cyanPrimary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  processTypeText: {
    color: colors.cyanBright,
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  recordTimestamp: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: typography.fontFamilyMono,
  },
  metricsSummaryGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  miniMetric: {
    alignItems: 'flex-start',
  },
  miniMetricLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  miniMetricVal: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    fontFamily: typography.fontFamilyMono,
  },
  recordActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  btnDashboard: {
    backgroundColor: colors.goldPrimary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  btnDashboardText: {
    color: '#080C16',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: typography.fontFamilyMono,
  },
  btnIngest: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: colors.borderMedium,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  btnIngestText: {
    color: colors.cyanBright,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  btnExpand: {
    backgroundColor: '#0F1A30',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  btnExpandText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMono,
  },
  btnDelete: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: colors.rosePrimary,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 6,
  },
  btnDeleteText: {
    fontSize: 12,
  },
  /* DRAWER */
  expandedDrawer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 14,
    gap: 12,
  },
  drawerSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerTitle: {
    color: colors.textMuted,
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  drawerStagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  drawerStageCard: {
    flexGrow: 1,
    flexBasis: 160,
    backgroundColor: '#080C16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 6,
    padding: 10,
    gap: 4,
  },
  stageIndexTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  stageIndexText: {
    color: colors.cyanBright,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  stageDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stageDataLabel: {
    color: colors.textMuted,
    fontSize: 9.5,
    fontFamily: typography.fontFamilyMono,
  },
  stageDataVal: {
    color: colors.textPrimary,
    fontSize: 9.5,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMono,
  },
  stageDataValGold: {
    color: colors.goldBright,
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  reagentsDrawerSection: {
    marginTop: 6,
    gap: 8,
  },
  reagentsDrawerTitle: {
    color: colors.textMuted,
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  reagentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reagentCard: {
    flexGrow: 1,
    flexBasis: 160,
    backgroundColor: '#080C16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 6,
    padding: 10,
  },
  reagentCardLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  reagentCardVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
    fontFamily: typography.fontFamilyHeading,
  },
  reagentCardSub: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
    fontFamily: typography.fontFamilyBody,
  },
});
