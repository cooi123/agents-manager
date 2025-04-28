import React, { useState } from 'react';
import {
  Form,
  TextInput,
  PasswordInput,
  Button,
  InlineNotification,
  Stack,
} from '@carbon/react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error: signUpError, user } = await signUp(email, password);
      
      if (signUpError) {
        setError(signUpError.message);
      } else if (user) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Stack gap={7}>
        {error && (
          <InlineNotification
            kind="error"
            title="Error"
            subtitle={error}
            hideCloseButton
          />
        )}
        
        <TextInput
          id="email"
          labelText="Email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <PasswordInput
          id="password"
          labelText="Password"
          placeholder="Create a password"
          helperText="Password must be at least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <PasswordInput
          id="confirmPassword"
          labelText="Confirm Password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </Stack>
    </Form>
  );
};

export default RegisterForm;