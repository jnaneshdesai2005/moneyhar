import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, MessageSquare, BarChart3, LogOut, Send, ArrowUpRight, ArrowDownLeft, User } from "lucide-react";
import { PaymentDialog } from "@/components/PaymentDialog";
import { AIChat } from "@/components/AIChat";
import { Analytics } from "@/components/Analytics";
import { toast } from "sonner";

interface Profile {
  balance: number;
  phone: string;
  email?: string;
  name?: string;
}

interface Transaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  category: string;
  description: string | null;
  created_at: string;
  sender_profile?: any;
  receiver_profile?: any;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    if (user) {
      loadProfile();
      loadTransactions();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      // First try to get all fields from profiles table
      let query = supabase.from("profiles").select("*").eq("id", user?.id).single();
      
      const { data, error } = await query;

      if (error) {
        // If there's an error, try a simpler query
        console.log("Primary profile query failed, trying alternative approach...");
        throw error;
      }
      
      setProfile(data);
    } catch (error: any) {
      console.error("Profile loading error:", error);
      // Even if we can't load the profile, we can still show the user's name from auth
      toast.error("Failed to load complete profile");
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      // First try to get transactions with all profile information including names
      let query = supabase
        .from("transactions")
        .select(`
          *,
          sender_profile:profiles!transactions_sender_id_fkey(name, phone, email),
          receiver_profile:profiles!transactions_receiver_id_fkey(name, phone, email)
        `)
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order("created_at", { ascending: false })
        .limit(10);

      const { data, error } = await query;

      if (error) {
        // If the above query fails due to missing columns, try a simpler query
        console.log("Detailed profile query failed, trying simpler approach...");
        const { data: simpleData, error: simpleError } = await supabase
          .from("transactions")
          .select(`
            *,
            sender_profile:profiles!transactions_sender_id_fkey(phone),
            receiver_profile:profiles!transactions_receiver_id_fkey(phone)
          `)
          .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
          .order("created_at", { ascending: false })
          .limit(10);
      
        if (simpleError) throw simpleError;
        setTransactions(simpleData || []);
      } else {
        setTransactions(data || []);
      }
    } catch (error: any) {
      console.error("Transaction loading error:", error);
      toast.error("Failed to load transactions");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Helper function to get user name with fallbacks
  const getUserName = (profile: any): string => {
    if (!profile) return 'Unknown User';
    
    // Try to get name first
    if (profile.name && profile.name.trim() !== '') {
      return profile.name;
    }
    
    // Try to get email and derive name from it
    if (profile.email && profile.email.trim() !== '') {
      return profile.email.split('@')[0];
    }
    
    // Fall back to phone number
    if (profile.phone && profile.phone.trim() !== '') {
      return profile.phone;
    }
    
    return 'Unknown User';
  };

  // Enhanced user name detection with multiple fallbacks including direct auth user data
  const displayName = profile?.name || 
                  user?.user_metadata?.name || 
                  (user?.email ? user.email.split('@')[0] : '') ||
                  (profile?.email ? profile.email.split('@')[0] : '') ||
                  'MoneyMitra User';

  // Debug logging to see what data is available
  console.log('User data:', user);
  console.log('Profile data:', profile);
  console.log('Display name:', displayName);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 relative">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            MoneyMitra
          </h1>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">AI Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <Card className="border-2 shadow-lg overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-accent"></div>
              <CardHeader>
                <CardDescription>Total Balance</CardDescription>
                <CardTitle className="text-4xl font-bold">
                  ₹{profile?.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentDialog onSuccess={() => { loadProfile(); loadTransactions(); }}>
                  <Button className="w-full" size="lg">
                    <Send className="w-4 h-4 mr-2" />
                    Send Money
                  </Button>
                </PaymentDialog>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest payment activity</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => {
                      const isSent = tx.sender_id === user?.id;
                      const otherParty = isSent ? tx.receiver_profile : tx.sender_profile;
                      
                      // Get the user name using our helper function
                      const otherPartyName = getUserName(otherParty);
                      
                      return (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isSent ? 'bg-destructive/10' : 'bg-success/10'}`}>
                              {isSent ? (
                                <ArrowUpRight className="w-4 h-4 text-destructive" />
                              ) : (
                                <ArrowDownLeft className="w-4 h-4 text-success" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {isSent ? 'Sent to ' : 'Received from '}
                                <span className="font-bold">{otherPartyName}</span>
                              </p>
                              <p className="text-sm text-muted-foreground">{tx.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${isSent ? 'text-destructive' : 'text-success'}`}>
                              {isSent ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.created_at).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai">
            <AIChat />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics transactions={transactions} />
          </TabsContent>
        </Tabs>
      </main>

      {/* User info display at bottom-left as per user preference */}
      <div className="fixed bottom-4 left-4 bg-card/80 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-full">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">{profile?.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}