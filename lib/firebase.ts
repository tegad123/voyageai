// Firebase configuration for Expo Go using REST API

const firebaseConfig = {
  apiKey: "AIzaSyDBIiy1CP5zpf2-7GDqBZaH60pU5QMxLSA",
  authDomain: "voyageai-c34a6.firebaseapp.com",
  projectId: "voyageai-c34a6",
  storageBucket: "voyageai-c34a6.firebasestorage.app",
  messagingSenderId: "752889489358",
  appId: "1:752889489358:web:e3509b01e86b3fb8922d9f",
  measurementId: "G-KK3QGPQSJC"
};

// Firebase Auth REST API endpoints
const FIREBASE_AUTH_BASE = `https://identitytoolkit.googleapis.com/v1/accounts`;

// Helper function to get user-friendly error messages
function getErrorMessage(errorCode: string): string {
  const errorMessages: { [key: string]: string } = {
    'OPERATION_NOT_ALLOWED': 'Email/password sign-up is not enabled. Please contact support.',
    'EMAIL_EXISTS': 'An account with this email already exists. Please sign in instead.',
    'INVALID_EMAIL': 'Please enter a valid email address.',
    'WEAK_PASSWORD': 'Password should be at least 6 characters long.',
    'INVALID_PASSWORD': 'Incorrect password. Please try again.',
    'USER_NOT_FOUND': 'No account found with this email. Please sign up first.',
    'TOO_MANY_ATTEMPTS_TRY_LATER': 'Too many failed attempts. Please try again later.',
    'NETWORK_ERROR': 'Network error. Please check your internet connection.',
    'DEFAULT': 'An error occurred. Please try again.'
  };
  
  return errorMessages[errorCode] || errorMessages['DEFAULT'];
}

// Simple auth service using REST API
export const authService = {
  async signUp(email: string, password: string) {
    try {
      const response = await fetch(`${FIREBASE_AUTH_BASE}:signUp?key=${firebaseConfig.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorCode = data.error?.message || 'DEFAULT';
        throw new Error(getErrorMessage(errorCode));
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async signIn(email: string, password: string) {
    try {
      const response = await fetch(`${FIREBASE_AUTH_BASE}:signInWithPassword?key=${firebaseConfig.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorCode = data.error?.message || 'DEFAULT';
        throw new Error(getErrorMessage(errorCode));
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async signOut() {
    // For REST API, we just clear local storage
    // The token will expire naturally
  }
};

// Export a mock auth object for compatibility
export const auth = {
  currentUser: null as any,
  async signInWithEmailAndPassword(email: string, password: string) {
    const result = await authService.signIn(email, password);
    this.currentUser = { uid: result.localId, email: result.email };
    return { user: this.currentUser };
  },
  async createUserWithEmailAndPassword(email: string, password: string) {
    const result = await authService.signUp(email, password);
    this.currentUser = { uid: result.localId, email: result.email };
    return { user: this.currentUser };
  },
  async signOut() {
    await authService.signOut();
    this.currentUser = null;
  }
}; 