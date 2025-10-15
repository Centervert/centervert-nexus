import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { z } from 'zod';
import centervertLogo from '@/assets/centervert-logo.png';
import gradientBg from '@/assets/gradient-bg.jpg';

const authSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  fullName: z.string().min(2, { message: 'Name must be at least 2 characters' }).optional(),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = isLogin
        ? { email, password }
        : { email, password, fullName };

      const validation = authSchema.safeParse(data);

      if (!validation.success) {
        const errors = validation.error.errors.map(err => err.message).join(', ');
        toast.error(errors);
        setLoading(false);
        return;
      }

      if (isLogin) {
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
        const redirectUrl = `${window.location.origin}/dashboard`;

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
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

  return (
    <div className="relative flex min-h-screen">
      {/* Background with gradient */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${gradientBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex w-full">
        {/* Left side - Form */}
        <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="mb-8 animate-fade-in">
              <img src={centervertLogo} alt="Centervert" className="h-12" />
            </div>

            {/* Form Card */}
            <div className="rounded-2xl bg-black/40 p-8 backdrop-blur-xl border border-white/10 shadow-2xl animate-scale-in">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {isLogin ? 'Welcome back' : 'Create account'}
                </h1>
                <p className="text-gray-300">
                  {isLogin
                    ? 'Sign in to access your tickets and projects'
                    : 'Start managing your tickets and collaborate with your team'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-white text-sm font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-11 focus:bg-white/20 focus:border-white/40 transition-all"
                    />
                  </div>
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
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
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
                  {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                </Button>
              </form>

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
            </div>
          </div>
        </div>

        {/* Right side - Decorative content (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <div className="max-w-lg space-y-8 text-white animate-fade-in">
            <div className="space-y-4">
              <div className="inline-block rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                ✨ Streamlined Workflow
              </div>
              <h2 className="text-5xl font-bold leading-tight">
                Manage tickets with ease
              </h2>
              <p className="text-xl text-white/80 leading-relaxed">
                Centervert Portal provides a seamless experience for tracking, managing, 
                and resolving support requests efficiently.
              </p>
            </div>

            <div className="space-y-4 pt-8">
              <div className="flex items-start gap-4 rounded-xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Real-time Updates</h3>
                  <p className="text-sm text-white/70">Get instant notifications on ticket status changes</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Team Collaboration</h3>
                  <p className="text-sm text-white/70">Work together seamlessly with your team</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl bg-white/5 p-4 backdrop-blur-sm border border-white/10">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Secure & Reliable</h3>
                  <p className="text-sm text-white/70">Enterprise-grade security for your data</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
