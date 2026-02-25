import { useAuth as useClerkAuth } from '@clerk/clerk-expo';
import { useState, useEffect } from 'react';

export function useAuth() {
  const { isLoaded, isSignedIn, user, signOut, signIn, signUp } = useClerkAuth();
  const [loading, setLoading] = useState(false);

  const customSignIn = async (identifier: string, password: string) => {
    try {
      setLoading(true);
      const result = await signIn.create({
        identifier,
        password,
      });
      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const customSignUp = async (emailAddress: string, password: string, firstName: string, lastName: string) => {
    try {
      setLoading(true);
      const result = await signUp.create({
        emailAddress,
        password,
        firstName,
        lastName,
      });
      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const customSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  return {
    isLoaded,
    isSignedIn,
    user,
    loading,
    signIn: customSignIn,
    signUp: customSignUp,
    signOut: customSignOut,
  };
}