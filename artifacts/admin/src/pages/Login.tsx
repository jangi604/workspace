import { useState } from "react";
import { adminSignIn } from "@/lib/api";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wifi, AlertCircle } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminSignIn(email, password);
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 border-r border-border bg-card">
        <div className="mx-auto w-full max-w-sm lg:w-96 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-primary p-2 rounded-lg">
              <Wifi className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">Jangi Fiber</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in to Operations
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your admin credentials to access the control center.
          </p>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-destructive-foreground bg-destructive rounded-md flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jangifiber.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </div>
        </div>
      </div>
      <div className="hidden lg:block relative flex-1 bg-primary/5">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/40 backdrop-blur-[2px]" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md text-primary-foreground space-y-6">
            <h1 className="text-4xl font-bold tracking-tight leading-tight">
              Fast, reliable connectivity for everyone.
            </h1>
            <p className="text-lg opacity-90 leading-relaxed">
              Managing thousands of active connections across the region with robust infrastructure and prompt support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
