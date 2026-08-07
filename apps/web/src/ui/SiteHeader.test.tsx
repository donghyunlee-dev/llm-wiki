import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { SiteHeader } from "./SiteHeader";
import { ThemeProvider } from "./theme/ThemeProvider";

describe("SiteHeader", () => {
  it("renders the SFOOD CI logo and the product name in the header", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <ThemeProvider>
          <SiteHeader />
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(markup).toContain('alt="SFOOD"');
    expect(markup).toContain("AI WIKI");
  });
});
