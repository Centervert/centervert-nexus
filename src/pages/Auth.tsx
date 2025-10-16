import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';
import centervertLogo from '@/assets/centervert-logo-white.png';
import { useQuery } from '@tanstack/react-query';

const authSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  fullName: z.string().min(2, { message: 'Name must be at least 2 characters' }).optional(),
  phone: z.string().optional(),
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  
  const [isLogin, setIsLogin] = useState(!inviteToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Validate invitation token
  const { data: invitationData, isLoading: isValidating } = useQuery({
    queryKey: ['validate-invitation', inviteToken],
    queryFn: async () => {
      if (!inviteToken) return null;
      
      const { data, error } = await supabase.functions.invoke('validate-invitation', {
        body: { token: inviteToken },
      });

      if (error) throw error;
      return data;
    },
    enabled: !!inviteToken,
  });

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (invitationData?.email) {
      setEmail(invitationData.email);
    }
  }, [invitationData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (inviteToken) {
        // Handle invitation signup
        const validation = authSchema.safeParse({
          email,
          password,
          fullName: `${firstName} ${lastName}`,
          phone,
        });

        if (!validation.success) {
          const errors = validation.error.errors.map(err => err.message).join(', ');
          toast.error(errors);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke('accept-invitation', {
          body: {
            token: inviteToken,
            email,
            password,
            first_name: firstName,
            last_name: lastName,
            phone,
          },
        });

        if (error) {
          toast.error(error.message || 'Failed to accept invitation');
          return;
        }

        toast.success('Account created successfully! You can now sign in.');
        
        // Auto sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          toast.error('Please sign in with your new credentials');
          navigate('/auth');
        } else {
          navigate('/dashboard');
        }
      } else if (isLogin) {
        // Regular login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success('Logged in successfully!');
        navigate('/dashboard');
      } else {
        // Regular signup
        const validation = authSchema.safeParse({
          email,
          password,
          fullName: `${firstName} ${lastName}`,
        });

        if (!validation.success) {
          const errors = validation.error.errors.map(err => err.message).join(', ');
          toast.error(errors);
          setLoading(false);
          return;
        }

        const redirectUrl = `${window.location.origin}/dashboard`;

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: `${firstName} ${lastName}`,
            },
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please sign in.');
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success('Account created! You can now sign in.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500">
        <div className="text-white text-xl">Validating invitation...</div>
      </div>
    );
  }

  if (inviteToken && invitationData?.error) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-4">Invalid Invitation</h1>
          <p className="text-white/80 mb-6">{invitationData.error}</p>
          <Button onClick={() => navigate('/auth')} className="bg-white text-black hover:bg-white/90">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500">
      <div className="relative z-10 w-full max-w-md p-8">
        <div className="rounded-2xl bg-black/40 p-8 backdrop-blur-xl border border-white/10 shadow-2xl animate-scale-in">
          <div className="mb-8 flex justify-center animate-fade-in">
            <img src={centervertLogo} alt="Centervert" className="h-12" />
          </div>

          <div className="mb-8">
            {inviteToken && invitationData ? (
              <>
                <h1 className="text-3xl font-bold text-white mb-2">Welcome!</h1>
                <p className="text-gray-300">
                  You've been invited to join as <strong className="text-white">{invitationData.role}</strong>
                  {invitationData.client_name && (
                    <> for <strong className="text-white">{invitationData.client_name}</strong></>
                  )}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {isLogin ? 'Welcome back' : 'Create account'}
                </h1>
                <p className="text-gray-300">
                  {isLogin
                    ? 'Sign in to access your tickets and projects'
                    : 'Start managing your tickets and collaborate with your team'}
                </p>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {(!isLogin || inviteToken) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-white text-sm font-medium">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Enter your first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-11 focus:bg-white/20 focus:border-white/40 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-white text-sm font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-11 focus:bg-white/20 focus:border-white/40 transition-all"
                  />
                </div>

                {inviteToken && (
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white text-sm font-medium">
                      Phone Number <span className="text-gray-400">(optional)</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-11 focus:bg-white/20 focus:border-white/40 transition-all"
                    />
                  </div>
                )}
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-11 focus:bg-white/20 focus:border-white/40 transition-all"
              />
            </div>

            {inviteToken && invitationData?.client_name && (
              <div className="space-y-2">
                <Label htmlFor="company" className="text-white text-sm font-medium">
                  Company
                </Label>
                <Input
                  id="company"
                  value={invitationData.client_name}
                  disabled
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-11 opacity-70"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white text-sm font-medium">
                {inviteToken ? 'Create password' : 'Password'}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={inviteToken ? 'Create your password' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-11 focus:bg-white/20 focus:border-white/40 transition-all"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-white text-black hover:bg-white/90 font-semibold transition-all hover:scale-[1.02]" 
              disabled={loading}
            >
              {loading ? 'Processing...' : inviteToken ? 'Accept Invitation' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {!inviteToken && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                {isLogin ? (
                  <>
                    Don't have an account?{' '}
                    <span className="font-semibold text-white">Sign up</span>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <span className="font-semibold text-white">Sign in</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
