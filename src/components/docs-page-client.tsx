"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCurrentUser } from "~/hooks/use-current-user";
import Header from "~/components/header";
import Footer from "~/components/footer";
import Loading from "~/components/loading";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";

type DocsRole = "user" | "controller" | "admin";

interface DocSection {
  key: DocsRole;
  title: string;
  path: string;
  requires: "always" | "controller" | "admin";
}

interface DocHeading {
  id: string;
  level: number;
  text: string;
}

const DOCS: DocSection[] = [
  { key: "user", title: "Pilot", path: "/docs/user.md", requires: "always" },
  { key: "controller", title: "Controller", path: "/docs/controller.md", requires: "controller" },
  { key: "admin", title: "Admin", path: "/docs/admin.md", requires: "admin" },
];

const markdownClasses = {
  h1: "mt-2 mb-4 text-2xl font-extrabold tracking-tight md:text-3xl",
  h2: "mt-8 mb-3 text-xl font-bold md:text-2xl",
  h3: "mt-6 mb-2 text-lg font-bold",
  p: "mb-3 leading-7 text-gray-200",
  ul: "mb-4 list-disc pl-6 text-gray-200",
  ol: "mb-4 list-decimal pl-6 text-gray-200",
  li: "mb-1",
  code: "rounded bg-gray-800 px-1 py-0.5 text-cyan-200",
};

