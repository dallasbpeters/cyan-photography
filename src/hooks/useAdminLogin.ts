import { useState } from 'react';
import type { FormEvent } from 'react';
import { authApi, authStorage } from '../services/portfolioService';
import { toast } from 'sonner';

export type AdminLoginResult = {
  email: string;
  setEmail: (e: string) => void;
  password: string;
  setPassword: (p: string) => void;
  isSubmitting: boolean;
  handleLogin: (e: FormEvent) => Promise<void>;
};

export const useAdminLogin = (onLogin: () => void): AdminLoginResult => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { token } = await authApi.login(email, password);
      authStorage.setToken(token);
      setPassword('');
      toast.success('Signed in');
      onLogin();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { email, setEmail, password, setPassword, isSubmitting, handleLogin };
};
