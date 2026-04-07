import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Favorites from "./pages/Favorites";
import NotificationSettings from "./pages/NotificationSettings";
import NewsDetail from "./pages/NewsDetail";
import AdvancedSearch from "./pages/AdvancedSearch";
import Profile from "./pages/Profile";
import Archive from "./pages/Archive";
import Settings from "./pages/Settings";
import Folders from "./pages/Folders";
import FolderDetail from "./pages/FolderDetail";
import DailySummary from "./pages/DailySummary";
import Videos from "./pages/Videos";
import LiveTV from "./pages/LiveTV";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import MobileBottomNav from "./components/MobileBottomNav";

// Admin Pages
import AdminHome from "./pages/admin/AdminHome";
import AdminNews from "./pages/admin/AdminNews";
import AdminVideos from "./pages/admin/AdminVideos";
import AdminSources from "./pages/admin/AdminSources";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminLiveTV from "./pages/admin/AdminLiveTV";
import AdminDailySummary from "./pages/admin/AdminDailySummary";
import AdminBreakingNews from "./pages/admin/AdminBreakingNews";

function Router() {
  return (
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

      {/* Admin Routes */}
      <Route path="/admin" component={AdminHome} />
      <Route path="/admin/news" component={AdminNews} />
      <Route path="/admin/videos" component={AdminVideos} />
      <Route path="/admin/sources" component={AdminSources} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/live" component={AdminLiveTV} />
      <Route path="/admin/daily-summary" component={AdminDailySummary} />
      <Route path="/admin/breaking-news" component={AdminBreakingNews} />

      {/* Fallback */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
          <MobileBottomNav />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
