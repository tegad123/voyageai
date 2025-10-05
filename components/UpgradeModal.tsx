import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  messageLimit: number;
  resetDate: string;
}

export default function UpgradeModal({ visible, onClose, messageLimit, resetDate }: UpgradeModalProps) {
  const handleUpgrade = () => {
    onClose();
    // TODO: Navigate to payment/subscription screen
    Alert.alert(
      'Coming Soon',
      'Premium subscriptions will be available soon! Your limit will reset on Monday.',
      [{ text: 'OK' }]
    );
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
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="chatbubbles" size={48} color="#6B5B95" />
            </View>
          </View>

          <Text style={styles.modalTitle}>You've Reached Your Free Limit</Text>
          <Text style={styles.modalSubtitle}>
            You've used all {messageLimit} free messages this week.
          </Text>

          <View style={styles.resetContainer}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.resetText}>
              Free messages reset on {formatResetDate(resetDate)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.premiumSection}>
            <Text style={styles.premiumTitle}>Go Premium for Unlimited Access</Text>
            
            <View style={styles.featuresContainer}>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Unlimited AI messages</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Create unlimited itineraries</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Priority support</Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Advanced travel features</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.price}>$9.99<Text style={styles.priceUnit}>/month</Text></Text>
              <Text style={styles.priceNote}>Cancel anytime</Text>
            </View>
          </View>

          <LinearGradient
            colors={['#8E7CC3', '#6B5B95']}
            style={styles.upgradeButton}
          >
            <TouchableOpacity
              style={styles.upgradeButtonInner}
              onPress={handleUpgrade}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>

          <TouchableOpacity 
            style={styles.laterButton}
            onPress={onClose}
          >
            <Text style={styles.laterText}>I'll Wait for Free Reset</Text>
          </TouchableOpacity>
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
  laterButton: {
    paddingVertical: 12,
  },
  laterText: {
    fontSize: 15,
    color: '#999',
  },
});

