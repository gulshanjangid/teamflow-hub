import { useState } from "react";
import { Link, useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FolderKanban, ListChecks, LogOut, CheckSquare } from "lucide-react";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate("/auth");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    }`;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--gradient-primary)" }}>
              <CheckSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">Tasker</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={linkClass}><LayoutDashboard className="h-4 w-4" />Dashboard</NavLink>
            <NavLink to="/projects" className={linkClass}><FolderKanban className="h-4 w-4" />Projects</NavLink>
            <NavLink to="/tasks" className={linkClass}><ListChecks className="h-4 w-4" />My tasks</NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={signingOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
};
