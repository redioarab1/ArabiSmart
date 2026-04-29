import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { usePageTracking } from "./hooks/usePageTracking";
import { useGoogleAnalytics } from "./hooks/useGoogleAnalytics";
import AdminGuard from "./components/AdminGuard";
import { Loader2 } from "lucide-react";

// ── Lazy-loaded Public Pages ──────────────────────────────────────────────────
const Home = lazy(() => import("./pages/Home"));
const Favorites = lazy(() => import("./pages/Favorites"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const AdvancedSearch = lazy(() => import("./pages/AdvancedSearch"));
const Profile = lazy(() => import("./pages/Profile"));
const Archive = lazy(() => import("./pages/Archive"));
const Settings = lazy(() => import("./pages/Settings"));
const Folders = lazy(() => import("./pages/Folders"));
const FolderDetail = lazy(() => import("./pages/FolderDetail"));
const DailySummary = lazy(() => import("./pages/DailySummary"));
const Videos = lazy(() => import("./pages/Videos"));
const LiveTV = lazy(() => import("./pages/LiveTV"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MobileBottomNav = lazy(() => import("./components/MobileBottomNav"));

// ── Lazy-loaded Admin Pages ───────────────────────────────────────────────────
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminHome = lazy(() => import("./pages/admin/AdminHome"));
const AdminNews = lazy(() => import("./pages/admin/AdminNews"));
const AdminVideos = lazy(() => import("./pages/admin/AdminVideos"));
const AdminSources = lazy(() => import("./pages/admin/AdminSources"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminLiveTV = lazy(() => import("./pages/admin/AdminLiveTV"));
const AdminDailySummary = lazy(() => import("./pages/admin/AdminDailySummary"));
const AdminBreakingNews = lazy(() => import("./pages/admin/AdminBreakingNews"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminActivityLog = lazy(() => import("./pages/admin/AdminActivityLog"));

// ── Page Loading Fallback ─────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function Router() {
  usePageTracking();
  useGoogleAnalytics();
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public Routes */}
        <Route path={"/"} component={Home} />
        <Route path="/favorites" component={Favorites} />
        <Route path="/notifications" component={NotificationSettings} />
        <Route path="/news/:id" component={NewsDetail} />
        <Route path="/search" component={AdvancedSearch} />
        <Route path="/profile" component={Profile} />
        <Route path="/archive" component={Archive} />
        <Route path="/settings" component={Settings} />
        <Route path="/folders" component={Folders} />
        <Route path="/folders/:id" component={FolderDetail} />
        <Route path="/daily-summary" component={DailySummary} />
        <Route path="/videos" component={Videos} />
        <Route path="/live" component={LiveTV} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />

        {/* Admin Login - Public */}
        <Route path="/admin/login" component={AdminLogin} />

        {/* Admin Routes - Protected */}
        <Route path="/admin">
          {() => <AdminGuard><AdminHome /></AdminGuard>}
        </Route>
        <Route path="/admin/news">
          {() => <AdminGuard><AdminNews /></AdminGuard>}
        </Route>
        <Route path="/admin/videos">
          {() => <AdminGuard><AdminVideos /></AdminGuard>}
        </Route>
        <Route path="/admin/sources">
          {() => <AdminGuard><AdminSources /></AdminGuard>}
        </Route>
        <Route path="/admin/users">
          {() => <AdminGuard><AdminUsers /></AdminGuard>}
        </Route>
        <Route path="/admin/settings">
          {() => <AdminGuard><AdminSettings /></AdminGuard>}
        </Route>
        <Route path="/admin/live">
          {() => <AdminGuard><AdminLiveTV /></AdminGuard>}
        </Route>
        <Route path="/admin/daily-summary">
          {() => <AdminGuard><AdminDailySummary /></AdminGuard>}
        </Route>
        <Route path="/admin/breaking-news">
          {() => <AdminGuard><AdminBreakingNews /></AdminGuard>}
        </Route>
        <Route path="/admin/analytics">
          {() => <AdminGuard><AdminAnalytics /></AdminGuard>}
        </Route>
        <Route path="/admin/activity-log">
          {() => <AdminGuard><AdminActivityLog /></AdminGuard>}
        </Route>

        {/* Fallback */}
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
          <Suspense fallback={null}>
            <MobileBottomNav />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
