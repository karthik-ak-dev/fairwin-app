/**
 * useAuth Hook
 *
 * Handles wallet-based authentication with JWT tokens.
 * Manages challenge-response flow and token storage.
 *
 * Flow:
 * 1. User connects wallet
 * 2. Request challenge from backend
 * 3. Sign challenge with wallet
 * 4. Submit signature to backend
 * 5. Receive and store JWT token
 * 6. Include token in all API requests
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { apiClient } from '@/lib/api/client';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  error: Error | null;
  expiresAt: number | null;
  isAdmin: boolean;
}

interface AuthResponse {
  token: string;
  expiresIn: number;
  address: string;
  isAdmin: boolean;
}

const TOKEN_STORAGE_KEY = 'fairwin_auth_token';
const TOKEN_EXPIRY_KEY = 'fairwin_token_expiry';
const TOKEN_ADMIN_KEY = 'fairwin_is_admin';

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    isAuthenticated: false,
    isAuthenticating: false,
    error: null,
    expiresAt: null,
    isAdmin: false,
  });

  // Load token from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    const storedIsAdmin = localStorage.getItem(TOKEN_ADMIN_KEY);

    if (storedToken && storedExpiry) {
      const expiryTime = parseInt(storedExpiry, 10);

      // Check if token is expired
      if (Date.now() < expiryTime) {
        setAuthState({
          token: storedToken,
          isAuthenticated: true,
          isAuthenticating: false,
          error: null,
          expiresAt: expiryTime,
          isAdmin: storedIsAdmin === 'true',
        });
      } else {
        // Token expired, clear it
        clearToken();
      }
    }
  }, []);

  // Clear token when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      clearToken();
    }
  }, [isConnected]);

  /**
   * Authenticate user by signing a challenge
   */
  const authenticate = useCallback(async () => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected');
    }

    setAuthState((prev) => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      // Step 1: Request challenge from backend
      const challengeResponse = await apiClient<{ challenge: string; expiresIn: number }>(
        '/api/auth/challenge',
        {
          method: 'POST',
          body: { address },
        }
      );

      // Step 2: Sign challenge with wallet
      const signature = await signMessageAsync({
        message: challengeResponse.challenge,
      });

      // Step 3: Verify signature and get JWT token
      const authResponse = await apiClient<AuthResponse>('/api/auth/verify', {
        method: 'POST',
        body: {
          address,
          challenge: challengeResponse.challenge,
          signature,
        },
      });

      // Step 4: Store token
      const expiresAt = Date.now() + authResponse.expiresIn * 1000;

      localStorage.setItem(TOKEN_STORAGE_KEY, authResponse.token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
      localStorage.setItem(TOKEN_ADMIN_KEY, authResponse.isAdmin.toString());

      setAuthState({
        token: authResponse.token,
        isAuthenticated: true,
        isAuthenticating: false,
        error: null,
        expiresAt,
        isAdmin: authResponse.isAdmin,
      });

      return authResponse.token;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Authentication failed');
      setAuthState((prev) => ({
        ...prev,
        isAuthenticating: false,
        error: err,
      }));
      throw err;
    }
  }, [address, isConnected, signMessageAsync]);

  /**
   * Clear authentication token
   */
  const clearToken = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(TOKEN_ADMIN_KEY);

    setAuthState({
      token: null,
      isAuthenticated: false,
      isAuthenticating: false,
      error: null,
      expiresAt: null,
      isAdmin: false,
    });
  }, []);

  /**
   * Logout (clear token)
   */
  const logout = useCallback(() => {
    clearToken();
  }, [clearToken]);

  /**
   * Check if token is expired or will expire soon
   */
  const isTokenExpired = useCallback(() => {
    if (!authState.expiresAt) return true;
    // Consider expired if less than 5 minutes remaining
    return Date.now() >= authState.expiresAt - 5 * 60 * 1000;
  }, [authState.expiresAt]);

  /**
   * Get auth headers for API requests
   */
  const getAuthHeaders = useCallback(() => {
    if (!authState.token) return {};
    return {
      Authorization: `Bearer ${authState.token}`,
    };
  }, [authState.token]);

  /**
   * Ensure authenticated - re-authenticate if needed
   */
  const ensureAuthenticated = useCallback(async () => {
    if (authState.isAuthenticated && !isTokenExpired()) {
      return authState.token;
    }

    return await authenticate();
  }, [authState.isAuthenticated, authState.token, isTokenExpired, authenticate]);

  return {
    ...authState,
    authenticate,
    logout,
    clearToken,
    isTokenExpired,
    getAuthHeaders,
    ensureAuthenticated,
  };
}
