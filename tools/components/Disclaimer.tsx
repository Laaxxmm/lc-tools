// Shown with every predicted rank, cutoff or college list. The honesty is the point:
// an estimate that oversells itself costs more trust than it wins clicks.

interface Props {
  /** Primary source behind the figures. Same shape as ToolConfig.sources[n]. */
  source?: { label: string; href: string };
}

export default function Disclaimer({ source }: Props) {
  return (
    <aside className="disclaimer">
      <p><strong>These figures are estimates, not official results.</strong></p>
      <p>
        They are worked out from cutoff and score data the exam bodies have already
        published, so they show you the range you are competing in. No estimate can promise
        you a seat — the official notification decides admission, and its numbers move
        every year with the applicant pool.
      </p>
      {source ? (
        <p>Checked against: <a href={source.href}>{source.label}</a></p>
      ) : null}
    </aside>
  );
}
