import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Navigation } from './components/wrappers/NavigationMenu';
import { SignInButton, UserButton, useAuth } from '@clerk/react';
import { AppRoutes } from './components/wrappers/AppRoutes';

export default function App() {
  const { isSignedIn } = useAuth();

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
        <Navigation />
        <AppRoutes />
      </SidebarInset>
    </SidebarProvider>
  );
}
