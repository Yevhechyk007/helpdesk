export interface JwtPayload {
  sub: string;
  email: string;
  role: 'admin' | 'agent' | 'customer';
  iat?: number;
  exp?: number;
}
