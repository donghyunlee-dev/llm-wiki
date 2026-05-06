export function WikiStatePanel(props: {
  title: string;
  body: string;
  tone?: "default" | "error";
}) {
  return (
    <div className="page-shell">
      <div
        className={[
          "page-width-narrow page-panel border",
          props.tone === "error" ? "border-rose-300/60" : "border-panel-border",
        ].join(" ")}
      >
        <h1 className="title-hero">{props.title}</h1>
        <p className="body-copy mt-4 max-w-3xl">{props.body}</p>
      </div>
    </div>
  );
}
