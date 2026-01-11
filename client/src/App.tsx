import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import FinanceDashboardLayout from "./components/FinanceDashboardLayout";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import CreditCards from "./pages/CreditCards";
import Transactions from "./pages/Transactions";
import Upload from "./pages/Upload";
import Categories from "./pages/Categories";
import Recommendations from "./pages/Recommendations";

function Router() {
  return (
    <FinanceDashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/cards" component={CreditCards} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/upload" component={Upload} />
        <Route path="/categories" component={Categories} />
        <Route path="/recommendations" component={Recommendations} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </FinanceDashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
