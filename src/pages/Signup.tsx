import { useState, useEffect } from 'react';
import { auth, provider } from '../fire_base/firebaseConfig';
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { MdEmail, MdLock } from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';

const SignUp = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      window.location.href=('/dashboard')
    }
  }, []);

  const handleExistingAccount = async (email: string, password: string): Promise<void> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (result.user.uid) {
        localStorage.setItem('userInfo', JSON.stringify(result.user));
        window.location.href=('/dashboard')
      }
    } catch (error: any) {
      setError('Invalid password. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    setIsGoogleLoading(true);
    setError('');
    try {
      const result: UserCredential = await signInWithPopup(auth, provider);
      if (result.user.uid) {
        localStorage.setItem('userInfo', JSON.stringify(result.user));
        window.location.href=('/dashboard')
      }
    } catch (error) {
      console.error('Error signing in with Google: ', error);
      setError('Failed to sign in with Google. Please try again.');
    }
    setIsGoogleLoading(false);
  };

  const handleEmailSignUp = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if email exists
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      
      if (signInMethods.length > 0) {
        // Account exists, try to sign in
        await handleExistingAccount(email, password);
        return;
      }

      // If no existing account, create new one
      const result: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (result.user.uid) {
        localStorage.setItem('userInfo', JSON.stringify(result.user));
        window.location.href=('/dashboard')
      }
    } catch (error: any) {
      console.error('Error in authentication: ', error);
      
      // Handle specific Firebase error codes
      switch (error.code) {
        case 'auth/email-already-in-use':
          // Try to sign in with existing account
          await handleExistingAccount(email, password);
          break;
        case 'auth/invalid-email':
          setError('Invalid email address.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters.');
          break;
        case 'auth/invalid-credential':
          setError('Invalid password for existing account.');
          break;
        default:
          setError(error.message || 'Failed to authenticate. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <div className='w-[50%] h-screen flex justify-center items-center'>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md space-y-6 opacity-90">        
          <form onSubmit={handleEmailSignUp} className="w-[50% space-y-4">
            <div className='flex flex-col text-white gap-1'>
              <p className='text-xl font-bold text-purple-500'>Task Buddy</p>
              <p className='text-left text-xs w-[90%]'>Streamline your workflow and track progress effortlessly with our all-in-one task manager app.</p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-500"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-500"></span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-6 rounded-lg bg-gray-700 hover:bg-gray-600 
                        text-white text-lg font-semibold flex items-center justify-center gap-2
                        transition-all duration-300 border border-gray-500"
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : (
                <>
                  <FcGoogle className="text-xl" />
                  Continue with Google
                </>
              )}
            </button>
          </form>

        </div>
      </div>

      <div className='w-[50%] relative'>
        <img src="login.png" alt="homeImg" className='rounded-[10px_0_0_10px] w-full' />
      </div>
    </div>
  );
};

export default SignUp;