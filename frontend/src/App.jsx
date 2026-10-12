import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, shadows } from './styles/theme';
import Header from './components/Header';
import TankStageVisualizer from './components/TankStageVisualizer';
import TelemetryForm from './components/TelemetryForm';
import DashboardPage from './components/DashboardPage';
import RawJsonModal from './components/RawJsonModal';
import LoginScreen from './components/LoginScreen';
import HistoricalDataPage from './components/HistoricalDataPage';
import { PRESETS, submitTelemetry, checkHealth } from './api/telemetryApi';

export default function App() {
  const initialPreset = PRESETS[0];

  // Operator Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cip_logged_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Primary Page State: 'ingest' | 'dashboard'
  const [currentPage, setCurrentPage] = useState('ingest');

  const [circuitId, setCircuitId] = useState(initialPreset.circuit_id);
  const [processType, setProcessType] = useState(initialPreset.process_type);
  const [activePresetId, setActivePresetId] = useState(initialPreset.id);
  const [globalMetrics, setGlobalMetrics] = useState({ ...initialPreset.global_metrics });
  const [mineralogyAssay, setMineralogyAssay] = useState({ ...initialPreset.mineralogy_assay });
  const [tankStages, setTankStages] = useState(JSON.parse(JSON.stringify(initialPreset.tank_stages)));
  const [selectedStageIndex, setSelectedStageIndex] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [apiHealth, setApiHealth] = useState({ status: 'checking' });
  const [modalVisible, setModalVisible] = useState(false);
  const [history, setHistory] = useState([]);

  // Check backend health periodically
  useEffect(() => {
    let isMounted = true;
    async function testApi() {
      const health = await checkHealth();
      if (isMounted) setApiHealth(health);
    }
    testApi();
    const interval = setInterval(testApi, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Preset switch handler
  const handleSelectPreset = (preset) => {
    setActivePresetId(preset.id);
    setCircuitId(preset.circuit_id);
    setProcessType(preset.process_type);
    setGlobalMetrics({ ...preset.global_metrics });
    setMineralogyAssay({ ...preset.mineralogy_assay });
    setTankStages(JSON.parse(JSON.stringify(preset.tank_stages)));
    setSelectedStageIndex(1);
    setErrorMessage(null);
  };

  // Process type switch handler
  const handleToggleProcessType = (type) => {
    setProcessType(type);
  };

  // Add stage (up to 8)
  const handleAddTankStage = () => {
    if (tankStages.length >= 8) return;
    const nextIndex = tankStages.length + 1;
    const lastStage = tankStages[tankStages.length - 1];
    const newStage = {
      tank_index: nextIndex,
      solution_au_ppm: Math.max(0.01, Number((lastStage.solution_au_ppm * 0.4).toFixed(3))),
      carbon_load_au_gt: Math.max(50, Math.round(lastStage.carbon_load_au_gt * 0.5)),
      carbon_density_gl: Math.max(10.0, Number((lastStage.carbon_density_gl - 0.5).toFixed(1))),
      fouling_factor_alpha: 0.98,
    };
    setTankStages([...tankStages, newStage]);
  };

  // Remove stage (minimum 2)
  const handleRemoveTankStage = () => {
    if (tankStages.length <= 2) return;
    const updated = tankStages.slice(0, tankStages.length - 1);
    setTankStages(updated);
    if (selectedStageIndex > updated.length) {
      setSelectedStageIndex(updated.length);
    }
  };

  // Change individual stage attribute
  const handleChangeTankStage = (stageIdx, field, val) => {
    const updated = [...tankStages];
    updated[stageIdx] = {
      ...updated[stageIdx],
      [field]: val,
    };
    setTankStages(updated);
  };

  // Change global metrics
  const handleChangeGlobalMetric = (field, val) => {
    setGlobalMetrics((prev) => ({ ...prev, [field]: val }));
  };

  // Change mineralogy assay
  const handleChangeMineralogyAssay = (field, val) => {
    setMineralogyAssay((prev) => ({ ...prev, [field]: val }));
  };

  // Construct current outbound payload for POST /api/v2/telemetry
  const buildPayload = () => ({
    circuit_id: circuitId,
    process_type: processType,
    timestamp: new Date().toISOString(),
    global_metrics: {
      slurry_flow_rate_m3_h: Number(globalMetrics.slurry_flow_rate_m3_h),
      slurry_density_pct: Number(globalMetrics.slurry_density_pct),
      slurry_ph: Number(globalMetrics.slurry_ph),
      carbon_advance_rate_tons_h: Number(globalMetrics.carbon_advance_rate_tons_h),
    },
    mineralogy_assay: {
      head_grade_au_gt: Number(mineralogyAssay.head_grade_au_gt),
      sulfur_pct: Number(mineralogyAssay.sulfur_pct),
      copper_pct: Number(mineralogyAssay.copper_pct),
      arsenic_pct: Number(mineralogyAssay.arsenic_pct),
      target_ph: Number(mineralogyAssay.target_ph),
      target_free_cyanide_ppm: Number(mineralogyAssay.target_free_cyanide_ppm),
    },
    tank_stages: tankStages.map((stage) => ({
      tank_index: Number(stage.tank_index),
      solution_au_ppm: Number(stage.solution_au_ppm),
      carbon_load_au_gt: Number(stage.carbon_load_au_gt),
      carbon_density_gl: Number(stage.carbon_density_gl),
      fouling_factor_alpha: Number(stage.fouling_factor_alpha),
    })),
  });

  // Submit telemetry to backend POST /api/v2/telemetry
  const handleSubmitTelemetry = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    const payload = buildPayload();

    try {
      const response = await submitTelemetry(payload);
      setOptimizationResult(response);
      setHistory((prev) => [
        {
          id: response.telemetry_id || Date.now(),
          time: new Date().toLocaleTimeString(),
          circuit: response.circuit_id,
          recovery: response.carbon_adsorption_recommendations?.predicted_circuit_recovery_pct,
          advance: response.carbon_adsorption_recommendations?.recommended_carbon_advance_rate_tons_h,
          goldOz: response.projected_production_yield?.estimated_daily_gold_production_troy_oz,
          payload,
          result: response,
          stages: JSON.parse(JSON.stringify(tankStages)),
        },
        ...prev.slice(0, 9),
      ]);
      // Transition automatically to the Dashboard page upon success
      setCurrentPage('dashboard');
    } catch (err) {
      setErrorMessage(`Telemetry ingestion failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formData = {
    circuit_id: circuitId,
    process_type: processType,
    global_metrics: globalMetrics,
    mineralogy_assay: mineralogyAssay,
    tank_stages: tankStages,
  };

  const recDensities =
    optimizationResult?.carbon_adsorption_recommendations?.recommended_tank_carbon_densities_gl;

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('cip_logged_user');
    } catch (e) {
      // ignore
    }
    setCurrentUser(null);
  };

  const handleLoadHistoricalIntoDashboard = (detail) => {
    setOptimizationResult(detail);
    if (detail.circuit_id) setCircuitId(detail.circuit_id);
    if (detail.process_type) setProcessType(detail.process_type);
    if (detail.stages) setTankStages(detail.stages);
    if (detail.global_metrics) setGlobalMetrics({ ...detail.global_metrics });
    setCurrentPage('dashboard');
  };

  const handleLoadHistoricalIntoIngest = (item) => {
    if (item.circuit_id) setCircuitId(item.circuit_id);
    if (item.circuit_id.includes('CIL')) setProcessType('CIL');
    else setProcessType('CIP');
    if (item.slurry_flow_rate_m3_h !== undefined) {
      setGlobalMetrics({
        slurry_flow_rate_m3_h: item.slurry_flow_rate_m3_h,
        slurry_density_pct: item.slurry_density_pct,
        slurry_ph: item.slurry_ph,
        carbon_advance_rate_tons_h: item.carbon_advance_rate_tons_h,
      });
    }
    if (item.stages && item.stages.length) {
      setTankStages(JSON.parse(JSON.stringify(item.stages)));
    }
    setCurrentPage('ingest');
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#080C16" />

      {/* Top Console Navigation & Header */}
      <Header
        currentPage={currentPage}
        onNavigatePage={setCurrentPage}
        hasResults={Boolean(optimizationResult)}
        circuitId={circuitId}
        processType={processType}
        apiHealth={apiHealth}
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        onToggleProcessType={handleToggleProcessType}
        onOpenRawJson={() => setModalVisible(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Body Content */}
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
      >
        {/* Error notification banner */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorIcon}>⚠</Text>
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorTitle}>TELEMETRY TRANSMISSION ERROR</Text>
              <Text style={styles.errorSubtitle}>{errorMessage}</Text>
            </View>
          </View>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.cyanBright} />
            <Text style={styles.loadingText}>SOLVING NON-LINEAR CARBON ADSORPTION & MASS BALANCE...</Text>
            <Text style={styles.loadingSub}>Executing scipy SLSQP & kinetic differential solver via FastAPI</Text>
          </View>
        )}

        {/* PAGE 1: INGEST TELEMETRY */}
        {currentPage === 'ingest' && (
          <View style={styles.pageSection}>
            {/* Quick jump to dashboard banner if results exist */}
            {optimizationResult && !isLoading && (
              <View style={styles.resultNoticeBanner}>
                <View style={styles.resultNoticeLeft}>
                  <Text style={styles.resultNoticeDot}>●</Text>
                  <Text style={styles.resultNoticeTitle}>
                    ACTIVE OPTIMIZATION RESULT AVAILABLE FOR {optimizationResult.circuit_id}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.resultNoticeBtn}
                  onPress={() => setCurrentPage('dashboard')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resultNoticeBtnText}>VIEW FULL DASHBOARD ➔</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Countercurrent Contact Train Visualizer */}
            <TankStageVisualizer
              stages={tankStages}
              recommendedDensities={recDensities}
              selectedStageIndex={selectedStageIndex}
              onSelectStage={setSelectedStageIndex}
              processType={processType}
            />

            {/* Form Input Section */}
            <TelemetryForm
              formData={formData}
              onChangeField={(f, v) => f === 'circuit_id' && setCircuitId(v)}
              onChangeGlobalMetric={handleChangeGlobalMetric}
              onChangeMineralogyAssay={handleChangeMineralogyAssay}
              onChangeTankStage={handleChangeTankStage}
              onAddTankStage={handleAddTankStage}
              onRemoveTankStage={handleRemoveTankStage}
              onSubmit={handleSubmitTelemetry}
              isLoading={isLoading}
              selectedStageIndex={selectedStageIndex}
              onSelectStage={setSelectedStageIndex}
            />
          </View>
        )}

        {/* PAGE 2: OPTIMIZATION DASHBOARD */}
        {currentPage === 'dashboard' && (
          <DashboardPage
            result={optimizationResult}
            currentStages={tankStages}
            processType={processType}
            selectedStageIndex={selectedStageIndex}
            onSelectStage={setSelectedStageIndex}
            onNavigateToIngest={() => setCurrentPage('ingest')}
            onOpenRawJson={() => setModalVisible(true)}
            history={history}
            onSelectHistoryItem={(item) => {
              setOptimizationResult(item.result);
              if (item.stages) setTankStages(item.stages);
            }}
          />
        )}

        {/* PAGE 3: HISTORICAL DATA */}
        {currentPage === 'history' && (
          <HistoricalDataPage
            onLoadIntoDashboard={handleLoadHistoricalIntoDashboard}
            onLoadIntoIngest={handleLoadHistoricalIntoIngest}
            onOpenRawJson={() => setModalVisible(true)}
          />
        )}
      </ScrollView>

      {/* JSON Inspector Modal */}
      <RawJsonModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        requestPayload={buildPayload()}
        responseData={optimizationResult}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 40,
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  pageSection: {
    gap: 12,
  },
  resultNoticeBanner: {
    backgroundColor: '#0A172A',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  resultNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultNoticeDot: {
    color: colors.emeraldBright,
    fontSize: 14,
  },
  resultNoticeTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  resultNoticeBtn: {
    backgroundColor: colors.emeraldPrimary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
  },
  resultNoticeBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: typography.fontFamilyMono,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.rosePrimary,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  errorIcon: {
    color: colors.roseBright,
    fontSize: 20,
    fontWeight: '800',
  },
  errorTextContainer: {
    flex: 1,
  },
  errorTitle: {
    color: colors.roseBright,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: typography.fontFamilyHeading,
  },
  errorSubtitle: {
    color: colors.textPrimary,
    fontSize: 11,
    marginTop: 2,
    fontFamily: typography.fontFamilyMono,
  },
  loadingContainer: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 12,
  },
  loadingText: {
    color: colors.cyanBright,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: typography.fontFamilyMono,
  },
  loadingSub: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: typography.fontFamilyBody,
  },
});
