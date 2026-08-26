import Link from 'next/link';

// Static export writes this to out/404.html. Apache serves it via the
// ErrorDocument line in public/.htaccess, which keeps the 404 status code.
export default function NotFound() {
  return (
    <article>
      <header className="tool-hero ground-pgcet">
        <div className="container">
          <p className="eyebrow"><span className="dot" />404</p>
          <h1>That page is not here</h1>
          <p className="lead">
            Either the tool moved or the address was never right. Nothing is broken at your end, and
            the full list is one click away, so you will find what you came for in a few seconds.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/">See every tool</Link>
          </div>
        </div>
      </header>
    </article>
  );
}
