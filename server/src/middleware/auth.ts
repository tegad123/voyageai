import { Request, Response, NextFunction } from 'express';

export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers.authorization?.split(' ')[1];
  console.log('🔑 Incoming token:', apiKey);
  console.log('🔒 Expected API_KEY:', process.env.API_KEY);
  
  if (!apiKey) {
    console.log('[AUTH] No API key provided in request');
    return res.status(401).json({
      message: 'No API key provided',
      code: 'MISSING_API_KEY'
    });
  }

  // Debug logging (only showing first 4 characters for security)
  console.log('[AUTH] Received API key starts with:', apiKey.substring(0, 4) + '...');
  console.log('[AUTH] Expected API key starts with:', process.env.API_KEY?.substring(0, 4) + '...');
  
  // In a real application, you would validate the API key against a database
  // For now, we'll just check if it matches the environment variable
  if (apiKey !== process.env.API_KEY) {
    console.log('[AUTH] API key mismatch');
    return res.status(401).json({
      message: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }

  console.log('[AUTH] API key validated successfully');
  next();
}; 