import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { colors, typography } from '../styles/theme';

export default function RawJsonModal({ visible, onClose, requestPayload, responseData }) {
  const [activeTab, setActiveTab] = useState('request'); // 'request' | 'response'
  const [copied, setCopied] = useState(false);

  const jsonToShow = activeTab === 'request' ? requestPayload : responseData;
  const jsonString = JSON.stringify(jsonToShow || {}, null, 2);

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.titleInfo}>
              <Text style={styles.title}>API TELEMETRY PAYLOAD INSPECTOR</Text>
              <Text style={styles.subtitle}>POST /api/v2/telemetry payload & response audit</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tab selector */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'request' && styles.tabActive]}
              onPress={() => setActiveTab('request')}
            >
              <Text style={[styles.tabText, activeTab === 'request' && styles.tabTextActive]}>
                REQUEST PAYLOAD (OUTBOUND)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'response' && styles.tabActive]}
              onPress={() => setActiveTab('response')}
            >
              <Text style={[styles.tabText, activeTab === 'response' && styles.tabTextActive]}>
                API RESPONSE (INBOUND)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              <Text style={styles.copyBtnText}>{copied ? 'COPIED!' : 'COPY JSON'}</Text>
            </TouchableOpacity>
          </View>

          {/* Code Viewer */}
          <ScrollView style={styles.codeContainer}>
            <Text style={styles.codeText}>{jsonString}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 16, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 850,
    height: '80%',
    backgroundColor: '#0A0F1D',
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: '#0E1626',
  },
  titleInfo: {
    gap: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    fontFamily: typography.fontFamilyHeading,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: typography.fontFamilyMono,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#090D18',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: 12,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  tabTextActive: {
    color: colors.cyanBright,
  },
  copyBtn: {
    marginLeft: 'auto',
    backgroundColor: colors.bgCardSubtle,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  copyBtnText: {
    color: colors.goldBright,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: typography.fontFamilyMono,
  },
  codeContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#070A12',
  },
  codeText: {
    color: '#38BDF8',
    fontFamily: typography.fontFamilyMono,
    fontSize: 11.5,
    lineHeight: 18,
  },
});
