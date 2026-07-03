import { Link } from "react-router-dom";

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
      <h1 className="text-6xl font-bold tracking-tight text-destructive">403</h1>
      <h2 className="mt-4 text-3xl font-semibold">Access Forbidden</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        You do not have the required permissions or roles to view this page.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
