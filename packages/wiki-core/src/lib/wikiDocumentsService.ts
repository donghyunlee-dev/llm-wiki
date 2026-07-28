import { renderConfluenceContentToCleanHtml } from "./confluenceCleanHtml";
import { getWikiDocumentHref, type WikiDocument } from "./wikiDocuments";

export type CleanWikiDocument = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  href: string;
  docType: string;
  contentHtml: string;
  related: Array<{ title: string; href: string }>;
};

export function buildCleanWikiDocumentsList(documents: WikiDocument[]): CleanWikiDocument[] {
  const byId = new Map(documents.map((document) => [document.id, document]));

  return documents.map((document) => ({
    id: document.id,
    slug: document.slug,
    title: document.title,
    summary: document.summary,
    href: getWikiDocumentHref(document) ?? `/wiki/${document.id}`,
    docType: document.metadata.docType,
    contentHtml: renderConfluenceContentToCleanHtml(document.contentHtml, documents),
    related: document.metadata.related
      .map((relatedId) => byId.get(relatedId))
      .filter((related): related is NonNullable<typeof related> => Boolean(related))
      .map((related) => ({
        title: related.title,
        href: getWikiDocumentHref(related) ?? `/wiki/${related.id}`,
      })),
  }));
}
