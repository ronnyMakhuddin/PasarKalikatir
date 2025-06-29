"use client";

import Link from 'next/link';
import { Leaf, ShoppingBasket, User, LogOut, Settings, Store, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

export function Header() {
  const { cartCount } = useCart();
  const { user, userProfile, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      console.log('Starting logout from header...');
      await logout();
      console.log('Logout successful from header');
      router.push('/');
    } catch (error) {
      console.error('Logout error from header:', error);
      // Even if logout fails, redirect to home
      router.push('/');
    }
  };

  const getDashboardLink = () => {
    if (userProfile?.role === 'admin') {
      return '/admin/dashboard';
    } else if (userProfile?.role === 'seller') {
      return '/seller/dashboard';
    }
    return '/';
  };

  return (
    <header className="bg-card/80 backdrop-blur-lg sticky top-0 z-40 w-full border-b">
      <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" prefetch={false}>
          <Leaf className="h-6 w-6 md:h-7 md:w-7 text-primary" />
          <span className="text-lg md:text-xl font-bold font-headline text-primary">
            Pasar Kalikatir
          </span>
        </Link>
        
        <div className="flex items-center gap-2 md:gap-4">
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/pedagang">
                <Users className="mr-2 h-4 w-4" />
                Pedagang
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/statistik">
                <BarChart3 className="mr-2 h-4 w-4" />
                Statistik
              </Link>
            </Button>
          </div>

          {/* Cart for buyers */}
          {!user && (
            <Button asChild variant="ghost" size="icon" className="relative">
              <Link href="/cart">
                <ShoppingBasket className="h-5 w-5 md:h-6 md:w-6" />
                {cartCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 md:-top-2 md:-right-2 h-5 w-5 md:h-6 md:w-6 rounded-full flex items-center justify-center p-0 bg-accent text-accent-foreground text-xs"
                  >
                    {cartCount}
                  </Badge>
                )}
                <span className="sr-only">Keranjang Belanja</span>
              </Link>
            </Button>
          )}

          {/* User menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{userProfile?.email}</p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {userProfile?.role === 'admin' ? 'Administrator' : 'Penjual'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(getDashboardLink())}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1 md:gap-2">
              <Button asChild variant="outline" size="sm" className="hidden sm:flex">
                <Link href="/login">
                  <User className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon" className="sm:hidden">
                <Link href="/login">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:flex">
                <Link href="/menjadi-pedagang">
                  <Store className="mr-2 h-4 w-4" />
                  Menjadi Pedagang
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon" className="sm:hidden">
                <Link href="/menjadi-pedagang">
                  <Store className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
