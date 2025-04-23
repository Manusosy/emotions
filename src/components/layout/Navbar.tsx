import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [localAuthState, setLocalAuthState] = useState({ isAuthenticated: false, userRole: null });
  const { isAuthenticated, userRole, logout: signout, getDashboardUrlForRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu on location change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Check localStorage for auth state on mount and when auth context changes
  useEffect(() => {
    const checkLocalStorage = () => {
      const storedAuthState = localStorage.getItem('auth_state');
      if (storedAuthState) {
        try {
          const { isAuthenticated, userRole } = JSON.parse(storedAuthState);
          setLocalAuthState({ isAuthenticated, userRole });
        } catch (e) {
          console.error("Error parsing stored auth state:", e);
          setLocalAuthState({ isAuthenticated: false, userRole: null });
        }
      } else {
        setLocalAuthState({ isAuthenticated: false, userRole: null });
      }
    };
    
    checkLocalStorage();
    
    // Listen for storage events (if another tab changes localStorage)
    window.addEventListener('storage', checkLocalStorage);
    return () => window.removeEventListener('storage', checkLocalStorage);
  }, [isAuthenticated, userRole]);

  // Combine context and localStorage auth state for most reliable determination
  const effectiveIsAuthenticated = isAuthenticated || localAuthState.isAuthenticated;
  const effectiveUserRole = userRole || localAuthState.userRole;

  const handleSignout = async () => {
    try {
      setIsMobileMenuOpen(false);
      console.log("Starting signout...");
      
      await signout();
      // After signout, let the auth state handle the redirect
    } catch (error) {
      console.error("Signout failed:", error);
    }
  };

  const dashboardUrl = effectiveUserRole ? getDashboardUrlForRole(effectiveUserRole) : '/';

  // Enhanced navigation handler that closes menu and handles navigation
  const handleNavigation = useCallback((path: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    setIsMobileMenuOpen(false);
    navigate(path);
  }, [navigate]);

  // Toggle menu state
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  return (
    <nav className="bg-[#0078FF] text-white relative z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link 
            to="/" 
            onClick={(e) => handleNavigation('/', e)} 
            className="flex items-center"
          >
            <img 
              src="/assets/emotions-app-logo.png" 
              alt="Emotions Logo" 
              className="h-7 md:h-9 relative"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center space-x-1 bg-blue-600/30 backdrop-blur-sm rounded-full px-2 py-1.5">
              <Link to="/" className="text-white/90 hover:text-white px-4 py-1.5 rounded-full transition-all hover:bg-[#fda802] text-sm font-medium">
                Home
              </Link>
              <Link to="/journal" className="text-white/90 hover:text-white px-4 py-1.5 rounded-full transition-all hover:bg-[#fda802] text-sm font-medium">
                Journal
              </Link>
              <Link to="/ambassadors" className="text-white/90 hover:text-white px-4 py-1.5 rounded-full transition-all hover:bg-[#fda802] text-sm font-medium">
                Mental Health Ambassadors
              </Link>
              <Link to="/resources" className="text-white/90 hover:text-white px-4 py-1.5 rounded-full transition-all hover:bg-[#fda802] text-sm font-medium">
                Resource Center
              </Link>
              <Link to="/help-groups" className="text-white/90 hover:text-white px-4 py-1.5 rounded-full transition-all hover:bg-[#fda802] text-sm font-medium">
                Help Groups
              </Link>
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            {effectiveIsAuthenticated ? (
              <>
                <Link to={dashboardUrl}>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:bg-[#fda802] rounded-full px-6 font-medium transition-all"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={handleSignout}
                  className="text-white hover:bg-[#fda802] rounded-full px-6 font-medium transition-all"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Signout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    className="text-white hover:bg-[#fda802] rounded-full px-6 font-medium transition-all"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button 
                    className="bg-white text-[#0078FF] hover:bg-[#fda802] hover:text-white rounded-full px-6 font-medium shadow-sm shadow-blue-600/20 transition-all"
                  >
                    Signup
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Auth Buttons */}
          <div className="flex md:hidden items-center space-x-4 mr-4">
            {effectiveIsAuthenticated ? (
              <div className="flex items-center space-x-2">
                <a 
                  href={dashboardUrl} 
                  onClick={(e) => handleNavigation(dashboardUrl, e)}
                >
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-white hover:bg-[#fda802] rounded-full font-medium transition-all flex items-center"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-1" />
                    <span className="text-xs">Dashboard</span>
                  </Button>
                </a>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSignout}
                  className="text-white hover:bg-[#fda802] rounded-full font-medium transition-all flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span className="text-xs">Signout</span>
                </Button>
              </div>
            ) : (
              <>
                <a 
                  href="/login" 
                  onClick={(e) => handleNavigation("/login", e)}
                  className="text-white hover:text-blue-100 font-medium px-3 py-1.5 text-base transition-colors"
                >
                  Login
                </a>
                <a 
                  href="/signup" 
                  onClick={(e) => handleNavigation("/signup", e)}
                >
                  <Button 
                    size="sm"
                    className="bg-white text-[#0078FF] hover:bg-[#fda802] hover:text-white rounded-full px-5 py-1 font-medium shadow-sm shadow-blue-600/20 transition-all"
                  >
                    Signup
                  </Button>
                </a>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-blue-600/50 transition-colors"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <a href="/" className="block px-4 py-2 hover:bg-[#fda802] rounded-lg transition-colors" onClick={(e) => handleNavigation("/", e)}>
              Home
            </a>
            <a href="/journal" className="block px-4 py-2 hover:bg-[#fda802] rounded-lg transition-colors" onClick={(e) => handleNavigation("/journal", e)}>
              Journal
            </a>
            <a href="/ambassadors" className="block px-4 py-2 hover:bg-[#fda802] rounded-lg transition-colors" onClick={(e) => handleNavigation("/ambassadors", e)}>
              Mental Health Ambassadors
            </a>
            <a href="/resources" className="block px-4 py-2 hover:bg-[#fda802] rounded-lg transition-colors" onClick={(e) => handleNavigation("/resources", e)}>
              Resource Center
            </a>
            <a href="/help-groups" className="block px-4 py-2 hover:bg-[#fda802] rounded-lg transition-colors" onClick={(e) => handleNavigation("/help-groups", e)}>
              Help Groups
            </a>
            
            {/* Mobile Menu Auth Buttons */}
            <div className="py-2 border-t border-blue-600/20">
              {effectiveIsAuthenticated ? (
                <>
                  <a href={dashboardUrl} className="block px-4 py-2 hover:bg-[#fda802] rounded-lg transition-colors" onClick={(e) => handleNavigation(dashboardUrl, e)}>
                    <span className="flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </span>
                  </a>
                  <button 
                    onClick={handleSignout}
                    className="w-full text-left px-4 py-2 hover:bg-[#fda802] rounded-lg transition-colors"
                  >
                    <span className="flex items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      Signout
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <a href="/login" className="block px-4 py-2 hover:bg-[#fda802] rounded-lg transition-colors" onClick={(e) => handleNavigation("/login", e)}>
                    Login
                  </a>
                  <a href="/signup" className="block px-4 py-2 hover:bg-[#fda802] rounded-lg transition-colors" onClick={(e) => handleNavigation("/signup", e)}>
                    Signup
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
