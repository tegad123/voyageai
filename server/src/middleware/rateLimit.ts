import { Request, Response, NextFunction } from 'express';

// In-memory storage for rate limiting (in production, use Redis or database)
interface UserUsage {
  messageCount: number;
  weekStart: number; // Unix timestamp of week start
  isPremium: boolean;
}

const userUsageMap = new Map<string, UserUsage>();

const FREE_MESSAGE_LIMIT = 30;
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Get the start of the current week (Monday at 00:00:00 UTC)
 */
function getWeekStart(): number {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // Sunday = 0, so we need 6 days back
  
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - daysToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  
  return monday.getTime();
}

/**
 * Rate limiting middleware for AI chat messages
 */
export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get user ID from request (you'll need to add user auth first)
    // For now, we'll use a placeholder or IP-based tracking
    const userId = req.headers['x-user-id'] as string || req.ip || 'anonymous';
    
    console.log('[RATE_LIMIT] Checking limits for user:', userId);
    
    // Get or create user usage record
    let userUsage = userUsageMap.get(userId);
    const currentWeekStart = getWeekStart();
    
    // If no record exists or week has reset, create new record
    if (!userUsage || userUsage.weekStart < currentWeekStart) {
      userUsage = {
        messageCount: 0,
        weekStart: currentWeekStart,
        isPremium: false, // TODO: Check from database/payment system
      };
      userUsageMap.set(userId, userUsage);
      console.log('[RATE_LIMIT] Created new usage record for user:', userId);
    }
    
    // Check if user is premium (bypass limits)
    if (userUsage.isPremium) {
      console.log('[RATE_LIMIT] Premium user, bypassing limits');
      userUsage.messageCount += 1;
      userUsageMap.set(userId, userUsage);
      
      // Add usage info to response headers
      res.setHeader('X-RateLimit-Limit', 'unlimited');
      res.setHeader('X-RateLimit-Remaining', 'unlimited');
      res.setHeader('X-RateLimit-Premium', 'true');
      
      return next();
    }
    
    // Check if user has exceeded free limit
    if (userUsage.messageCount >= FREE_MESSAGE_LIMIT) {
      console.log('[RATE_LIMIT] User exceeded limit:', {
        userId,
        messageCount: userUsage.messageCount,
        limit: FREE_MESSAGE_LIMIT,
      });
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You've reached your weekly limit of ${FREE_MESSAGE_LIMIT} free messages. Upgrade to Premium for unlimited messages.`,
        limit: FREE_MESSAGE_LIMIT,
        used: userUsage.messageCount,
        resetDate: new Date(userUsage.weekStart + WEEK_IN_MS).toISOString(),
        upgradeRequired: true,
      });
    }
    
    // Increment message count
    userUsage.messageCount += 1;
    userUsageMap.set(userId, userUsage);
    
    console.log('[RATE_LIMIT] Usage updated:', {
      userId,
      messageCount: userUsage.messageCount,
      remaining: FREE_MESSAGE_LIMIT - userUsage.messageCount,
    });
    
    // Add usage info to response headers
    res.setHeader('X-RateLimit-Limit', FREE_MESSAGE_LIMIT.toString());
    res.setHeader('X-RateLimit-Remaining', (FREE_MESSAGE_LIMIT - userUsage.messageCount).toString());
    res.setHeader('X-RateLimit-Used', userUsage.messageCount.toString());
    res.setHeader('X-RateLimit-Reset', new Date(userUsage.weekStart + WEEK_IN_MS).toISOString());
    res.setHeader('X-RateLimit-Premium', 'false');
    
    next();
  } catch (error) {
    console.error('[RATE_LIMIT] Error in rate limit middleware:', error);
    // On error, allow the request to proceed
    next();
  }
};

/**
 * Get usage stats for a user (for client to query)
 */
export const getUserUsage = (userId: string) => {
  const userUsage = userUsageMap.get(userId);
  const currentWeekStart = getWeekStart();
  
  if (!userUsage || userUsage.weekStart < currentWeekStart) {
    return {
      messageCount: 0,
      limit: FREE_MESSAGE_LIMIT,
      remaining: FREE_MESSAGE_LIMIT,
      isPremium: false,
      resetDate: new Date(currentWeekStart + WEEK_IN_MS).toISOString(),
    };
  }
  
  return {
    messageCount: userUsage.messageCount,
    limit: userUsage.isPremium ? 'unlimited' : FREE_MESSAGE_LIMIT,
    remaining: userUsage.isPremium ? 'unlimited' : Math.max(0, FREE_MESSAGE_LIMIT - userUsage.messageCount),
    isPremium: userUsage.isPremium,
    resetDate: new Date(userUsage.weekStart + WEEK_IN_MS).toISOString(),
  };
};

/**
 * Mark a user as premium (for testing or after payment)
 */
export const setPremiumStatus = (userId: string, isPremium: boolean) => {
  const userUsage = userUsageMap.get(userId);
  if (userUsage) {
    userUsage.isPremium = isPremium;
    userUsageMap.set(userId, userUsage);
  } else {
    userUsageMap.set(userId, {
      messageCount: 0,
      weekStart: getWeekStart(),
      isPremium,
    });
  }
  console.log('[RATE_LIMIT] Set premium status for user:', userId, isPremium);
};

