import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import { motion } from 'framer-motion';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { createGuestUser } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';

const GuestLogin = () => {
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleChange = (e) => {
    setGuestName(e.target.value);
    setError('');
  };

  const validateForm = () => {
    if (!guestName.trim()) {
      setError('Please enter a display name');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setAlert(null);
    
    try {
      const response = await createGuestUser(guestName);
      setUser(response.user);
      navigate('/dashboard');
    } catch (error) {
      console.error('Guest login error:', error);
      
      setAlert({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Unable to create guest account. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout imageUrl="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Continue as Guest</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Create or vote on polls without registering
          </p>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                Guest accounts have limited features and data may be lost if cookies are cleared. You can convert to a full account later.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="guestName"
            name="guestName"
            type="text"
            label="Display Name"
            placeholder="Enter a name to use on polls"
            value={guestName}
            onChange={handleChange}
            error={error}
            required
            icon={<FaUser />}
          />

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            disabled={isLoading}
          >
            Continue as Guest
          </Button>
        </form>
      </motion.div>
    </AuthLayout>
  );
};

export default GuestLogin;
