import { Outlet } from "react-router-dom";

export function CardLayout() {
  return (
    <div className="flex-1 bg-page-bg">
      <div className="site-shell">
        <div className="site-surface">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
