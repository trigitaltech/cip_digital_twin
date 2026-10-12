import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, shadows } from '../styles/theme';
import { PRESETS } from '../api/telemetryApi';

export default function Header({
  currentPage,
  onNavigatePage,
  hasResults,
  circuitId,
  processType,
  apiHealth,
  activePresetId,
  onSelectPreset,
  onToggleProcessType,
  onOpenRawJson,
  currentUser,
  onLogout,
}) {
  const isHealthy = apiHealth?.status === 'online';

  return (
    <View style={styles.headerContainer}>
      {/* Top Row: Brand, Main Nav Tabs & Inspector */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>Au</Text>
            <Text style={styles.logoBadgeSub}>79</Text>
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitle}>CIP / CIL DIGITAL TWIN</Text>
              <View style={[styles.statusBadge, isHealthy ? styles.statusBadgeOnline : styles.statusBadgeConnecting]}>
                <View style={[styles.statusDot, isHealthy ? styles.statusDotOnline : styles.statusDotConnecting]} />
                <Text style={styles.statusText}>
                  {isHealthy ? 'ENGINE ONLINE' : 'CHECKING ENGINE'}
                </Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle}>
              Metallurgical Telemetry & Multi-Stage Carbon Adsorption Kinetics Console
            </Text>
          </View>
        </View>

        {/* Primary Page Navigation Tabs */}
        <View style={styles.navTabs}>
          <TouchableOpacity
            style={[styles.navTab, currentPage === 'ingest' && styles.navTabActive]}
            onPress={() => onNavigatePage('ingest')}
            activeOpacity={0.8}
          >
            <Text style={[styles.navTabText, currentPage === 'ingest' && styles.navTabTextActive]}>
              📡 INGEST TELEMETRY
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, currentPage === 'dashboard' && styles.navTabActive]}
            onPress={() => onNavigatePage('dashboard')}
            activeOpacity={0.8}
          >
            <Text style={[styles.navTabText, currentPage === 'dashboard' && styles.navTabTextActive]}>
              📊 OPTIMIZATION DASHBOARD
            </Text>
            {hasResults && (
              <View style={styles.resultsBadge}>
                <Text style={styles.resultsBadgeText}>LIVE</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, currentPage === 'history' && styles.navTabActive]}
            onPress={() => onNavigatePage('history')}
            activeOpacity={0.8}
          >
            <Text style={[styles.navTabText, currentPage === 'history' && styles.navTabTextActive]}>
              📜 HISTORICAL DATA
            </Text>
          </TouchableOpacity>
        </View>

        {/* Inspector Button & Operator Profile */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.inspectButton}
            onPress={onOpenRawJson}
            activeOpacity={0.7}
          >
            <Text style={styles.inspectButtonText}>{'< / >'} JSON Inspector</Text>
          </TouchableOpacity>

          {currentUser && (
            <View style={styles.userBadge}>
              <Text style={styles.userAvatar}>{currentUser.avatar || '👤'}</Text>
              <View style={styles.userInfo}>
                <View style={styles.userNameRow}>
                  <Text style={styles.userName}>{currentUser.displayName || currentUser.username}</Text>
                  <View style={[styles.userRoleTag, { borderColor: currentUser.badgeColor || colors.goldPrimary }]}>
                    <Text style={[styles.userRoleText, { color: currentUser.badgeColor || colors.goldBright }]}>
                      {currentUser.role}
                    </Text>
                  </View>
                </View>
                <Text style={styles.userShift}>{currentUser.activeShift || currentUser.shift || 'Shift A (Day)'}</Text>
              </View>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={onLogout}
                activeOpacity={0.7}
              >
                <Text style={styles.logoutButtonText}>🔒 Lock</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Secondary Bar: Contextual Controls */}
      <View style={styles.selectorBar}>
        <View style={styles.selectorGroup}>
          <Text style={styles.selectorLabel}>PROCESS TYPE:</Text>
          <View style={styles.pillGroup}>
            {['CIP', 'CIL'].map((type) => {
              const active = processType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.pill, active && styles.pillActiveCyan]}
                  onPress={() => onToggleProcessType(type)}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{type}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.selectorGroup}>
          <Text style={styles.selectorLabel}>ACTIVE CIRCUIT:</Text>
          <View style={styles.circuitBadge}>
            <Text style={styles.circuitBadgeText}>{circuitId}</Text>
          </View>
        </View>

        {/* Presets (primarily visible/relevant during configuration) */}
        <View style={styles.presetGroup}>
          <Text style={styles.selectorLabel}>METALLURGY PRESETS:</Text>
          <View style={styles.presetButtons}>
            {PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.presetButton, isSelected && styles.presetButtonActive]}
                  onPress={() => onSelectPreset(preset)}
                >
                  <Text style={[styles.presetButtonText, isSelected && styles.presetButtonTextActive]}>
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 14,
    ...shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1E1B18',
    borderWidth: 1.5,
    borderColor: colors.goldPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadgeText: {
    color: colors.goldBright,
    fontWeight: '800',
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamilyHeading,
  },
  logoBadgeSub: {
    color: colors.goldDark,
    fontSize: 10,
    fontWeight: '700',
    marginTop: -2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: typography.fontFamilyHeading,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusBadgeOnline: {
    backgroundColor: colors.emeraldSubtle,
    borderWidth: 1,
    borderColor: colors.emeraldPrimary,
  },
  statusBadgeConnecting: {
    backgroundColor: colors.cyanSubtle,
    borderWidth: 1,
    borderColor: colors.cyanPrimary,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotOnline: {
    backgroundColor: colors.emeraldBright,
  },
  statusDotConnecting: {
    backgroundColor: colors.cyanBright,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: typography.fontFamilyMono,
  },
  brandSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontFamily: typography.fontFamilyBody,
  },
  navTabs: {
    flexDirection: 'row',
    backgroundColor: '#090E1A',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    gap: 4,
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  navTabActive: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: colors.cyanPrimary,
    ...shadows.glowCyan,
  },
  navTabText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
    letterSpacing: 0.5,
  },
  navTabTextActive: {
    color: colors.cyanBright,
    fontWeight: '800',
  },
  resultsBadge: {
    backgroundColor: colors.emeraldPrimary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  resultsBadgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
    fontFamily: typography.fontFamilyMono,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inspectButton: {
    backgroundColor: colors.bgCardSubtle,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  inspectButtonText: {
    color: colors.cyanBright,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMono,
  },
  selectorBar: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  selectorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  pillGroup: {
    flexDirection: 'row',
    backgroundColor: colors.bgInput,
    borderRadius: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pillActiveCyan: {
    backgroundColor: colors.cyanDark,
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  pillTextActive: {
    color: colors.textWhite,
  },
  circuitBadge: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  circuitBadgeText: {
    color: colors.goldBright,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  presetGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  presetButton: {
    backgroundColor: colors.bgCardSubtle,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  presetButtonActive: {
    borderColor: colors.goldPrimary,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  presetButtonText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  presetButtonTextActive: {
    color: colors.goldBright,
    fontWeight: '700',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090E1A',
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 8,
  },
  userAvatar: {
    fontSize: 16,
  },
  userInfo: {
    gap: 2,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.fontFamilyHeading,
  },
  userRoleTag: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    backgroundColor: '#0F172A',
  },
  userRoleText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  userShift: {
    color: colors.textMuted,
    fontSize: 9.5,
    fontFamily: typography.fontFamilyMono,
  },
  logoutButton: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: colors.rosePrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 4,
  },
  logoutButtonText: {
    color: colors.roseBright,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
});
