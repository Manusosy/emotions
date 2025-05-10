import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useAuth } from "@/hooks/use-auth";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, isAuthenticating, getDashboardUrlForRole, signout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleSignout = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Header: Sign out button clicked');
    try {
      await signout();
      navigate('/');
    } catch (error) {
      console.error('Error during signout in header:', error);
    }
  };

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = getDashboardUrlForRole(user?.role || null);
    console.log('Header: Dashboard button clicked, navigating to:', url);
    navigate(url);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    console.log('Header auth state:', { isAuthenticated, user });
  }, [isAuthenticated, user]);

  return (
    <header className="fixed top-0 w-full bg-[#0078FF] text-white z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="relative">
            <img 
              src="/assets/emotions-app-logo.png" 
              alt="Emotions Logo" 
              className="h-6 md:h-8 relative"
            />
          </Link>

          <div className="hidden md:flex items-center space-x-4 lg:space-x-8 flex-1 justify-center">
            <nav className="flex items-center space-x-4 lg:space-x-8">
              <Link to="/" className="text-white/90 hover:text-white transition-colors text-sm lg:text-base">Home</Link>
              <Link to="/therapists" className="text-white/90 hover:text-white transition-colors text-sm lg:text-base">Therapists</Link>
              <Link to="/journal" className="text-white/90 hover:text-white transition-colors text-sm lg:text-base">Journal</Link>
              <Link to="/mood-mentors" className="text-white/90 hover:text-white transition-colors text-sm lg:text-base">Mood Mentors</Link>
              <Link to="/resource-center" className="text-white/90 hover:text-white transition-colors text-sm lg:text-base">Resource Center</Link>
              <Link to="/help-groups" className="text-white/90 hover:text-white transition-colors text-sm lg:text-base">Help Groups</Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:bg-white/10 text-sm" 
                  onClick={handleDashboardClick}
                >
                  Dashboard
                </Button>
                <Button 
                  size="sm" 
                  className="bg-white text-[#0078FF] hover:bg-white/90 text-sm flex items-center gap-1"
                  onClick={handleSignout}
                  disabled={isAuthenticating}
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isAuthenticating ? 'Signing out...' : 'Signout'}</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 text-sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" className="bg-white text-[#0078FF] hover:bg-white/90 text-sm" asChild>
                  <Link to="/signup">Register</Link>
                </Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            className="md:hidden text-white hover:bg-white/10 p-1.5"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </Button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#0078FF] py-3 px-4 border-t border-white/10 shadow-lg">
            <nav className="flex flex-col space-y-2">
              <Link 
                to="/" 
                className="text-white/90 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/therapists" 
                className="text-white/90 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Therapists
              </Link>
              <Link 
                to="/journal" 
                className="text-white/90 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Journal
              </Link>
              <Link 
                to="/mood-mentors" 
                className="text-white/90 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Mood Mentors
              </Link>
              <Link 
                to="/resource-center" 
                className="text-white/90 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Resource Center
              </Link>
              <Link 
                to="/help-groups" 
                className="text-white/90 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Help Groups
              </Link>
              <div className="flex flex-col space-y-2 pt-3 border-t border-white/10">
                {isAuthenticated ? (
                  <>
                    <Button 
                      variant="ghost" 
                      className="w-full text-white hover:bg-white/10 py-2 text-sm justify-start" 
                      onClick={() => {
                        handleDashboardClick({ preventDefault: () => {} } as React.MouseEvent);
                      }}
                    >
                      Dashboard
                    </Button>
                    <Button 
                      className="w-full bg-white text-[#0078FF] hover:bg-white/90 py-2 text-sm flex items-center justify-center gap-1" 
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleSignout({ preventDefault: () => {} } as React.MouseEvent);
                      }}
                      disabled={isAuthenticating}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{isAuthenticating ? 'Signing out...' : 'Signout'}</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      className="w-full text-white hover:bg-white/10 py-2 text-sm justify-start"
                      onClick={() => {
                        navigate('/login');
                        setIsMenuOpen(false);
                      }}
                    >
                      Login
                    </Button>
                    <Button 
                      className="w-full bg-white text-[#0078FF] hover:bg-white/90 py-2 text-sm"
                      onClick={() => {
                        navigate('/signup');
                        setIsMenuOpen(false);
                      }}
                    >
                      Register
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
