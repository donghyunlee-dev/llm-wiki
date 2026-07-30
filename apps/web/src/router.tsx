import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./ui/AppLayout";
import { CardLayout } from "./ui/CardLayout";
import { ArticlePage } from "./ui/pages/ArticlePage";
import { GuideIndexGraphPage } from "./ui/pages/GuideIndexGraphPage";
import { GuidesPage, StartingGuidePage } from "./ui/pages/GuidesPage";
import { HomePage } from "./ui/pages/HomePage";
import { LessonIndexPage } from "./ui/pages/LessonIndexPage";
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
      // Guide/article detail pages render their own full-width two-pane (content + TOC sidebar)
      // layout and are deliberately NOT nested under CardLayout's .site-shell (which caps width
      // at max-w-6xl) — same reasoning as SearchPage above. See .guide-detail-shell in styles.css.
      { path: "guides/agent-start", element: <StartingGuidePage /> },
      { path: "guides/start", element: <StartingGuidePage /> },
      { path: "guides/:slug", element: <ArticlePage section="guides" /> },
      { path: "library/:slug", element: <ArticlePage section="library" /> },
      { path: "faq/:slug", element: <ArticlePage section="faq" /> },
      {
        element: <CardLayout />,
        children: [
          { path: "guides", element: <GuidesPage /> },
          { path: "guides/map", element: <GuideIndexGraphPage /> },
          { path: "library", element: <LibraryPage /> },
          { path: "faq", element: <FaqPage /> },
          { path: "lesson", element: <LessonIndexPage /> },
          { path: "projects", element: <ProjectsPage /> },
          { path: "projects/:slug", element: <ProjectDetailPage /> },
          { path: "project-design/start", element: <ProjectDesignPage /> },
        ],
      },
    ],
  },
]);
