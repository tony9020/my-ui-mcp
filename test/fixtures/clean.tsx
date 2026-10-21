export function NewsletterForm() {
  return (
    <section className="bg-background px-6 py-16">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <h1 className="text-3xl font-medium tracking-tight text-foreground">Stay in the loop</h1>
        <p className="text-muted-foreground">
          One short note each month about new components and tokens.
        </p>
        <form className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            className="h-11 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            className="h-11 rounded-lg bg-brand px-5 text-sm font-medium text-brand-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
