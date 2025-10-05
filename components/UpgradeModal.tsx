import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { purchaseWeeklySubscription } from '../services/purchaseService';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  messageLimit: number;
  resetDate: string;
}

export default function UpgradeModal({ visible, onClose, messageLimit, resetDate }: UpgradeModalProps) {
  const { t, language } = useLanguage();
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  // Currency conversion: $2.99 USD ≈ 280 Albanian Lek
  const getPrice = () => {
    if (language === 'Albanian') {
      return { amount: '280', currency: 'Lek', period: '/javë' };
    }
    return { amount: '2.99', currency: '$', period: '/week' };
  };
  
  const price = getPrice();
  
  const handleUpgrade = async () => {
    setIsPurchasing(true);
    
    try {
      console.log('[UPGRADE_MODAL] Initiating purchase...');
      const success = await purchaseWeeklySubscription();
      
      if (success) {
        console.log('[UPGRADE_MODAL] Purchase initiated successfully');
        // Don't close modal yet - wait for purchase listener to confirm
      } else {
        console.log('[UPGRADE_MODAL] Purchase was not completed');
        setIsPurchasing(false);
      }
    } catch (error: any) {
      console.error('[UPGRADE_MODAL] Purchase error:', error);
      Alert.alert(t('Error'), 'Unable to process payment. Please try again.');
      setIsPurchasing(false);
    }
  };

  // Format reset date
  const formatResetDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    } catch {
      return 'Next Monday';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="chatbubbles" size={48} color="#6B5B95" />
            </View>
          </View>

          <Text style={styles.modalTitle}>{t("You've Reached Your Free Limit")}</Text>
          <Text style={styles.modalSubtitle}>
            {t("You've used all")} {messageLimit} {t("free requests this week.")}
          </Text>

          <View style={styles.resetContainer}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.resetText}>
              {t("Free requests reset on")} {formatResetDate(resetDate)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.premiumSection}>
            <Text style={styles.premiumTitle}>{t("Go Premium for Unlimited Access")}</Text>
            
            <View style={styles.featuresContainer}>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>{t("Unlimited AI requests")}</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>{t("Create unlimited itineraries")}</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>{t("Priority support")}</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>{t("Advanced travel features")}</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.price}>
                {price.currency === '$' ? price.currency : ''}{price.amount}{price.currency === 'Lek' ? ' ' + price.currency : ''}
                <Text style={styles.priceUnit}>{price.period}</Text>
              </Text>
              <Text style={styles.priceNote}>{t("Cancel anytime")}</Text>
            </View>
          </View>

          <LinearGradient
            colors={['#8E7CC3', '#6B5B95']}
            style={styles.upgradeButton}
          >
            <TouchableOpacity
              style={styles.upgradeButtonInner}
              onPress={handleUpgrade}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <>
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={[styles.upgradeButtonText, { marginLeft: 8 }]}>Processing...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.upgradeButtonText}>{t("Upgrade to Premium")}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 24,
  },
  resetText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 24,
  },
  premiumSection: {
    width: '100%',
    marginBottom: 24,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
  },
  pricingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F8F5FF',
    borderRadius: 12,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6B5B95',
  },
  priceUnit: {
    fontSize: 18,
    fontWeight: 'normal',
    color: '#666',
  },
  priceNote: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  upgradeButton: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 12,
  },
  upgradeButtonInner: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

