import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Sparkles, Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{signIn?: string, signUp?: string}>({});

  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({ email: "", password: "", phone: "", name: "", confirmPassword: "" });
  
  // State for password visibility
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateSignUp = () => {
    const newErrors: {signUp?: string} = {};
    
    // Name validation
    if (!signUpData.name) {
      newErrors.signUp = "Name is required";
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!signUpData.email) {
      newErrors.signUp = "Email is required";
    } else if (!emailRegex.test(signUpData.email)) {
      newErrors.signUp = "Please enter a valid email address";
    }
    
    // Phone validation
    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    if (!signUpData.phone) {
      newErrors.signUp = "Phone number is required";
    } else if (!phoneRegex.test(signUpData.phone.replace(/\s+/g, ''))) {
      newErrors.signUp = "Please enter a valid phone number";
    }
    
    // Password validation
    if (!signUpData.password) {
      newErrors.signUp = "Password is required";
    } else if (signUpData.password.length < 6) {
      newErrors.signUp = "Password must be at least 6 characters";
    }
    
    // Confirm password validation
    if (!signUpData.confirmPassword) {
      newErrors.signUp = "Please confirm your password";
    } else if (signUpData.password !== signUpData.confirmPassword) {
      newErrors.signUp = "Passwords do not match";
    }
    
    return newErrors;
  };

  const validateSignIn = () => {
    const newErrors: {signIn?: string} = {};
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!signInData.email) {
      newErrors.signIn = "Email is required";
    } else if (!emailRegex.test(signInData.email)) {
      newErrors.signIn = "Please enter a valid email address";
    }
    
    // Password validation
    if (!signInData.password) {
      newErrors.signIn = "Password is required";
    }
    
    return newErrors;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validateSignIn();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setIsLoading(true);
    try {
      await signIn(signInData.email, signInData.password);
    } catch (error: any) {
      setErrors({ signIn: error.message || "Failed to sign in" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validateSignUp();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setIsLoading(true);
    try {
      await signUp(signUpData.email, signUpData.password, signUpData.phone, signUpData.name);
    } catch (error: any) {
      setErrors({ signUp: error.message || "Failed to create account" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl mb-4 shadow-lg">
            <Wallet className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            MoneyMitra
          </h1>
          <p className="text-muted-foreground">Your AI-Powered Financial Companion</p>
        </div>

        <Card className="shadow-xl border-2">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in or create an account to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signInData.email}
                      onChange={(e) => {
                        setSignInData({ ...signInData, email: e.target.value });
                        if (errors.signIn) setErrors({});
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showSignInPassword ? "text" : "password"}
                        value={signInData.password}
                        onChange={(e) => {
                          setSignInData({ ...signInData, password: e.target.value });
                          if (errors.signIn) setErrors({});
                        }}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                      >
                        {showSignInPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  {errors.signIn && (
                    <div className="text-sm text-red-500">{errors.signIn}</div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signUpData.name}
                      onChange={(e) => {
                        setSignUpData({ ...signUpData, name: e.target.value });
                        if (errors.signUp) setErrors({});
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signUpData.email}
                      onChange={(e) => {
                        setSignUpData({ ...signUpData, email: e.target.value });
                        if (errors.signUp) setErrors({});
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={signUpData.phone}
                      onChange={(e) => {
                        setSignUpData({ ...signUpData, phone: e.target.value });
                        if (errors.signUp) setErrors({});
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignUpPassword ? "text" : "password"}
                        value={signUpData.password}
                        onChange={(e) => {
                          setSignUpData({ ...signUpData, password: e.target.value });
                          if (errors.signUp) setErrors({});
                        }}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      >
                        {showSignUpPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm"
                        type={showConfirmPassword ? "text" : "password"}
                        value={signUpData.confirmPassword}
                        onChange={(e) => {
                          setSignUpData({ ...signUpData, confirmPassword: e.target.value });
                          if (errors.signUp) setErrors({});
                        }}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  {errors.signUp && (
                    <div className="text-sm text-red-500">{errors.signUp}</div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    You'll get ₹50,000 as starting balance
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-1">
          <Sparkles className="w-4 h-4" />
          <span>Powered by AI Financial Intelligence</span>
        </div>
      </div>
    </div>
  );
}