import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.errors,
        });
      }
      next(error);
    }
  };
}; 