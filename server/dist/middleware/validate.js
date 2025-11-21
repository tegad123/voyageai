"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            // Ensure req.body exists and is an object
            if (!req.body || typeof req.body !== 'object') {
                return res.status(400).json({
                    message: 'Invalid request body',
                    errors: [{ message: 'Request body must be a valid JSON object' }]
                });
            }
            // Parse and validate the request body
            const validatedData = await schema.parseAsync(req.body);
            req.body = validatedData; // Replace with validated data
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({
                    message: 'Validation failed',
                    errors: error.errors,
                });
            }
            next(error);
        }
    };
};
exports.validateRequest = validateRequest;
