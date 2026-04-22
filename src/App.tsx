import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/layout";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes — keeps the initial bundle small.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NewQuote = lazy(() => import("./pages/NewQuote"));
const Quotes = lazy(() => import("./pages/Quotes"));
const Products = lazy(() => import("./pages/Products"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Descriptions = lazy(() => import("./pages/Descriptions"));
const Settings = lazy(() => import("./pages/Settings"));
const Tools = lazy(() => import("./pages/Tools"));
const ToolPage = lazy(() => import("./pages/ToolPage"));
const Guide = lazy(() => import("./pages/Guide"));
const BugReport = lazy(() => import("./pages/BugReport"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex h-[60vh] items-center justify-center">
    <LoadingSpinner />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/tool/:toolId"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<RouteFallback />}>
                    <ToolPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<RouteFallback />}>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/new-quote" element={<NewQuote />} />
                        <Route path="/quotes" element={<Quotes />} />
                        <Route path="/gallery" element={<Gallery />} />
                        <Route path="/descriptions" element={<Descriptions />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/tools" element={<Tools />} />
                        <Route path="/guide" element={<Guide />} />
                        <Route path="/bug-report" element={<BugReport />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
