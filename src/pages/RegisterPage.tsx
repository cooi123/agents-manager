import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Grid, Column, Tile } from '@carbon/react';
import { useAuthStore } from '../store/authStore';
import RegisterForm from '../components/auth/RegisterForm';

const RegisterPage: React.FC = () => {
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
            <h1 className="text-3xl font-bold mb-6">Create an account</h1>
            <RegisterForm />
            <div className="mt-6">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </Tile>
        </Column>
      </Grid>
    </div>
  );
};

export default RegisterPage;