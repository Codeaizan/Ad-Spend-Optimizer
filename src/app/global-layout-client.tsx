'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  Bell, 
  Search, 
  Menu, 
  X,
  LayoutDashboard,
  Megaphone,
  Layers,
  Key,
  LayoutTemplate,
  BarChart4,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function GlobalLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
    { name: 'Ad Groups', href: '/dashboard/campaigns', icon: Layers },
    { name: 'Keywords', href: '/dashboard/reports', icon: Key },
    { name: 'Ads', href: '/dashboard/reports', icon: LayoutTemplate },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart4 },
    { name: 'Keyword Planner', href: '/dashboard/keyword-planner', icon: Lightbulb },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Demo Mode Banner */}
      <div className="bg-blue-600/10 border-b border-blue-500/20 text-blue-500 text-xs sm:text-sm py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Lightbulb className="h-4 w-4" />
        You are viewing demo data. Connect your Google Ads account to see real data.
      </div>
      
      {/* Top Navigation Bar */}
      <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4 lg:gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-white">
              {/* Colored G Icon Placeholder */}
              <span className="font-bold text-xl tracking-tighter" style={{
                background: 'linear-gradient(to bottom right, #4285F4, #34A853, #FBBC05, #EA4335)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>G</span>
            </div>
            <span className="font-semibold text-lg hidden sm:inline-block tracking-tight">Ads</span>
            <span className="mx-2 text-muted-foreground hidden sm:inline-block">|</span>
            <span className="text-sm font-medium hidden sm:inline-block">Faizan Test — 931-508-4290</span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-4 max-w-xl">
          <div className="relative hidden md:block w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search campaigns, ad groups..."
              className="w-full bg-muted/50 pl-9 border-border/50 focus-visible:ring-primary/50"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive"></span>
            </Button>
            <ThemeToggle />
            <div className="h-8 w-8 ml-2 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 text-primary text-xs font-bold">
              FT
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 pt-16' : '-translate-x-full lg:pt-0'}
        `}>
          <nav className="p-4 space-y-1 overflow-y-auto h-full">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard' 
                ? pathname === '/dashboard' 
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-muted/20">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
