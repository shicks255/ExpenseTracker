import { Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import ExpenseTable from './components/ExpenseTable';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from './components/ui/navigation-menu';
import { SignInButton, UserButton, useAuth } from '@clerk/react';

export default function App() {
  const { isSignedIn } = useAuth();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>settings</SidebarHeader>
        <SidebarContent>This is my content</SidebarContent>
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger />
        <div>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link to="/">Home</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link to="/expenses">Expenses</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link to="/income">Income</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link to="/charts">Charts</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        {!isSignedIn && <SignInButton />}
        {isSignedIn && <UserButton />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/expenses"
            element={
              <>
                <div className="mb-6 flex flex-col gap-2 rounded-3xl border border-border bg-card p-6">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl font-semibold">Expenses</h1>
                      <p className="text-sm text-muted-foreground">
                        Import, filter, and manage your expenses.
                      </p>
                    </div>
                    <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                      Upload
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <ExpenseTable />
                </div>
              </>
            }
          />
          <Route
            path="/income"
            element={
              <div className="space-y-4">
                <h1 className="text-2xl font-semibold">Income</h1>
                <p className="text-muted-foreground">
                  Enter income details and track your cashflow.
                </p>
              </div>
            }
          />
          <Route
            path="/charts"
            element={
              <div className="space-y-4">
                <h1 className="text-2xl font-semibold">Charts</h1>
                <p className="text-muted-foreground">Chart support is coming soon.</p>
              </div>
            }
          />
        </Routes>
      </SidebarInset>
    </SidebarProvider>
  );
}