function roleLabel(level: number) {
  if (level >= 2) return "Admin";
  if (level >= 1) return "Controller";
  return "Pilot";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function DocsPageClient() {
  const { user, isLoading } = useCurrentUser();
  const [docsByPath, setDocsByPath] = useState<Record<string, string>>({});
  const [docsLoading, setDocsLoading] = useState(true);
  const [activeDocKey, setActiveDocKey] = useState<DocsRole | null>(null);

  const roleLevel = useMemo(() => {
    if (!user) return 0;
    if (user.isAdmin === true) return 2;
    if (user.isController === true) return 1;
    return 0;
  }, [user]);

  const visibleDocs = useMemo(
    () =>
      DOCS.filter((doc) => {
        if (doc.requires === "always") return true;
        if (doc.requires === "controller") return user?.isController === true;
        if (doc.requires === "admin") return user?.isAdmin === true;
        return false;
      }),
    [user],
  );

  useEffect(() => {
    if (!visibleDocs.length) {
      setActiveDocKey(null);
      return;
    }

    if (!activeDocKey || !visibleDocs.some((doc) => doc.key === activeDocKey)) {
      setActiveDocKey(visibleDocs[0]?.key ?? null);
    }
  }, [visibleDocs, activeDocKey]);

  useEffect(() => {
    const loadDocs = async () => {
      setDocsLoading(true);

      const results = await Promise.all(
        visibleDocs.map(async (doc) => {
          try {
            const res = await fetch(doc.path, { cache: "no-store" });
            if (!res.ok) {
              return [doc.path, `# ${doc.title}\n\nUnable to load this document right now.`] as const;
            }
            const text = await res.text();
            return [doc.path, text] as const;
          } catch {
            return [doc.path, `# ${doc.title}\n\nUnable to load this document right now.`] as const;
          }
        }),
      );

      setDocsByPath(Object.fromEntries(results));
      setDocsLoading(false);
    };

    void loadDocs();
  }, [visibleDocs]);

  const headingsByPath = useMemo(() => {
    const byPath: Record<string, DocHeading[]> = {};

    for (const doc of visibleDocs) {
      const markdown = docsByPath[doc.path] ?? "";
      const lines = markdown.split("\n");
      const used = new Map<string, number>();
      const headings: DocHeading[] = [];

      for (const line of lines) {
        const match = /^(#{1,3})\s+(.+)$/.exec(line.trim());
        if (!match) continue;

        const hashes = match[1] ?? "";
        const headingText = match[2] ?? "";
        if (!hashes || !headingText) continue;

        const level = hashes.length;
        const rawText = headingText.trim();
        if (!rawText) continue;

        const base = `${doc.key}-${slugify(rawText)}`;
        const count = used.get(base) ?? 0;
        used.set(base, count + 1);
        const id = count === 0 ? base : `${base}-${count}`;

        headings.push({ id, level, text: rawText });
      }

      byPath[doc.path] = headings;
    }

    return byPath;
  }, [docsByPath, visibleDocs]);

  const activeDoc = useMemo(
    () => visibleDocs.find((doc) => doc.key === activeDocKey) ?? visibleDocs[0] ?? null,
    [visibleDocs, activeDocKey],
  );

  const activeMarkdown = activeDoc ? docsByPath[activeDoc.path] ?? "" : "";
  const activeHeadings = activeDoc ? headingsByPath[activeDoc.path] ?? [] : [];

  if (isLoading) return <Loading />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background:radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.35),transparent_42%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.22),transparent_36%),radial-gradient(circle_at_50%_80%,rgba(56,189,248,0.2),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-15 [background-size:24px_24px] [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)]" />

      <div className="relative z-10 flex min-h-screen flex-col px-4 md:px-8">
        <Header />

        <main className="mx-auto w-full max-w-7xl py-8 md:py-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-950/80 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Documentation</p>
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">vstrips Docs</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="border border-cyan-500/40 bg-cyan-500/15 px-3 py-1 text-cyan-200">
                {roleLabel(roleLevel)} Access
              </Badge>
              <Link
                href="/"
                className="rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm transition hover:border-cyan-400 hover:text-cyan-200"
              >
                Back to Boards
              </Link>
            </div>
          </div>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_280px]">
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <Card className="border-gray-800 bg-gray-900/85 p-3">
                <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Pages</p>
                <nav className="space-y-1">
                  {visibleDocs.map((doc) => {
                    const isActive = activeDoc?.key === doc.key;
                    return (
                      <button
                        key={doc.key}
                        type="button"
                        onClick={() => setActiveDocKey(doc.key)}
                        className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                          isActive
                            ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/40"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        }`}
                      >
                        {doc.title}
                      </button>
                    );
                  })}
                </nav>
              </Card>
            </aside>

            <section>
              <Card className="border-gray-800 bg-gray-900/85 p-5 md:p-8">
                {docsLoading || !activeDoc ? (
                  <p className="text-gray-300">Loading docs...</p>
                ) : (
                  <>
                    <div className="mb-5 border-b border-gray-800 pb-4">
                      <h2 className="text-2xl font-bold">{activeDoc.title} Documentation</h2>
                      <p className="mt-1 text-sm text-gray-400">
                        Edit source: <code>{`public/docs/${activeDoc.key}.md`}</code>
                      </p>
                    </div>

                    <div className="max-w-none text-base">
                      {(() => {
                        let headingCursor = 0;
                        const nextHeadingId = () => {
                          const value = activeHeadings[headingCursor]?.id;
                          headingCursor += 1;
                          return value;
                        };

                        return (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ children }) => (
                                <h1 id={nextHeadingId()} className={`${markdownClasses.h1} scroll-mt-24`}>
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 id={nextHeadingId()} className={`${markdownClasses.h2} scroll-mt-24`}>
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 id={nextHeadingId()} className={`${markdownClasses.h3} scroll-mt-24`}>
                                  {children}
                                </h3>
                              ),
                              p: ({ children }) => <p className={markdownClasses.p}>{children}</p>,
                              ul: ({ children }) => <ul className={markdownClasses.ul}>{children}</ul>,
                              ol: ({ children }) => <ol className={markdownClasses.ol}>{children}</ol>,
                              li: ({ children }) => <li className={markdownClasses.li}>{children}</li>,
                              code: ({ children }) => <code className={markdownClasses.code}>{children}</code>,
                              a: ({ href, children }) => (
                                <a
                                  href={href}
                                  className="font-semibold text-cyan-300 underline decoration-cyan-500/50 underline-offset-2 hover:text-cyan-200"
                                >
                                  {children}
                                </a>
                              ),
                              hr: () => <hr className="my-6 border-gray-700" />,
                            }}
                          >
                            {activeMarkdown}
                          </ReactMarkdown>
                        );
                      })()}
                    </div>
                  </>
                )}
              </Card>
            </section>

            <aside className="hidden xl:block xl:sticky xl:top-6 xl:self-start">
              <Card className="border-gray-800 bg-gray-900/85 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-300">On This Page</h3>
                {docsLoading || !activeDoc ? (
                  <p className="text-sm text-gray-400">Loading sections...</p>
                ) : activeHeadings.length === 0 ? (
                  <p className="text-sm text-gray-400">No headings found.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {activeHeadings.map((heading) => (
                      <li
                        key={heading.id}
                        className={heading.level === 1 ? "" : heading.level === 2 ? "pl-2" : "pl-4"}
                      >
                        <a
                          href={`#${heading.id}`}
                          className="text-sm text-gray-300 transition hover:text-cyan-200 hover:underline"
                        >
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </aside>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
