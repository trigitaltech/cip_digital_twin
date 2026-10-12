import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { colors, typography, shadows } from '../styles/theme';

export const STATIC_ACCOUNTS = [
  {
    username: 'metallurgist',
    password: 'aurum79',
    displayName: 'Dr. Elena Vance',
    role: 'Lead Metallurgist',
    clearance: 'Level 4 • Optimization & Kinetics',
    badgeColor: '#F59E0B',
    avatar: '⚗️',
    shift: 'Shift A (Day)',
    station: 'CIRCUIT-OPT-01',
  },
  {
    username: 'operator',
    password: 'cip2026',
    displayName: 'Marcus Thorne',
    role: 'Plant Control Operator',
    clearance: 'Level 2 • Slurry & Carbon Control',
    badgeColor: '#06B6D4',
    avatar: '⚙️',
    shift: 'Shift A (Day)',
    station: 'MILL-CONTROL-04',
  },
  {
    username: 'admin',
    password: 'goldmine',
    displayName: 'Chief Superintendent Ross',
    role: 'SCADA Mine Superintendent',
    clearance: 'Level 5 • Full Supervisory Override',
    badgeColor: '#10B981',
    avatar: '🛡️',
    shift: 'General Operations',
    station: 'SUPERVISORY-MAIN',
  },
];

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('metallurgist');
  const [password, setPassword] = useState('aurum79');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedShift, setSelectedShift] = useState('Shift A (06:00 - 14:00 Day)');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeAccountPill, setActiveAccountPill] = useState('metallurgist');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectDemoAccount = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setActiveAccountPill(acc.username);
    setErrorMessage(null);
  };

  const handleLogin = () => {
    setErrorMessage(null);

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setErrorMessage('Please enter both Operator ID and Passkey.');
      return;
    }

    setIsLoading(true);

    // Simulate SCADA authentication handshake
    setTimeout(() => {
      // Find matching static account
      const matched = STATIC_ACCOUNTS.find(
        (acc) => acc.username.toLowerCase() === trimmedUser && acc.password === trimmedPass
      );

      // Also allow common defaults
      let userObj = matched;
      if (!userObj && (trimmedUser === 'admin' || trimmedUser === 'operator') && trimmedPass === 'password') {
        userObj = {
          username: trimmedUser,
          displayName: trimmedUser === 'admin' ? 'System Administrator' : 'Mill Operator',
          role: 'Operations Personnel',
          clearance: 'Level 3 • Standard Access',
          badgeColor: '#38BDF8',
          avatar: '👤',
          shift: selectedShift,
          station: 'DESK-CONSOLE-02',
        };
      }

      if (userObj) {
        setIsLoading(false);
        const sessionUser = {
          ...userObj,
          activeShift: selectedShift,
          loginTimestamp: new Date().toISOString(),
        };
        if (rememberMe) {
          try {
            localStorage.setItem('cip_logged_user', JSON.stringify(sessionUser));
          } catch (e) {
            // Ignore storage errors in restrictive environments
          }
        }
        onLoginSuccess(sessionUser);
      } else {
        setIsLoading(false);
        setErrorMessage(
          'Invalid Gold Mine SCADA credentials. Please select one of the authorized accounts above or check your operator key.'
        );
      }
    }, 600);
  };

  return (
    <ScrollView
      style={styles.scrollRoot}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
      persistentScrollbar={true}
    >
      <View style={styles.container}>
        {/* Background Graphic with Vignette & Dark Tint */}
        <View style={styles.bgImageContainer}>
          <Image
            source={{ uri: '/gold_mine_twin.jpg' }}
            style={styles.bgImage}
            resizeMode="cover"
          />
          <View style={styles.bgOverlayGradient} />
        </View>

        {/* Main Authentication Split Container */}
        <View style={styles.mainWrapper}>
          {/* LEFT HERO / OPERATIONS INTEL PANEL */}
          <View style={styles.heroPanel}>
            {/* Top Status Chip */}
            <View style={styles.heroHeader}>
              <View style={styles.pulseDot} />
              <Text style={styles.heroStatusText}>AURUM SCADA TELEMETRY • LIVE TWIN ENGINE</Text>
              <View style={styles.timeTag}>
                <Text style={styles.timeTagText}>{currentTime}</Text>
              </View>
            </View>

            {/* Elemental Au 79 Insignia */}
            <View style={styles.brandHeroBlock}>
              <View style={styles.goldElementBox}>
                <View style={styles.elementTopRow}>
                  <Text style={styles.elementAtomicNum}>79</Text>
                  <Text style={styles.elementMass}>196.967</Text>
                </View>
                <Text style={styles.elementSymbol}>Au</Text>
                <Text style={styles.elementName}>AURUM</Text>
                <Text style={styles.elementSub}>GOLD EXTRACTION</Text>
              </View>

              <View style={styles.brandTextGroup}>
                <Text style={styles.brandMainTitle}>CIP / CIL DIGITAL TWIN</Text>
                <Text style={styles.brandTagline}>
                  Carbon-In-Pulp Circuit Simulation & Real-Time Kinetic Optimization Platform
                </Text>
                <View style={styles.facilityPill}>
                  <Text style={styles.facilityText}>📍 Super Pit Mine • Train Line 02</Text>
                </View>
              </View>
            </View>

            {/* Live Circuit Telemetry Ticker Cards */}
            <View style={styles.telemetryStrip}>
              <Text style={styles.telemetrySectionTitle}>ACTIVE CIRCUIT BENCHMARK READINGS</Text>
              <View style={styles.telemetryGrid}>
                <View style={styles.telemetryCard}>
                  <Text style={styles.telemetryLabel}>HEAD GRADE (Au)</Text>
                  <Text style={[styles.telemetryValue, { color: colors.goldBright }]}>2.85 g/t</Text>
                  <Text style={styles.telemetrySub}>Ore Feed XRF Assay</Text>
                </View>

                <View style={styles.telemetryCard}>
                  <Text style={styles.telemetryLabel}>SLURRY FEED RATE</Text>
                  <Text style={[styles.telemetryValue, { color: colors.cyanBright }]}>350.0 m³/h</Text>
                  <Text style={styles.telemetrySub}>159.9 t/h Dry Ore</Text>
                </View>

                <View style={styles.telemetryCard}>
                  <Text style={styles.telemetryLabel}>CIRCUIT RECOVERY</Text>
                  <Text style={[styles.telemetryValue, { color: colors.emeraldBright }]}>94.2 %</Text>
                  <Text style={styles.telemetrySub}>Predicted 95.8% Peak</Text>
                </View>

                <View style={styles.telemetryCard}>
                  <Text style={styles.telemetryLabel}>CARBON TRAIN</Text>
                  <Text style={[styles.telemetryValue, { color: '#E2E8F0' }]}>6 Tanks</Text>
                  <Text style={styles.telemetrySub}>Countercurrent C-Advance</Text>
                </View>
              </View>
            </View>

            {/* Security & System Architecture Compliance */}
            <View style={styles.complianceFooter}>
              <View style={styles.complianceItem}>
                <Text style={styles.complianceCheck}>✓</Text>
                <Text style={styles.complianceText}>SciPy SLSQP Adsorption Non-Linear Optimizer v2.4</Text>
              </View>
              <View style={styles.complianceItem}>
                <Text style={styles.complianceCheck}>✓</Text>
                <Text style={styles.complianceText}>FastAPI High-Speed Ingestion & ORM Persistence</Text>
              </View>
              <View style={styles.complianceItem}>
                <Text style={styles.complianceCheck}>✓</Text>
                <Text style={styles.complianceText}>SCADA SIL-2 / Reagent Dosing Closed-Loop Safety</Text>
              </View>
            </View>
          </View>

          {/* RIGHT AUTHENTICATION CARD */}
          <View style={styles.authCard}>
            {/* Card Header */}
            <View style={styles.authHeader}>
              <View style={styles.authBadgeRow}>
                <View style={styles.lockIconContainer}>
                  <Text style={styles.lockIcon}>🔐</Text>
                </View>
                <View>
                  <Text style={styles.authTitle}>OPERATOR LOGIN</Text>
                  <Text style={styles.authSubtitle}>Authorized Metallurgical Personnel Only</Text>
                </View>
              </View>
            </View>

            {/* Quick Demo Fill Accounts Bar */}
            <View style={styles.demoAccountsSection}>
              <Text style={styles.demoSectionLabel}>QUICK CLEARANCE PROFILES (CLICK TO PREFILL):</Text>
              <View style={styles.demoButtonsRow}>
                {STATIC_ACCOUNTS.map((acc) => {
                  const isActive = activeAccountPill === acc.username;
                  return (
                    <TouchableOpacity
                      key={acc.username}
                      style={[
                        styles.demoPill,
                        isActive && {
                          borderColor: acc.badgeColor,
                          backgroundColor: `${acc.badgeColor}22`,
                        },
                      ]}
                      onPress={() => handleSelectDemoAccount(acc)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.demoPillAvatar}>{acc.avatar}</Text>
                      <View style={styles.demoPillTextCol}>
                        <Text
                          style={[
                            styles.demoPillTitle,
                            isActive && { color: acc.badgeColor, fontWeight: '700' },
                          ]}
                        >
                          {acc.role}
                        </Text>
                        <Text style={styles.demoPillCreds}>
                          {acc.username} / {acc.password}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Error Banner */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorMessageText}>{errorMessage}</Text>
              </View>
            )}

            {/* Form Inputs */}
            <View style={styles.formFields}>
              {/* Username Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>OPERATOR ID / USERNAME</Text>
                  <Text style={styles.requiredMark}>*</Text>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputPrefixIcon}>👤</Text>
                  <TextInput
                    style={styles.textInput}
                    value={username}
                    onChangeText={(val) => {
                      setUsername(val);
                      setActiveAccountPill('');
                    }}
                    placeholder="e.g. metallurgist"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {username.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setUsername('')}
                      style={styles.clearBtn}
                    >
                      <Text style={styles.clearBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>SECURITY PASSKEY</Text>
                  <Text style={styles.requiredMark}>*</Text>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputPrefixIcon}>🔑</Text>
                  <TextInput
                    style={styles.textInput}
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      setActiveAccountPill('');
                    }}
                    placeholder="Enter security passkey"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.togglePasswordBtn}
                  >
                    <Text style={styles.togglePasswordText}>
                      {showPassword ? '👁️ HIDE' : '👁️ SHOW'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Active Shift Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>OPERATIONAL SHIFT ASSIGNMENT</Text>
                <View style={styles.shiftPillRow}>
                  {[
                    'Shift A (06:00 - 14:00 Day)',
                    'Shift B (14:00 - 22:00 Swing)',
                    'Shift C (22:00 - 06:00 Night)',
                  ].map((shiftName) => {
                    const isSelected = selectedShift === shiftName;
                    return (
                      <TouchableOpacity
                        key={shiftName}
                        style={[
                          styles.shiftPill,
                          isSelected && styles.shiftPillActive,
                        ]}
                        onPress={() => setSelectedShift(shiftName)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.shiftPillText,
                            isSelected && styles.shiftPillTextActive,
                          ]}
                        >
                          {shiftName.split(' ')[0]} {shiftName.split(' ')[1]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Remember Me Option */}
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxChecked,
                  ]}
                >
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rememberText}>
                  Remember authorized session on this supervisory terminal
                </Text>
              </TouchableOpacity>

              {/* Submit / Sign-In Button */}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  isLoading && styles.submitBtnDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#0B0F19" />
                    <Text style={styles.submitBtnLoadingText}>
                      VERIFYING SCADA CLEARANCE & PROTOCOLS...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.btnContentRow}>
                    <Text style={styles.submitBtnIcon}>⚡</Text>
                    <Text style={styles.submitBtnText}>
                      ACCESS OPERATIONS CONSOLE
                    </Text>
                    <Text style={styles.submitBtnArrow}>➔</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Security & Credentials Cheat Footer */}
            <View style={styles.cardFooter}>
              <View style={styles.footerSecurityTag}>
                <Text style={styles.securityShieldIcon}>🛡️</Text>
                <Text style={styles.securityTagText}>
                  256-BIT ENCRYPTED SCADA SESSION • HOST: 127.0.0.1:8000
                </Text>
              </View>
              <Text style={styles.footerNotice}>
                Station: CONSOLE-PERTH-04 • Ore Feed Circuit CIP-02 • ISO 27001 Compliant
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollRoot: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#070A12',
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  container: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: '#070A12',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  bgImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  bgImage: {
    width: '100%',
    height: '100%',
    opacity: 0.28,
  },
  bgOverlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 10, 18, 0.88)',
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 1240,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    backgroundColor: 'rgba(12, 18, 32, 0.92)',
    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 35px rgba(245, 158, 11, 0.12)',
    zIndex: 10,
  },
  /* LEFT HERO PANEL */
  heroPanel: {
    flexGrow: 1,
    flexBasis: 520,
    padding: 36,
    backgroundColor: 'rgba(9, 14, 25, 0.95)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(30, 41, 59, 0.8)',
    justifyContent: 'space-between',
    gap: 28,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.emeraldBright,
    boxShadow: '0 0 8px #10B981',
  },
  heroStatusText: {
    color: colors.emeraldBright,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: typography.fontFamilyMono,
  },
  timeTag: {
    marginLeft: 'auto',
    backgroundColor: '#0F1A30',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  timeTagText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: typography.fontFamilyMono,
  },
  brandHeroBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    flexWrap: 'wrap',
  },
  goldElementBox: {
    width: 118,
    height: 124,
    borderRadius: 14,
    backgroundColor: '#16190D',
    borderWidth: 2,
    borderColor: colors.goldPrimary,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 0 24px rgba(245, 158, 11, 0.25)',
  },
  elementTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  elementAtomicNum: {
    color: colors.goldBright,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: typography.fontFamilyMono,
  },
  elementMass: {
    color: '#D97706',
    fontSize: 9,
    fontFamily: typography.fontFamilyMono,
  },
  elementSymbol: {
    color: colors.goldBright,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
    fontFamily: typography.fontFamilyHeading,
  },
  elementName: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: typography.fontFamilyHeading,
  },
  elementSub: {
    color: colors.goldDark,
    fontSize: 7.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  brandTextGroup: {
    flex: 1,
    minWidth: 260,
  },
  brandMainTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: typography.fontFamilyHeading,
  },
  brandTagline: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    fontFamily: typography.fontFamilyBody,
  },
  facilityPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  facilityText: {
    color: colors.goldBright,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMono,
  },
  telemetryStrip: {
    backgroundColor: '#0B1120',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 16,
    gap: 12,
  },
  telemetrySectionTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: typography.fontFamilyMono,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  telemetryCard: {
    flexGrow: 1,
    flexBasis: 100,
    backgroundColor: '#080C16',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 8,
    padding: 10,
  },
  telemetryLabel: {
    color: colors.textMuted,
    fontSize: 9.5,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMono,
  },
  telemetryValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
    fontFamily: typography.fontFamilyHeading,
  },
  telemetrySub: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
    fontFamily: typography.fontFamilyBody,
  },
  complianceFooter: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 16,
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  complianceCheck: {
    color: colors.emeraldBright,
    fontSize: 11,
    fontWeight: '800',
  },
  complianceText: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: typography.fontFamilyMono,
  },

  /* RIGHT AUTHENTICATION CARD */
  authCard: {
    flexGrow: 1,
    flexBasis: 480,
    padding: 36,
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    justifyContent: 'space-between',
    gap: 20,
  },
  authHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.8)',
    paddingBottom: 16,
  },
  authBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  lockIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: colors.goldPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 22,
  },
  authTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: typography.fontFamilyHeading,
  },
  authSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontFamily: typography.fontFamilyBody,
  },
  /* DEMO PROFILES */
  demoAccountsSection: {
    gap: 8,
  },
  demoSectionLabel: {
    color: colors.goldBright,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: typography.fontFamilyMono,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoPill: {
    flexGrow: 1,
    flexBasis: 140,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  demoPillAvatar: {
    fontSize: 16,
  },
  demoPillTextCol: {
    flex: 1,
  },
  demoPillTitle: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: typography.fontFamilyHeading,
  },
  demoPillCreds: {
    color: colors.textMuted,
    fontSize: 9.5,
    marginTop: 2,
    fontFamily: typography.fontFamilyMono,
  },
  /* ERROR BOX */
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
  errorMessageText: {
    color: colors.roseBright,
    fontSize: 11.5,
    flex: 1,
    lineHeight: 16,
    fontFamily: typography.fontFamilyMono,
  },
  /* FORM FIELDS */
  formFields: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: typography.fontFamilyMono,
  },
  requiredMark: {
    color: colors.goldBright,
    fontSize: 12,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090E1A',
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  inputPrefixIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: 42,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: typography.fontFamilyMono,
    outlineStyle: 'none',
  },
  clearBtn: {
    padding: 6,
  },
  clearBtnText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  togglePasswordBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#1E293B',
    borderRadius: 4,
  },
  togglePasswordText: {
    color: colors.goldBright,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  shiftPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shiftPill: {
    flexGrow: 1,
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  shiftPillActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: colors.cyanBright,
  },
  shiftPillText: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: typography.fontFamilyMono,
  },
  shiftPillTextActive: {
    color: colors.cyanBright,
    fontWeight: '700',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    backgroundColor: '#090E1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.goldPrimary,
    borderColor: colors.goldBright,
  },
  checkmark: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
  },
  rememberText: {
    color: colors.textSecondary,
    fontSize: 11.5,
    fontFamily: typography.fontFamilyBody,
  },
  /* SUBMIT BUTTON */
  submitBtn: {
    backgroundColor: colors.goldPrimary,
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    boxShadow: '0 4px 18px rgba(245, 158, 11, 0.35)',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitBtnIcon: {
    fontSize: 15,
  },
  submitBtnText: {
    color: '#070A12',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: typography.fontFamilyHeading,
  },
  submitBtnArrow: {
    color: '#070A12',
    fontSize: 15,
    fontWeight: '900',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitBtnLoadingText: {
    color: '#070A12',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: typography.fontFamilyMono,
  },
  /* FOOTER */
  cardFooter: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.8)',
    paddingTop: 16,
    alignItems: 'center',
  },
  footerSecurityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  securityShieldIcon: {
    fontSize: 12,
  },
  securityTagText: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.6,
    fontFamily: typography.fontFamilyMono,
  },
  footerNotice: {
    color: '#475569',
    fontSize: 9.5,
    textAlign: 'center',
    fontFamily: typography.fontFamilyMono,
  },
});
