import { usePaymentRequests, useDashboardStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, CartesianGrid, PieChart, Pie, Legend } from "recharts";

export default function Reports() {
  const { data: payments = [], isLoading: pLoading } = usePaymentRequests();
  const { data: stats, isLoading: sLoading } = useDashboardStats();

  if (pLoading || sLoading) return <div className="animate-pulse flex gap-4 flex-col"><div className="h-10 w-32 bg-muted rounded" /><div className="h-[400px] w-full bg-muted rounded" /></div>;

  // 1. Payment Funnel
  const pending = payments.filter(p => p.status === 'pending').length;
  const approved = payments.filter(p => p.status === 'approved').length;
  const rejected = payments.filter(p => p.status === 'rejected').length;

  const funnelData = [
    { name: 'Pending', value: pending, color: 'hsl(38 92% 50%)' }, // yellow
    { name: 'Approved', value: approved, color: 'hsl(var(--primary))' }, // green
    { name: 'Rejected', value: rejected, color: 'hsl(var(--destructive))' }, // red
  ];

  // 2. Revenue Trend (last 6 months by decidedAt)
  const monthlyData: Record<string, number> = {};
  payments.forEach(p => {
    if (p.status === 'approved' && p.decidedAt) {
      const d = new Date(p.decidedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = (monthlyData[key] || 0) + p.amount;
    }
  });

  const trendData = Object.keys(monthlyData).sort().slice(-6).map(k => {
    const [y, m] = k.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      revenue: monthlyData[k]
    };
  });

  // 3. Package Popularity
  const packageData = stats?.packageStats
    .filter(p => p.activeSubscribers > 0)
    .map(p => ({
      name: p.packageName,
      value: p.activeSubscribers
    })) || [];

  const COLORS = ['hsl(150 80% 25%)', 'hsl(150 50% 40%)', 'hsl(150 30% 60%)', 'hsl(150 20% 80%)'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics & Reports</h2>
        <p className="text-muted-foreground mt-1 text-sm">Visual insights into your ISP's performance.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Revenue Trend */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
            <CardDescription>Total approved payments over time.</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `Rs.${v/1000}k`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
              {trendData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                  Not enough historical data.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Decisions */}
        <Card className="col-span-full md:col-span-1">
          <CardHeader>
            <CardTitle>Payment Approvals</CardTitle>
            <CardDescription>Status breakdown of all requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={funnelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Popular Packages */}
        <Card className="col-span-full md:col-span-2">
          <CardHeader>
            <CardTitle>Package Distribution</CardTitle>
            <CardDescription>Currently active subscriptions.</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={packageData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {packageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {packageData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  No active subscriptions.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
