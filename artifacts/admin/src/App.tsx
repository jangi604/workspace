import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Packages from '@/pages/Packages';
import Customers from '@/pages/Customers';
import Payments from '@/pages/Payments';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import Reports from '@/pages/Reports';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <h2 className="text-2xl font-bold">404 - Page Not Found</h2>
      <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
    </div>
  );
}

function ProtectedRoutes() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/packages" component={Packages} />
          <Route path="/customers" component={Customers} />
          <Route path="/payments" component={Payments} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/settings" component={Settings} />
          <Route path="/reports" component={Reports} />
          <Route path="/">
            {() => {
              window.location.href = '/dashboard';
              return null;
            }}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/:rest*" component={ProtectedRoutes} />
        </Switch>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
