import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This page doesn&apos;t exist, or the paper you&apos;re looking for was removed.
      </p>
      <Link href="/papers" className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        Browse papers
      </Link>
    </div>
  );
}
