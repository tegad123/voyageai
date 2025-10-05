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
    'Rate limit reached. Upgrade for unlimited messages.': 'Rate limit reached. Upgrade for unlimited messages.',
    
    // Subscription & Upgrade Modal
    'You\'ve Reached Your Free Limit': 'You\'ve Reached Your Free Limit',
    'You\'ve used all': 'You\'ve used all',
    'free requests this week.': 'free requests this week.',
    'Free requests reset on': 'Free requests reset on',
    'Go Premium for Unlimited Access': 'Go Premium for Unlimited Access',
    'Unlimited AI requests': 'Unlimited AI requests',
    'Create unlimited itineraries': 'Create unlimited itineraries',
    'Priority support': 'Priority support',
    'Advanced travel features': 'Advanced travel features',
    'Cancel anytime': 'Cancel anytime',
    'Upgrade to Premium': 'Upgrade to Premium',
    'I\'ll Wait for Free Reset': 'I\'ll Wait for Free Reset',
    'Subscription': 'Subscription',
    'Premium Active': 'Premium Active',
    'Premium (Ending Soon)': 'Premium (Ending Soon)',
    'Subscription cancelled. Access until': 'Subscription cancelled. Access until',
    'Plan:': 'Plan:',
    'Premium - Unlimited Requests': 'Premium - Unlimited Requests',
    'Price:': 'Price:',
    'Next Billing:': 'Next Billing:',
    'Access Until:': 'Access Until:',
    'Cancel Subscription': 'Cancel Subscription',
    'Reactivate Subscription': 'Reactivate Subscription',
    'Free Plan': 'Free Plan',
    'Requests:': 'Requests:',
    'Limited': 'Limited',
    'Resets:': 'Resets:',
    'Every Monday': 'Every Monday',
    'Cancel Subscription?': 'Cancel Subscription?',
    'Are you sure you want to cancel your Premium subscription?': 'Are you sure you want to cancel your Premium subscription?',
    'You\'ll keep Premium access until the end of your current billing period': 'You\'ll keep Premium access until the end of your current billing period',
    'After that, you\'ll lose access to:': 'After that, you\'ll lose access to:',
    'You\'ll then have limited free requests per week.': 'You\'ll then have limited free requests per week.',
    'Keep Premium': 'Keep Premium',
    'Subscription Cancelled': 'Subscription Cancelled',
    'Subscription Reactivated': 'Subscription Reactivated',
    'Your Premium subscription will continue and you will be billed on the next cycle.': 'Your Premium subscription will continue and you will be billed on the next cycle.',
    'Coming Soon': 'Coming Soon',
    
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
    
    // Login & Onboarding
    'Welcome back': 'Welcome back',
    'Create your account': 'Create your account',
    'Start your journey with Voyage AI': 'Start your journey with Voyage AI',
    'Sign in to continue your adventure': 'Sign in to continue your adventure',
    'Create Account': 'Create Account',
    'Sign In': 'Sign In',
    'Or continue with': 'Or continue with',
    'Google': 'Google',
    'Already have an account? Sign in': 'Already have an account? Sign in',
    "Don't have an account? Sign up": "Don't have an account? Sign up",
    'Error': 'Error',
    'Please fill in all required fields': 'Please fill in all required fields',
    'Please enter your full name': 'Please enter your full name',
    'Authentication Error': 'Authentication Error',
    'Sign-in already in progress': 'Sign-in already in progress',
    'Google Play Services not available': 'Google Play Services not available',
    'Google sign-in failed': 'Google sign-in failed',
    'Apple sign-in failed': 'Apple sign-in failed',
    'Apple Sign-In is not available on this device': 'Apple Sign-In is not available on this device',
    'Invalid response from Apple. Please try again.': 'Invalid response from Apple. Please try again.',
    'Apple Sign-In request failed. Please try again.': 'Apple Sign-In request failed. Please try again.',
    
    // Intro Tour
    'Skip': 'Skip',
    'Next': 'Next',
    'Get Started': 'Get Started',
    'Discover Perfect Destinations': 'Discover Perfect Destinations',
    'AI-powered recommendations tailored to your preferences': 'AI-powered recommendations tailored to your preferences',
    'Let our intelligent system find amazing places that match your travel style, budget, and interests.': 'Let our intelligent system find amazing places that match your travel style, budget, and interests.',
    'Select Dates & Book Effortlessly': 'Select Dates & Book Effortlessly',
    'Seamless booking with smart date suggestions': 'Seamless booking with smart date suggestions',
    'Our AI optimizes your travel dates for the best prices and weather conditions.': 'Our AI optimizes your travel dates for the best prices and weather conditions.',
    'Relax & Enjoy Your Voyage': 'Relax & Enjoy Your Voyage',
    'Personalized itineraries and 24/7 support': 'Personalized itineraries and 24/7 support',
    'Sit back while we handle the details and provide real-time assistance throughout your journey.': 'Sit back while we handle the details and provide real-time assistance throughout your journey.',
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
    'Rate limit reached. Upgrade for unlimited messages.': 'Kufiri i arritur. Përditësoni për mesazhe të pakufizuara.',
    
    // Subscription & Upgrade Modal
    'You\'ve Reached Your Free Limit': 'Ke Arritur Kufirin Tënd Falas',
    'You\'ve used all': 'Ke përdorur të gjitha',
    'free requests this week.': 'kërkesat falas këtë javë.',
    'Free requests reset on': 'Kërkesat falas rivendosen më',
    'Go Premium for Unlimited Access': 'Bëhu Premium për Qasje të Pakufizuar',
    'Unlimited AI requests': 'Kërkesa AI të pakufizuara',
    'Create unlimited itineraries': 'Krijo itinerare të pakufizuara',
    'Priority support': 'Mbështetje me përparësi',
    'Advanced travel features': 'Veçori të avancuara udhëtimi',
    'Cancel anytime': 'Anulo në çdo kohë',
    'Upgrade to Premium': 'Përditëso në Premium',
    'I\'ll Wait for Free Reset': 'Do të Pres për Rivendosjen Falas',
    'Subscription': 'Abonimi',
    'Premium Active': 'Premium Aktiv',
    'Premium (Ending Soon)': 'Premium (Përfundon Shpejt)',
    'Subscription cancelled. Access until': 'Abonimi u anulua. Qasja deri më',
    'Plan:': 'Plani:',
    'Premium - Unlimited Requests': 'Premium - Kërkesa të Pakufizuara',
    'Price:': 'Çmimi:',
    'Next Billing:': 'Faturimi i Ardhshëm:',
    'Access Until:': 'Qasja Deri Më:',
    'Cancel Subscription': 'Anulo Abonimin',
    'Reactivate Subscription': 'Riaktivizo Abonimin',
    'Free Plan': 'Plani Falas',
    'Requests:': 'Kërkesat:',
    'Limited': 'E Kufizuar',
    'Resets:': 'Rivendoset:',
    'Every Monday': 'Çdo të Hënë',
    'Cancel Subscription?': 'Anulo Abonimin?',
    'Are you sure you want to cancel your Premium subscription?': 'Jeni të sigurt që dëshironi të anuloni abonimin tuaj Premium?',
    'You\'ll keep Premium access until the end of your current billing period': 'Do të mbani qasjen Premium deri në fund të periudhës suaj aktuale të faturimit',
    'After that, you\'ll lose access to:': 'Pas kësaj, do të humbni qasjen në:',
    'You\'ll then have limited free requests per week.': 'Atëherë do të keni kërkesa falas të kufizuara në javë.',
    'Keep Premium': 'Mbaj Premium',
    'Subscription Cancelled': 'Abonimi u Anulua',
    'Subscription Reactivated': 'Abonimi u Riaktivizua',
    'Your Premium subscription will continue and you will be billed on the next cycle.': 'Abonimi juaj Premium do të vazhdojë dhe do të faturoheni në ciklin e ardhshëm.',
    'Coming Soon': 'Vjen Shpejt',
    
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
    
    // Login & Onboarding
    'Welcome back': 'Mirë se erdhe përsëri',
    'Create your account': 'Krijo llogarinë tënde',
    'Start your journey with Voyage AI': 'Fillo udhëtimin tënd me Voyage AI',
    'Sign in to continue your adventure': 'Hyr për të vazhduar aventurën tënde',
    'Create Account': 'Krijo Llogari',
    'Sign In': 'Hyr',
    'Or continue with': 'Ose vazhdo me',
    'Google': 'Google',
    'Already have an account? Sign in': 'Ke tashmë një llogari? Hyr',
    "Don't have an account? Sign up": 'Nuk ke llogari? Regjistrohu',
    'Error': 'Gabim',
    'Please fill in all required fields': 'Ju lutemi plotësoni të gjitha fushat e kërkuara',
    'Please enter your full name': 'Ju lutemi shkruani emrin tuaj të plotë',
    'Authentication Error': 'Gabim në Autentifikim',
    'Sign-in already in progress': 'Hyrja është duke u procesuar',
    'Google Play Services not available': 'Shërbimet e Google Play nuk janë të disponueshme',
    'Google sign-in failed': 'Hyrja me Google dështoi',
    'Apple sign-in failed': 'Hyrja me Apple dështoi',
    'Apple Sign-In is not available on this device': 'Hyrja me Apple nuk është e disponueshme në këtë pajisje',
    'Invalid response from Apple. Please try again.': 'Përgjigje e pavlefshme nga Apple. Ju lutemi provoni përsëri.',
    'Apple Sign-In request failed. Please try again.': 'Kërkesa për hyrjen me Apple dështoi. Ju lutemi provoni përsëri.',
    
    // Intro Tour
    'Skip': 'Kapërce',
    'Next': 'Tjetër',
    'Get Started': 'Fillo',
    'Discover Perfect Destinations': 'Zbulo Destinacionet e Përsosura',
    'AI-powered recommendations tailored to your preferences': 'Rekomandime të fuqizuara nga AI të përshtatura për preferencat tuaja',
    'Let our intelligent system find amazing places that match your travel style, budget, and interests.': 'Lër sistemin tonë inteligjent të gjejë vende të mrekullueshme që përputhen me stilin tënd të udhëtimit, buxhetin dhe interesat.',
    'Select Dates & Book Effortlessly': 'Zgjidh Datat dhe Rezervo pa Mundim',
    'Seamless booking with smart date suggestions': 'Rezervim i qetë me sugjerime të mençura për datat',
    'Our AI optimizes your travel dates for the best prices and weather conditions.': 'AI-ja jonë optimizon datat e udhëtimit tuaj për çmimet më të mira dhe kushtet e motit.',
    'Relax & Enjoy Your Voyage': 'Relaksohu dhe Gëzohu në Udhëtimin Tënd',
    'Personalized itineraries and 24/7 support': 'Itinerare të personalizuara dhe mbështetje 24/7',
    'Sit back while we handle the details and provide real-time assistance throughout your journey.': 'Ulu rehat ndërsa ne trajtojmë detajet dhe ofrojmë ndihmë në kohë reale gjatë gjithë udhëtimit tuaj.',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('Albanian');
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