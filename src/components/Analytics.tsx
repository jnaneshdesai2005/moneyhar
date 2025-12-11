import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface Transaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  category: string;
  created_at: string;
}

interface AnalyticsProps {
  transactions: Transaction[];
}

export function Analytics({ transactions }: AnalyticsProps) {
  // Calculate spending by category
  const categorySpending = transactions.reduce((acc, tx) => {
    if (!acc[tx.category]) {
      acc[tx.category] = 0;
    }
    acc[tx.category] += tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const categories = Object.entries(categorySpending).sort((a, b) => b[1] - a[1]);
  const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const maxCategorySpend = categories.length > 0 ? categories[0][1] : 0;

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <CardTitle>Spending Overview</CardTitle>
          </div>
          <CardDescription>Your transaction insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total Transactions</span>
              </div>
              <p className="text-2xl font-bold">₹{totalSpent.toLocaleString('en-IN')}</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-sm text-muted-foreground">Total Count</span>
              </div>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Spending by Category</h3>
            {categories.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No transactions to analyze yet
              </p>
            ) : (
              categories.map(([category, amount]) => {
                const percentage = maxCategorySpend > 0 ? (amount / maxCategorySpend) * 100 : 0;
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{category}</span>
                      <span className="text-muted-foreground">
                        ₹{amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-gradient-to-br from-success/10 to-success/5 border-success/20">
        <CardHeader>
          <CardTitle className="text-success">Financial Tips</CardTitle>
          <CardDescription>Based on your spending patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">• Try to limit spending in your top category</p>
          <p className="text-sm">• Set monthly budgets for each category</p>
          <p className="text-sm">• Use the AI assistant for personalized advice</p>
        </CardContent>
      </Card>
    </div>
  );
}
