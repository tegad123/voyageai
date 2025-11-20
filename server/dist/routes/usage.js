"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rateLimit_1 = require("../middleware/rateLimit");
const router = (0, express_1.Router)();
/**
 * GET /usage - Get current user's usage stats
 */
router.get('/', (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.ip || 'anonymous';
        const usage = (0, rateLimit_1.getUserUsage)(userId);
        res.json({
            success: true,
            usage,
        });
    }
    catch (error) {
        console.error('[USAGE] Error getting usage:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get usage stats',
        });
    }
});
/**
 * POST /usage/upgrade - Upgrade user to premium (for testing)
 * In production, this should be called after payment verification
 */
router.post('/upgrade', (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.ip || 'anonymous';
        const { isPremium } = req.body;
        // TODO: Verify payment/subscription before setting premium status
        (0, rateLimit_1.setPremiumStatus)(userId, isPremium === true);
        const usage = (0, rateLimit_1.getUserUsage)(userId);
        res.json({
            success: true,
            message: isPremium ? 'Upgraded to premium' : 'Downgraded to free tier',
            usage,
        });
    }
    catch (error) {
        console.error('[USAGE] Error upgrading user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upgrade user',
        });
    }
});
exports.default = router;
