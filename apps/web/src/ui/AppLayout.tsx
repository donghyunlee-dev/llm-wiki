import { Outlet, ScrollRestoration } from "react-router-dom";
import { WikiDataProvider } from "../data/WikiDataProvider";
import { SiteHeader } from "./SiteHeader";
import { ThemeProvider } from "./theme/ThemeProvider";

export function AppLayout() {
  return (
    <ThemeProvider>
      <WikiDataProvider>
        <div className="site-layout">
          <SiteHeader />
          <main className="site-main">
            <Outlet />
          </main>
        </div>
        <ScrollRestoration />
      </WikiDataProvider>
    </ThemeProvider>
  );
}
