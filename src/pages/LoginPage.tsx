import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Grid, Column, Tile } from '@carbon/react';
import { useAuthStore } from '../store/authStore';
import LoginForm from '../components/auth/LoginForm';

const LoginPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Grid>
        <Column lg={8} md={6} sm={4} className="mx-auto">
          <Tile className="p-8">
            <h1 className="text-3xl font-bold mb-6">Log in to Document Manager</h1>
            <LoginForm />
            <div className="mt-6">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:underline">
                  Register
                </Link>
              </p>
            </div>
          </Tile>
        </Column>
      </Grid>
    </div>
  );
};

export default LoginPage;