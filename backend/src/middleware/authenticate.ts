import jwt from 'jsonwebtoken';

export const buildAuthenticateMiddleware = (jwtSecret: string) => {
  return (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  };
};