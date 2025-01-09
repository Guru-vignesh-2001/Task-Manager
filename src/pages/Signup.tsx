import { useState, useEffect } from 'react';
import { auth, provider } from '../fire_base/firebaseConfig';
import { signInWithPopup, UserCredential } from 'firebase/auth';
import { Navigate } from 'react-router-dom';
import 'tailwindcss/tailwind.css';

const SignUp = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const result: UserCredential = await signInWithPopup(auth, provider);
      if (result.user.uid) {
        localStorage.setItem('userInfo', JSON.stringify(result.user));
        setUser(result.user); // Now TypeScript understands this is a valid User
      }
      setLoading(false);
    } catch (error) {
      console.error('Error signing in: ', error);
      // Reset loading state if sign-in was canceled or failed
      setLoading(false);
    }
  };

  // If the user is already signed in, redirect to the desired page
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-cover bg-center" 
         style={{ backgroundImage: "url('/api/placeholder/1600/900')" }}>
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md space-y-6 opacity-90">
        <h2 className="text-3xl font-bold text-center text-gray-800">Create Your Account</h2>
        <p className="text-center text-gray-600">Sign up with Google to get started</p>

        <button
          onClick={handleSignIn}
          className={`w-full py-3 px-6 rounded-lg text-white text-lg font-semibold
            ${loading ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'} 
            transition-all duration-300`}
          disabled={loading}
        >
          {loading ? (
            <div className="flex justify-center items-center">
              <div className="animate-spin border-t-2 border-white w-5 h-5 border-solid rounded-full" />
            </div>
          ) : (
            'Sign Up with Google'
          )}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <span className="text-blue-600 hover:text-blue-700 cursor-pointer font-semibold">
              Log In
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;