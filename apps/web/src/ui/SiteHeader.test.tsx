import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { SiteHeader } from "./SiteHeader";
import { ThemeProvider } from "./theme/ThemeProvider";

describe("SiteHeader", () => {
  it("renders the brand name in the header", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <ThemeProvider>
          <SiteHeader />
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(markup).toContain("SFOOD AI WIKI");
  });
});
