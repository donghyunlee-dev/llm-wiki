import { Link } from "react-router-dom";

type StaticPageItem =
  | string
  | {
      label: string;
      href: string;
    };

export function StaticPageShell(props: {
  title: string;
  body: string;
  items?: StaticPageItem[];
}) {
  return (
    <div className="page-shell">
      <div className="page-width-narrow page-panel">
        <Link className="text-link" to="/">
          홈으로 돌아가기
        </Link>
        <h1 className="title-hero mt-6">{props.title}</h1>
        <p className="body-copy mt-6 max-w-3xl">{props.body}</p>
        {props.items?.length ? (
          <div className="section-stack">
            {props.items.map((item) => (
              typeof item === "string" ? (
                <div
                  key={item}
                  className="empty-card text-page-fg"
                >
                  {item}
                </div>
              ) : (
                <Link
                  key={`${item.href}-${item.label}`}
                  to={item.href}
                  className="document-list-item document-title block"
                >
                  {item.label}
                </Link>
              )
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
