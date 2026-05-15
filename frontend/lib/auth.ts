import { jwtDecode } from 'jwt-decode';

type DecodedToken = {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
};

export function getUserFromToken() {
  const token = localStorage.getItem('token');

  if (!token) return null;

  try {
    return jwtDecode<DecodedToken>(token);
  } catch (err) {
    console.error('Invalid token', err);
    return null;
  }
}