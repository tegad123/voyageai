import { Platform, Alert } from 'react-native';
import type { Product, Purchase } from 'react-native-iap';

type IAPModule = typeof import('react-native-iap');

let IAP: IAPModule | null = null;

function getIAPModule(): IAPModule | null {
  if (IAP) return IAP;
  try {
    // Use require so we only load the native module when actually needed
    // This avoids triggering native initialization during app startup.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    IAP = require('react-native-iap');
    return IAP;
  } catch (error) {
    console.error('[IAP] react-native-iap module not available:', error);
    return null;
  }
}

// Product IDs should match those configured in App Store Connect
const PRODUCT_IDS = {
  weekly: Platform.select({
    ios: 'com.jmotech.voyageai.premium.weekly',
    android: 'com.jmotech.voyageai.premium.weekly',
  }),
};

// Track purchase state
let isInitialized = false;
let products: Product[] = [];

/**
 * Initialize the IAP connection
 */
export async function initializeIAP(): Promise<boolean> {
  try {
    const IAPModule = getIAPModule();
    if (!IAPModule) {
      return false;
    }
    console.log('[IAP] Initializing In-App Purchase connection...');
    await IAPModule.initConnection();
    console.log('[IAP] Connection initialized successfully');
    isInitialized = true;
    
    // Get available products
    await loadProducts();
    
    return true;
  } catch (error: any) {
    console.error('[IAP] Failed to initialize:', error.message);
    isInitialized = false;
    return false;
  }
}

/**
 * Load available products from the store
 */
export async function loadProducts(): Promise<Product[]> {
  try {
    const IAPModule = getIAPModule();
    if (!IAPModule) {
      return [];
    }
    if (!isInitialized) {
      console.warn('[IAP] Not initialized, attempting to initialize...');
      await initializeIAP();
    }
    
    const productIds = Object.values(PRODUCT_IDS).filter(Boolean) as string[];
    console.log('[IAP] Loading products:', productIds);
    
    const productList = await IAPModule.getProducts({ skus: productIds });
    console.log('[IAP] Products loaded:', productList.length);
    
    products = productList;
    return productList;
  } catch (error: any) {
    console.error('[IAP] Failed to load products:', error.message);
    return [];
  }
}

/**
 * Get the weekly subscription product
 */
export function getWeeklyProduct(): Product | null {
  const weeklyId = PRODUCT_IDS.weekly;
  if (!weeklyId) return null;
  
  const product = products.find(p => p.productId === weeklyId);
  return product || null;
}

/**
 * Request purchase for weekly subscription
 */
export async function purchaseWeeklySubscription(): Promise<boolean> {
  try {
    const IAPModule = getIAPModule();
    if (!IAPModule) {
      Alert.alert('Error', 'Purchases are not available on this device.');
      return false;
    }
    if (!isInitialized) {
      console.warn('[IAP] Not initialized, attempting to initialize...');
      const initialized = await initializeIAP();
      if (!initialized) {
        Alert.alert('Error', 'Unable to connect to the App Store. Please try again later.');
        return false;
      }
    }
    
    const weeklyId = PRODUCT_IDS.weekly;
    if (!weeklyId) {
      Alert.alert('Error', 'Weekly subscription is not available.');
      return false;
    }
    
    console.log('[IAP] Requesting purchase for:', weeklyId);
    
    // Request purchase
    await IAPModule.requestSubscription({ sku: weeklyId });
    
    console.log('[IAP] Purchase request initiated');
    return true;
  } catch (error: any) {
    console.error('[IAP] Purchase failed:', error.message);
    
    // Handle user cancellation gracefully
    if (error.code === 'E_USER_CANCELLED') {
      console.log('[IAP] User cancelled purchase');
      return false;
    }
    
    Alert.alert('Purchase Failed', 'Unable to complete your purchase. Please try again.');
    return false;
  }
}

/**
 * Set up purchase update listener
 * Call this in your app's root component
 */
export function setupPurchaseListener(
  onPurchaseSuccess: (purchase: Purchase) => void,
  onPurchaseError?: (error: any) => void
): () => void {
  const IAPModule = getIAPModule();
  if (!IAPModule) {
    console.warn('[IAP] Module unavailable, purchase listener not attached.');
    return () => {};
  }
  console.log('[IAP] Setting up purchase listener');
  
  const purchaseUpdateSubscription = IAPModule.purchaseUpdatedListener((purchase: Purchase) => {
    console.log('[IAP] Purchase updated:', purchase.productId, 'State:', purchase.purchaseStateAndroid);
    
    const receipt = purchase.transactionReceipt;
    if (receipt) {
      // Purchase successful
      console.log('[IAP] Purchase successful, finishing transaction');
      
      // Finish the transaction (required for iOS)
      if (Platform.OS === 'ios') {
        IAPModule.finishTransaction({ purchase, isConsumable: false });
      }
      
      // Notify success
      onPurchaseSuccess(purchase);
    }
  });
  
  const purchaseErrorSubscription = IAPModule.purchaseErrorListener((error: any) => {
    console.error('[IAP] Purchase error:', error);
    
    // Don't show alert for user cancellations
    if (error.code !== 'E_USER_CANCELLED') {
      if (onPurchaseError) {
        onPurchaseError(error);
      } else {
        Alert.alert('Purchase Error', 'An error occurred during purchase. Please try again.');
      }
    }
  });
  
  // Return cleanup function
  return () => {
    console.log('[IAP] Removing purchase listeners');
    purchaseUpdateSubscription.remove();
    purchaseErrorSubscription.remove();
  };
}

/**
 * Restore previous purchases (for users who reinstalled the app)
 */
export async function restorePurchases(): Promise<Purchase[]> {
  try {
    const IAPModule = getIAPModule();
    if (!IAPModule) {
      return [];
    }
    console.log('[IAP] Restoring purchases...');
    const purchases = await IAPModule.getAvailablePurchases();
    console.log('[IAP] Restored purchases:', purchases.length);
    return purchases;
  } catch (error: any) {
    console.error('[IAP] Failed to restore purchases:', error.message);
    return [];
  }
}

/**
 * Disconnect IAP (call when app is closing)
 */
export async function disconnectIAP(): Promise<void> {
  try {
    const IAPModule = getIAPModule();
    if (!IAPModule) {
      return;
    }
    console.log('[IAP] Disconnecting...');
    await IAPModule.endConnection();
    isInitialized = false;
    console.log('[IAP] Disconnected');
  } catch (error: any) {
    console.error('[IAP] Failed to disconnect:', error.message);
  }
}

