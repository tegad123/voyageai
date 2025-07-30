console.log('=== [tabs/profile.tsx] File loaded ===');
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  Image,
  Switch,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';

export default function Profile() {
  console.log('=== [tabs/profile.tsx] Exporting default Profile ===');
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  
  // User Information State
  const [fullName, setFullName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@example.com');
  const [phone, setPhone] = useState('+1 (555) 123-4567');
  
  // Security State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Preferences State
  const [tempLanguage, setTempLanguage] = useState(language);
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC-5');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  
  // UI State
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Options for selection
  const languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Albanian'];
  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR'];
  const timezones = ['UTC-12', 'UTC-11', 'UTC-10', 'UTC-9', 'UTC-8', 'UTC-7', 'UTC-6', 'UTC-5', 'UTC-4', 'UTC-3', 'UTC-2', 'UTC-1', 'UTC+0', 'UTC+1', 'UTC+2', 'UTC+3', 'UTC+4', 'UTC+5', 'UTC+6', 'UTC+7', 'UTC+8', 'UTC+9', 'UTC+10', 'UTC+11', 'UTC+12'];

  // Update temp language when global language changes
  useEffect(() => {
    setTempLanguage(language);
  }, [language]);

  // Check for unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(tempLanguage !== language);
  }, [tempLanguage, language]);

  const handleSaveLanguage = async () => {
    try {
      await setLanguage(tempLanguage as any);
      setHasUnsavedChanges(false);
      Alert.alert('Success', 'Language settings saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save language settings');
    }
  };

  const handleLanguageSelect = (selectedLang: string) => {
    setTempLanguage(selectedLang as any);
    setShowLanguageModal(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => router.replace('/login'),
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteConfirm.trim().toUpperCase() === 'DELETE') {
      // TODO: perform backend deletion
      setShowDeleteModal(false);
      router.replace('/login');
    } else {
      Alert.alert('Incorrect confirmation', "Please type 'DELETE' to confirm.");
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderSectionHeader = (title: string, icon: any, section: string) => (
    <TouchableOpacity 
      style={styles.sectionHeader} 
      onPress={() => toggleSection(section)}
    >
      <View style={styles.sectionHeaderLeft}>
        <FontAwesome name={icon} size={20} color="#6B5B95" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <FontAwesome 
        name={expandedSection === section ? 'chevron-up' : 'chevron-down'} 
        size={16} 
        color="#666" 
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('Profile')}</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Information Section */}
        <View style={styles.section}>
          {renderSectionHeader(t('User Information'), 'user', 'user')}
          {expandedSection === 'user' && (
            <View style={styles.sectionContent}>
              <View style={styles.profilePhotoContainer}>
                <Image 
                  source={{ uri: 'https://via.placeholder.com/100' }} 
                  style={styles.profilePhoto} 
                />
                <TouchableOpacity style={styles.changePhotoButton}>
                  <FontAwesome name="camera" size={16} color="#FFFFFF" />
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('Full Name')}</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder={t('Enter your full name')}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('Email Address')}</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('Enter your email')}
                  keyboardType="email-address"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('Phone Number')}</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={t('Enter your phone number')}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          )}
        </View>

        {/* Login & Security Section */}
        <View style={styles.section}>
          {renderSectionHeader(t('Login & Security'), 'lock', 'security')}
          {expandedSection === 'security' && (
            <View style={styles.sectionContent}>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => setShowPasswordModal(true)}
              >
                <View style={styles.settingLeft}>
                  <FontAwesome name="key" size={18} color="#6B5B95" />
                  <Text style={styles.settingText}>{t('Change Password')}</Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color="#666" />
              </TouchableOpacity>
              
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <FontAwesome name="shield" size={18} color="#6B5B95" />
                  <Text style={styles.settingText}>{t('Two-Factor Authentication')}</Text>
                </View>
                <Switch
                  value={twoFactorEnabled}
                  onValueChange={setTwoFactorEnabled}
                  trackColor={{ false: '#E0E0E0', true: '#6B5B95' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <FontAwesome name="desktop" size={18} color="#6B5B95" />
                  <Text style={styles.settingText}>{t('Recent Logins')}</Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color="#666" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <FontAwesome name="sign-out" size={18} color="#6B5B95" />
                  <Text style={styles.settingText}>{t('Log Out All Devices')}</Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          {renderSectionHeader(t('Preferences'), 'cog', 'preferences')}
          {expandedSection === 'preferences' && (
            <View style={styles.sectionContent}>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => setShowLanguageModal(true)}
              >
                <View style={styles.settingLeft}>
                  <FontAwesome name="cog" size={18} color="#6B5B95" />
                  <Text style={styles.settingText}>{t('Language')}</Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={styles.settingValue}>{tempLanguage}</Text>
                  <FontAwesome name="chevron-right" size={16} color="#666" />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => setShowCurrencyModal(true)}
              >
                <View style={styles.settingLeft}>
                  <FontAwesome name="money" size={18} color="#6B5B95" />
                  <Text style={styles.settingText}>{t('Currency')}</Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={styles.settingValue}>{currency}</Text>
                  <FontAwesome name="chevron-right" size={16} color="#666" />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => setShowTimezoneModal(true)}
              >
                <View style={styles.settingLeft}>
                  <FontAwesome name="clock-o" size={18} color="#6B5B95" />
                  <Text style={styles.settingText}>{t('Time Zone')}</Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={styles.settingValue}>{timezone}</Text>
                  <FontAwesome name="chevron-right" size={16} color="#666" />
                </View>
              </TouchableOpacity>
              
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <FontAwesome name="envelope" size={18} color="#6B5B95" />
                  <Text style={styles.settingText}>{t('Email Notifications')}</Text>
                </View>
                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                  trackColor={{ false: '#E0E0E0', true: '#6B5B95' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <FontAwesome name="bell" size={18} color="#6B5B95" />
                  <Text style={styles.settingText}>{t('Push Notifications')}</Text>
                </View>
                <Switch
                  value={pushNotifications}
                  onValueChange={setPushNotifications}
                  trackColor={{ false: '#E0E0E0', true: '#6B5B95' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              {hasUnsavedChanges && (
                <TouchableOpacity style={styles.saveChangesButton} onPress={handleSaveLanguage}>
                  <FontAwesome name="save" size={16} color="#FFFFFF" />
                  <Text style={styles.saveChangesText}>{t('Save Changes')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Legal & Support Section */}
        <View style={styles.section}>
          {renderSectionHeader(t('Legal & Support'), 'question-circle', 'legal')}
          {expandedSection === 'legal' && (
            <View style={styles.sectionContent}>
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <FontAwesome name="shield" size={18} color="#6B5B95" />
                  <Text style={styles.settingText}>{t('Privacy Policy')}</Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color="#666" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <FontAwesome name="file-text" size={18} color="#6B5B95" />
                  <Text style={styles.settingText}>{t('Terms of Service')}</Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color="#666" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <FontAwesome name="life-ring" size={18} color="#6B5B95" />
                  <Text style={styles.settingText}>{t('Contact Support')}</Text>
                </View>
                <FontAwesome name="chevron-right" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <FontAwesome name="sign-out" size={16} color="#FFFFFF" />
            <Text style={styles.signOutText}>{t('Sign Out')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
            <FontAwesome name="trash" size={16} color="#FFFFFF" />
            <Text style={styles.deleteAccountText}>{t('Delete Account')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Select Language')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <FontAwesome name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.modalOption,
                    tempLanguage === lang && styles.modalOptionSelected
                  ]}
                  onPress={() => handleLanguageSelect(lang)}
                >
                  <Text style={[
                    styles.modalOptionText,
                    tempLanguage === lang && styles.modalOptionTextSelected
                  ]}>
                    {lang}
                  </Text>
                  {tempLanguage === lang && (
                    <FontAwesome name="check" size={16} color="#6B5B95" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Currency Selection Modal */}
      <Modal
        visible={showCurrencyModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Select Currency')}</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <FontAwesome name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {currencies.map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={[
                    styles.modalOption,
                    currency === curr && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setCurrency(curr);
                    setShowCurrencyModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    currency === curr && styles.modalOptionTextSelected
                  ]}>
                    {curr}
                  </Text>
                  {currency === curr && (
                    <FontAwesome name="check" size={16} color="#6B5B95" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Timezone Selection Modal */}
      <Modal
        visible={showTimezoneModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Select Time Zone')}</Text>
              <TouchableOpacity onPress={() => setShowTimezoneModal(false)}>
                <FontAwesome name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {timezones.map((tz) => (
                <TouchableOpacity
                  key={tz}
                  style={[
                    styles.modalOption,
                    timezone === tz && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setTimezone(tz);
                    setShowTimezoneModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    timezone === tz && styles.modalOptionTextSelected
                  ]}>
                    {tz}
                  </Text>
                  {timezone === tz && (
                    <FontAwesome name="check" size={16} color="#6B5B95" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Change Password')}</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <FontAwesome name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('Current Password')}</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder={t('Enter current password')}
                secureTextEntry
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('New Password')}</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder={t('Enter new password')}
                secureTextEntry
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('Confirm New Password')}</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('Confirm new password')}
                secureTextEntry
              />
            </View>
            
            <TouchableOpacity style={styles.saveButton}>
              <Text style={styles.saveButtonText}>{t('Save Changes')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal visible={showDeleteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { marginBottom:12 }]}>{t('Delete Account')}</Text>
            <Text style={{ color:'#666', marginBottom:12 }}>
              {t('This action cannot be undone. Type DELETE below to confirm.')}
            </Text>
            <TextInput
              style={[styles.input,{ marginBottom:16 }]}
              placeholder="DELETE"
              value={deleteConfirm}
              onChangeText={setDeleteConfirm}
              autoCapitalize="characters"
            />
            <View style={{ flexDirection:'row', justifyContent:'flex-end' }}>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={[styles.saveChangesButton,{ backgroundColor:'#555', marginRight:8 }]}> 
                <Text style={styles.saveChangesText}>{t('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} style={[styles.saveChangesButton,{ backgroundColor:'#e74c3c' }]}> 
                <Text style={styles.saveChangesText}>{t('Delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  header: {
    borderBottomColor: '#F0F0F0',
    borderBottomWidth: 1,
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    color: '#121212',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 3,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    alignItems: 'center',
    borderBottomColor: '#F0F0F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  sectionHeaderLeft: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  sectionTitle: {
    color: '#121212',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  sectionContent: {
    padding: 20,
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePhoto: {
    borderRadius: 50,
    height: 100,
    marginBottom: 12,
    width: 100,
  },
  changePhotoButton: {
    alignItems: 'center',
    backgroundColor: '#6B5B95',
    borderRadius: 20,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderColor: '#E0E0E0',
    borderRadius: 8,
    borderWidth: 1,
    color: '#121212',
    fontSize: 16,
    padding: 12,
  },
  settingItem: {
    alignItems: 'center',
    borderBottomColor: '#F0F0F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  settingRight: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  settingText: {
    color: '#121212',
    fontSize: 16,
    marginLeft: 12,
  },
  settingValue: {
    color: '#666',
    fontSize: 16,
    marginRight: 8,
  },
  saveChangesButton: {
    alignItems: 'center',
    backgroundColor: '#28A745',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    padding: 16,
  },
  saveChangesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: '#FF4444',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    padding: 16,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteAccountButton: {
    alignItems: 'center',
    backgroundColor: '#DC3545',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
  },
  deleteAccountText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxWidth: 400,
    padding: 20,
    width: '90%',
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#121212',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalOption: {
    alignItems: 'center',
    borderBottomColor: '#F0F0F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalOptionSelected: {
    backgroundColor: '#F8F9FA',
  },
  modalOptionText: {
    color: '#121212',
    fontSize: 16,
  },
  modalOptionTextSelected: {
    color: '#6B5B95',
    fontWeight: '600',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#6B5B95',
    borderRadius: 8,
    marginTop: 20,
    padding: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 