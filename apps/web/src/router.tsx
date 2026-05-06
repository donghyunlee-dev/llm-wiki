import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./ui/AppLayout";
import { ArticlePage } from "./ui/pages/ArticlePage";
import { GuidesPage } from "./ui/pages/GuidesPage";
import { HomePage } from "./ui/pages/HomePage";
import { LibraryPage } from "./ui/pages/LibraryPage";
import { ProjectDesignPage } from "./ui/pages/ProjectDesignPage";
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
        path: "guides",
        element: <GuidesPage />,
      },
      {
        path: "guides/:slug",
        element: <ArticlePage category="guides" />,
      },
      {
        path: "projects",
        element: <ProjectsPage />,
      },
      {
        path: "projects/:slug",
        element: <ArticlePage category="projects" />,
      },
      {
        path: "library",
        element: <LibraryPage />,
      },
      {
        path: "library/:slug",
        element: <ArticlePage category="library" />,
      },
      {
        path: "faq",
        element: <FaqPage />,
      },
      {
        path: "faq/:slug",
        element: <ArticlePage category="faq" />,
      },
      {
        path: "project-design/start",
        element: <ProjectDesignPage />,
      },
    ],
  },
]);
