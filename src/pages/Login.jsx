import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to sign in: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 p-5 font-sans">
      <div className="max-w-md mx-auto bg-white p-5 rounded-lg shadow-sm border border-gray-300">
        <h2 className="text-center text-gray-800 mb-5 text-2xl font-normal">Login</h2>
        
        <form className="space-y-0" onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-gray-600 text-sm">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full p-2.5 mb-4 border border-gray-300 rounded text-black"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block mb-2 text-gray-600 text-sm">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full p-2.5 mb-4 border border-gray-300 rounded text-black"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Submit'}
          </button>
        </form>

        <p className="text-center mt-4">
          <Link 
            to="/admin-setup" 
            className="text-blue-600 no-underline hover:underline"
          >
            Set up admin account
          </Link>
        </p>
      </div>
    </div>
  );
}