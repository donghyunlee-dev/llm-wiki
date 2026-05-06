import { Outlet } from "react-router-dom";
import { WikiDataProvider } from "../data/WikiDataProvider";
import { SiteHeader } from "./SiteHeader";
import { ThemeProvider } from "./theme/ThemeProvider";

export function AppLayout() {
  return (
    <ThemeProvider>
      <WikiDataProvider>
        <div className="site-layout">
          <div className="site-shell">
            <div className="site-surface">
              <SiteHeader />
              <main>
                <Outlet />
              </main>
            </div>
          </div>
        </div>
      </WikiDataProvider>
    </ThemeProvider>
  );
}
