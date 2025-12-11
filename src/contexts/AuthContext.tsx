import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, phone: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          navigate('/');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signUp = async (email: string, password: string, phone: string, name?: string) => {
    try {
      // Validate inputs
      if (!email || !password || !phone) {
        throw new Error("All fields are required");
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Please enter a valid email address");
      }

      // Basic phone validation (assuming Indian format)
      const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
      if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
        throw new Error("Please enter a valid phone number");
      }

      // Use provided name or derive from email
      const userName = name || email.split('@')[0];

      const redirectUrl = `${window.location.origin}/`;
    
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          emailRedirectTo: redirectUrl,
          data: { 
            phone,
            email: email,
            name: userName
          }
        }
      });

      if (error) throw error;

      // After successful signup, update the profile with the name
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            name: userName,
            email: email,
            phone: phone
          })
          .eq('id', data.user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
        }
      
        // Also update user metadata
        const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            name: userName,
            phone: phone,
            email: email
          }
        });
      
        if (metadataError) {
          console.error("Metadata update error:", metadataError);
        }
      }

      toast.success("Account created successfully! Please check your email for verification.");
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = error.message || "Failed to create account";
      
      // Handle specific Supabase errors
      if (error.code === '23505') {
        if (error.message.includes('phone')) {
          errorMessage = "An account with this phone number already exists";
        } else if (error.message.includes('email')) {
          errorMessage = "An account with this email already exists";
        }
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success("Signed in successfully!");
    } catch (error: any) {
      console.error("Signin error:", error);
      let errorMessage = error.message || "Failed to sign in";
      
      // Handle specific Supabase errors
      if (error.status === 400) {
        errorMessage = "Invalid email or password";
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully!");
      navigate('/auth');
    } catch (error: any) {
      console.error("Signout error:", error);
      toast.error(error.message || "Failed to sign out");
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}