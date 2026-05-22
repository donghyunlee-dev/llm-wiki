import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./ui/AppLayout";
import { CardLayout } from "./ui/CardLayout";
import { ArticlePage } from "./ui/pages/ArticlePage";
import { GuideIndexGraphPage } from "./ui/pages/GuideIndexGraphPage";
import { GuidesPage, StartingGuidePage } from "./ui/pages/GuidesPage";
import { HomePage } from "./ui/pages/HomePage";
import { LibraryPage } from "./ui/pages/LibraryPage";
import { ProjectDesignPage } from "./ui/pages/ProjectDesignPage";
import { ProjectDetailPage } from "./ui/pages/ProjectDetailPage";
import { ProjectsPage } from "./ui/pages/ProjectsPage";
import { SearchPage } from "./ui/pages/SearchPage";
import { FaqPage } from "./ui/pages/FaqPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "search",
        element: <SearchPage />,
      },
      {
        element: <CardLayout />,
        children: [
          { path: "guides", element: <GuidesPage /> },
          { path: "guides/map", element: <GuideIndexGraphPage /> },
          { path: "guides/agent-start", element: <StartingGuidePage /> },
          { path: "guides/start", element: <StartingGuidePage /> },
          { path: "guides/:slug", element: <ArticlePage section="guides" /> },
          { path: "library", element: <LibraryPage /> },
          { path: "library/:slug", element: <ArticlePage section="library" /> },
          { path: "faq", element: <FaqPage /> },
          { path: "faq/:slug", element: <ArticlePage section="faq" /> },
          { path: "projects", element: <ProjectsPage /> },
          { path: "projects/:slug", element: <ProjectDetailPage /> },
          { path: "project-design/start", element: <ProjectDesignPage /> },
        ],
      },
    ],
  },
]);
