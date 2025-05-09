import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { signOut } = useAuth();

  const isActivePath = (path: string) => {
    return pathname === path;
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
  };

  return (
    <header className="bg-card border-b border-border relative">
      <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <img src="/Control.png" alt="Control Logo" className="h-8 md:h-10 w-auto" />
        </Link>
        <nav className="hidden md:block">
          <ul className="flex space-x-6">
            <li>
              <Link 
                to="/" 
                className={cn(
                  "transition-colors",
                  isActivePath("/") 
                    ? "text-[#e4ff00] font-medium" 
                    : "text-muted-foreground hover:text-[#e4ff00]"
                )}
              >
                Início
              </Link>
            </li>
            <li>
              <Link 
                to="/transactions" 
                className={cn(
                  "transition-colors",
                  isActivePath("/transactions") 
                    ? "text-[#e4ff00] font-medium" 
                    : "text-muted-foreground hover:text-[#e4ff00]"
                )}
              >
                Transações
              </Link>
            </li>
            <li>
              <Link 
                to="/reports" 
                className={cn(
                  "transition-colors",
                  isActivePath("/reports") 
                    ? "text-[#e4ff00] font-medium" 
                    : "text-muted-foreground hover:text-[#e4ff00]"
                )}
              >
                Gráficos
              </Link>
            </li>
            <li>
              <Link 
                to="/settings" 
                className={cn(
                  "transition-colors",
                  isActivePath("/settings") 
                    ? "text-[#e4ff00] font-medium" 
                    : "text-muted-foreground hover:text-[#e4ff00]"
                )}
              >
                Configurações
              </Link>
            </li>
          </ul>
        </nav>
        <div className="flex items-center">
          <div className="md:flex hidden">
            <UserMenu />
          </div>
          <button 
            className="p-2 rounded-full bg-secondary hover:bg-accent transition-colors md:hidden"
            onClick={toggleMenu}
            aria-label="Menu de navegação"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-card border-b border-border z-50 md:hidden">
          <nav className="py-4 px-4">
            <ul className="flex flex-col space-y-4">
              <li>
                <Link 
                  to="/" 
                  className={cn(
                    "block px-4 py-2 rounded-md transition-colors",
                    isActivePath("/") 
                      ? "text-[#e4ff00] font-medium bg-accent" 
                      : "text-muted-foreground hover:text-[#e4ff00] hover:bg-accent"
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  Início
                </Link>
              </li>
              <li>
                <Link 
                  to="/transactions" 
                  className={cn(
                    "block px-4 py-2 rounded-md transition-colors",
                    isActivePath("/transactions") 
                      ? "text-[#e4ff00] font-medium bg-accent" 
                      : "text-muted-foreground hover:text-[#e4ff00] hover:bg-accent"
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  Transações
                </Link>
              </li>
              <li>
                <Link 
                  to="/reports" 
                  className={cn(
                    "block px-4 py-2 rounded-md transition-colors",
                    isActivePath("/reports") 
                      ? "text-[#e4ff00] font-medium bg-accent" 
                      : "text-muted-foreground hover:text-[#e4ff00] hover:bg-accent"
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  Gráficos
                </Link>
              </li>
              <li>
                <Link 
                  to="/settings" 
                  className={cn(
                    "block px-4 py-2 rounded-md transition-colors",
                    isActivePath("/settings") 
                      ? "text-[#e4ff00] font-medium bg-accent" 
                      : "text-muted-foreground hover:text-[#e4ff00] hover:bg-accent"
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  Configurações
                </Link>
              </li>
              <li>
                <button 
                  className={cn(
                    "w-full text-left flex items-center px-4 py-2 rounded-md transition-colors text-red-500 hover:bg-accent"
                  )}
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
