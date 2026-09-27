import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold text-ink">This page doesn&apos;t exist</h1>
      <p className="mt-2 text-graphite">The converter is on the home page.</p>
      <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-xl bg-teal px-5 font-semibold text-on-teal">
        Go to the converter
      </Link>
    </main>
  );
}
