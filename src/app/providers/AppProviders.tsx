import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/features/auth";
import { ThemeProvider } from "@/features/theme-switcher";
import { RouterProvider } from "@/shared/routing";
import { TooltipProvider } from "@/shared/ui/tooltip";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <RouterProvider>{children}</RouterProvider>
        </TooltipProvider>
        <Toaster position="bottom-center" richColors />
      </AuthProvider>
    </ThemeProvider>
  );
}
