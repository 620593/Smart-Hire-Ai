import { Link } from "react-router-dom";

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
      <h1 className="text-6xl font-bold tracking-tight text-primary">401</h1>
      <h2 className="mt-4 text-3xl font-semibold">Unauthorized Access</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        Please log in to access this page.
      </p>
      <Link
        to="/login"
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Go to Login
      </Link>
    </div>
  );
}
