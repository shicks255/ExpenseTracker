import { Routes, Route, NavLink, useMatch } from 'react-router-dom';
import Home from './components/Home';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import ExpenseTable from './components/expenseTable/ExpenseTable';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from './components/ui/navigation-menu';
import { SignInButton, UserButton, useAuth } from '@clerk/react';
import { Charts } from './components/Charts';
import { Settings } from './components/Settings';
import { Nav } from 'react-day-picker';
import { ChangeEvent, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog';

export default function App() {
  const { isSignedIn, getToken } = useAuth();

  const [uploadDialog, setUploadDialog] = useState(false);
  const [pdf, setPdf] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setPdf(null);
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setPdf(null);
      // setError("Please select a PDF file.");
      event.target.value = '';
      return;
    }

    setPdf(file);
  };

  const submitUpload = async () => {
    const token = await getToken();
    const formData = new FormData();

    formData.append('pdf', pdf);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>settings</SidebarHeader>
        <SidebarContent>This is my content</SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex justify-between">
          <SidebarTrigger />
          {!isSignedIn && <SignInButton />}
          {isSignedIn && (
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: 'scale-155 origin-center top-4 right-4',
                  userPreviewAvatarBox: 'scale-125 origin-center',
                },
              }}
            />
          )}
        </div>
        <div className="border-b-2">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <NavLink to="/">{({ isActive }) => <>Home</>}</NavLink>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <NavLink to="/expenses">Expenses</NavLink>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <NavLink to="/income">Income</NavLink>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <NavLink to="/charts">Charts</NavLink>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <NavLink to="/settings">Settings</NavLink>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

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
                    <Dialog>
                      <DialogTrigger>
                        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                          Upload
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>My thing</DialogTitle>
                        </DialogHeader>
                        <DialogDescription>
                          <input
                            onChange={handleFileChange}
                            type="file"
                            accept=".pdf,application/pdf"
                          />
                          {pdf && <button onClick={submitUpload}>Upload</button>}
                        </DialogDescription>
                      </DialogContent>
                    </Dialog>
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
              <>
                <div className="mb-6 flex flex-col gap-2 rounded-3xl border border-border bg-card p-6">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl font-semibold">Charts</h1>
                      <p className="text-sm text-muted-foreground">Visualize your data</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <Charts />
                </div>
              </>
            }
          />
          <Route
            path="/settings"
            element={
              <>
                <div className="mb-6 flex flex-col gap-2 rounded-3xl border border-border bg-card p-6">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl font-semibold">Settings</h1>
                      <p className="text-sm text-muted-foreground">
                        Adjust various settings for your expense categories and vendors
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <Settings />
                </div>
              </>
            }
          />
        </Routes>
      </SidebarInset>
    </SidebarProvider>
  );
}
