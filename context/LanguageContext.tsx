import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'English' | 'Albanian';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language translations
const translations: Record<Language, Record<string, string>> = {
  'English': {
    // Profile
    'Profile Settings': 'Profile Settings',
    'User Information': 'User Information',
    'Login & Security': 'Login & Security',
    'Preferences': 'Preferences',
    'Legal & Support': 'Legal & Support',
    'Full Name': 'Full Name',
    'Email Address': 'Email Address',
    'Phone Number': 'Phone Number',
    'Change Password': 'Change Password',
    'Two-Factor Authentication': 'Two-Factor Authentication',
    'Recent Logins': 'Recent Logins',
    'Log Out All Devices': 'Log Out All Devices',
    'Language': 'Language',
    'Currency': 'Currency',
    'Time Zone': 'Time Zone',
    'Email Notifications': 'Email Notifications',
    'Push Notifications': 'Push Notifications',
    'Privacy Policy': 'Privacy Policy',
    'Terms of Service': 'Terms of Service',
    'Contact Support': 'Contact Support',
    'Sign Out': 'Sign Out',
    'Delete Account': 'Delete Account',
    'Select Language': 'Select Language',
    'Select Currency': 'Select Currency',
    'Select Time Zone': 'Select Time Zone',
    'Save Changes': 'Save Changes',
    'Change Photo': 'Change Photo',
    'Enter your full name': 'Enter your full name',
    'Enter your email': 'Enter your email',
    'Enter your phone number': 'Enter your phone number',
    'Enter current password': 'Enter current password',
    'Enter new password': 'Enter new password',
    'Confirm new password': 'Confirm new password',
    'Current Password': 'Current Password',
    'New Password': 'New Password',
    'Confirm New Password': 'Confirm New Password',
    
    // Chat
    'Chat': 'Chat',
    'Chats': 'Chats',
    'Hello, where would you like to travel to?': 'Hello, where would you like to travel to?',
    'I can help you plan the perfect trip with personalized itineraries and recommendations.': 'I can help you plan the perfect trip with personalized itineraries and recommendations.',
    'Type a message…': 'Type a message…',
    
    // Trips
    'Your Trips': 'Your Trips',
    'Upcoming': 'Upcoming',
    'Drafts': 'Drafts',
    'Completed': 'Completed',
    'Day': 'Day',
    'days': 'days',
    'Book': 'Book',
    'Check in': 'Check in',
    'Check out': 'Check out',
    'Guests': 'Guests',
    'adults': 'adults',
    'Confirm Booking': 'Confirm Booking',
    'Added': 'Added',
    'Itinerary': 'Itinerary',
    'Unassuming rooms in a low-key hotel featuring a casual cafe, as well as free breakfast & parking.': 'Unassuming rooms in a low-key hotel featuring a casual cafe, as well as free breakfast & parking.',
    'Iconic broadcasting tower with observation decks offering panoramic city views.': 'Iconic broadcasting tower with observation decks offering panoramic city views.',
    'Home': 'Home',
    'Trips': 'Trips',

    // Feedback Survey
    'feedback.survey.title': 'Quick Feedback',
    'feedback.survey.q1': 'What did you like most about this itinerary?',
    'feedback.survey.q2': 'How can we improve the itinerary experience?',
    'feedback.common.cancel': 'Cancel',
    'feedback.common.submit': 'Submit',
    'feedback.common.submitting': 'Submitting...',

    // Profile
    'Profile': 'Profile',
    'Your travel preferences and settings': 'Your travel preferences and settings',
    'This action cannot be undone. Type DELETE below to confirm.': 'This action cannot be undone. Type DELETE below to confirm.',
    'Cancel': 'Cancel',
    'Delete': 'Delete',
  },
  'Albanian': {
    // Profile
    'Profile Settings': 'Cilësimet e Profilit',
    'User Information': 'Informacioni i Përdoruesit',
    'Login & Security': 'Hyrja dhe Siguria',
    'Preferences': 'Preferencat',
    'Legal & Support': 'Ligjore dhe Mbështetje',
    'Full Name': 'Emri i Plotë',
    'Email Address': 'Adresa e Emailit',
    'Phone Number': 'Numri i Telefonit',
    'Change Password': 'Ndrysho Fjalëkalimin',
    'Two-Factor Authentication': 'Autentifikimi me Dy Faktorë',
    'Recent Logins': 'Hyrjet e Fundit',
    'Log Out All Devices': 'Dil nga Të Gjitha Pajisjet',
    'Language': 'Gjuha',
    'Currency': 'Monedha',
    'Time Zone': 'Zona Kohore',
    'Email Notifications': 'Njoftimet me Email',
    'Push Notifications': 'Njoftimet Push',
    'Privacy Policy': 'Politika e Privatësisë',
    'Terms of Service': 'Kushtet e Shërbimit',
    'Contact Support': 'Kontakto Mbështetjen',
    'Sign Out': 'Dil',
    'Delete Account': 'Fshi Llogarinë',
    'Select Language': 'Zgjidh Gjuhën',
    'Select Currency': 'Zgjidh Monedhën',
    'Select Time Zone': 'Zgjidh Zonën Kohore',
    'Save Changes': 'Ruaj Ndryshimet',
    'Change Photo': 'Ndrysho Foton',
    'Enter your full name': 'Shkruaj emrin tënd të plotë',
    'Enter your email': 'Shkruaj emailin tënd',
    'Enter your phone number': 'Shkruaj numrin tënd të telefonit',
    'Enter current password': 'Shkruaj fjalëkalimin aktual',
    'Enter new password': 'Shkruaj fjalëkalimin e ri',
    'Confirm new password': 'Konfirmo fjalëkalimin e ri',
    'Current Password': 'Fjalëkalimi Aktual',
    'New Password': 'Fjalëkalimi i Ri',
    'Confirm New Password': 'Konfirmo Fjalëkalimin e Ri',
    
    // Chat
    'Chat': 'Bisedë',
    'Chats': 'Bisedat',
    'Hello, where would you like to travel to?': 'Përshëndetje, ku do të shkosh për udhëtim?',
    "I can help you plan the perfect trip with personalized itineraries and recommendations.": "Mund t'ju ndihmoj të planifikoni udhëtimin perfekt me itinerare dhe rekomandime të personalizuara.",
    'Type a message…': 'Shkruaj një mesazh…',
    
    // Trips
    'Your Trips': 'Udhëtimet Tuaja',
    'Upcoming': 'Të Ardhshme',
    'Drafts': 'Draftet',
    'Completed': 'Përfunduar',
    'Day': 'Dita',
    'days': 'ditë',
    'Book': 'Rezervo',
    'Check in': 'Regjistrohuni',
    'Check out': 'Çregjistrohuni',
    'Guests': 'Mysafirët',
    'adults': 'të rritur',
    'Confirm Booking': 'Konfirmo Rezervimin',
    'Added': 'Shtuar',
    'Itinerary': 'Itinerari',
    'Unassuming rooms in a low-key hotel featuring a casual cafe, as well as free breakfast & parking.': 'Dhoma të thjeshta në një hotel të qetë me një kafene të rastësishme, si dhe mëngjes dhe parking falas.',
    'Iconic broadcasting tower with observation decks offering panoramic city views.': 'Kullë ikonike e transmetimit me platforma vëzhgimi që ofrojnë pamje panoramike të qytetit.',
    'Home': 'Shtëpi',
    'Trips': 'Udhëtimet',

    // Feedback Survey
    'feedback.survey.title': 'Komente të Shpejta',
    'feedback.survey.q1': 'Çfarë ju pëlqeu më shumë në këtë itinerar?',
    'feedback.survey.q2': 'Si mund ta përmirësojmë përvojën e itinerarit?',
    'feedback.common.cancel': 'Anulo',
    'feedback.common.submit': 'Dërgo',
    'feedback.common.submitting': 'Duke dërguar...',

    // Profile
    'Profile': 'Profili',
    'Your travel preferences and settings': 'Preferencat dhe cilësimet tuaja të udhëtimit',
    'This action cannot be undone. Type DELETE below to confirm.': 'Ky veprim nuk mund të zhbëhet. Shkruani DELETE më poshtë për të konfirmuar.',
    'Cancel': 'Anulo',
    'Delete': 'Fshi',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('English');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage && savedLanguage in translations) {
        setLanguageState(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('app_language', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 