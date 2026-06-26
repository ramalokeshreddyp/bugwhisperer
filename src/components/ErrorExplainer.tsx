import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { explainError } from "@/functions/explain-error";

const EXAMPLE_ERRORS = [
  {
    error: `TypeError: Cannot read properties of undefined (reading 'map')`,
    code: `const items = undefined;\nitems.map(i => i.name);`,
  },
  {
    error: `SyntaxError: Unexpected token '<'`,
    code: ``,
  },
  {
    error: `ReferenceError: x is not defined`,
    code: `console.log(x);`,
  },
  {
    error: `IndentationError: unexpected indent`,
    code: `def hello():\n    print("hi")\n      print("bye")`,
  },
];

type ExplanationResult = {
  category: string;
  categoryLabel: string;
  whatHappened: string;
  whyItHappened: string;
  whereToLook: string;
  fixSteps: string[];
  codeBefore: string;
  codeAfter: string;
  encouragement: string;
};

export function ErrorExplainer() {
  const [errorInput, setErrorInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [result, setResult] = useState<ExplanationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleExplain = async () => {
    if (!errorInput.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res = await explainError({
        data: {
          errorMessage: errorInput.trim(),
          codeSnippet: codeInput.trim() || undefined,
        },
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExample = (ex: (typeof EXAMPLE_ERRORS)[0]) => {
    setErrorInput(ex.error);
    setCodeInput(ex.code);
    setShowCodeInput(!!ex.code);
    setResult(null);
    setError("");
  };

  const handleCopyFix = async () => {
    if (!result?.codeAfter) return;
    await navigator.clipboard.writeText(result.codeAfter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categoryConfig: Record<string, { emoji: string; bg: string; text: string }> = {
    syntax: { emoji: "✏️", bg: "bg-amber-100", text: "text-amber-800" },
    runtime: { emoji: "💥", bg: "bg-red-100", text: "text-red-800" },
    logic: { emoji: "🧩", bg: "bg-blue-100", text: "text-blue-800" },
    unknown: { emoji: "❓", bg: "bg-muted", text: "text-muted-foreground" },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="pt-10 pb-4 px-4 text-center">
        <div
          className="transition-all duration-700"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(-20px)",
          }}
        >
          <div className="text-5xl mb-3">🐛</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Bug Whisperer
          </h1>
          <p className="mt-2 text-base text-muted-foreground max-w-lg mx-auto">
            Paste your error message, get a simple explanation. No jargon, no panic — just clarity.
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 pb-12 max-w-2xl mx-auto w-full">
        <div
          className="transition-all duration-500 delay-200"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
          }}
        >
          {/* Input area */}
          <div className="bg-card rounded-2xl shadow-lg border border-border p-5 mb-5">
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              📋 Paste your error message
            </label>
            <Textarea
              value={errorInput}
              onChange={(e) => setErrorInput(e.target.value)}
              placeholder="e.g. TypeError: Cannot read properties of undefined (reading 'map')"
              className="min-h-[100px] font-mono text-sm bg-muted/40 border-border resize-none rounded-xl"
            />

            {/* Optional code snippet toggle */}
            {!showCodeInput ? (
              <button
                onClick={() => setShowCodeInput(true)}
                className="mt-2 text-xs font-medium text-primary hover:underline"
              >
                + Add code snippet (optional — helps give better advice)
              </button>
            ) : (
              <div className="mt-3">
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  💻 Your code (optional)
                </label>
                <Textarea
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Paste the code that's causing the error..."
                  className="min-h-[80px] font-mono text-sm bg-muted/40 border-border resize-none rounded-xl"
                />
              </div>
            )}

            <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Button
                onClick={handleExplain}
                disabled={!errorInput.trim() || loading}
                className="rounded-xl px-6 h-11 text-base font-semibold shadow-md"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner /> Thinking...
                  </span>
                ) : (
                  "✨ Explain This!"
                )}
              </Button>
              <span className="text-xs text-muted-foreground">
                Works with any programming language
              </span>
            </div>
          </div>

          {/* Example errors */}
          {!result && !loading && (
            <div className="mb-5">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                🧪 Or try an example:
              </p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_ERRORS.map((ex) => (
                  <button
                    key={ex.error}
                    onClick={() => handleExample(ex)}
                    className="text-xs font-mono bg-coral-light text-foreground px-3 py-2 rounded-lg hover:bg-coral/20 transition-colors border border-border truncate max-w-full"
                  >
                    {ex.error}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-5 mb-5 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-5 animate-pulse">
                <div className="h-6 w-32 bg-muted rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5 animate-pulse">
                <div className="h-6 w-40 bg-muted rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-5/6 bg-muted rounded" />
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              {/* Category badge */}
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${categoryConfig[result.category]?.bg ?? categoryConfig.unknown.bg} ${categoryConfig[result.category]?.text ?? categoryConfig.unknown.text}`}
                >
                  {categoryConfig[result.category]?.emoji ?? "❓"} {result.categoryLabel}
                </span>
              </div>

              {/* What happened */}
              <ExplanationCard emoji="🔍" title="What Happened">
                <p className="text-sm leading-relaxed text-foreground/85">{result.whatHappened}</p>
              </ExplanationCard>

              {/* Why it happened */}
              <ExplanationCard emoji="💡" title="Why It Happened">
                <p className="text-sm leading-relaxed text-foreground/85">{result.whyItHappened}</p>
              </ExplanationCard>

              {/* Where to look */}
              <ExplanationCard emoji="📍" title="Where to Look">
                <p className="text-sm leading-relaxed text-foreground/85">{result.whereToLook}</p>
              </ExplanationCard>

              {/* Fix steps */}
              <ExplanationCard emoji="🛠️" title="How to Fix It">
                <ol className="list-decimal list-inside space-y-1.5">
                  {result.fixSteps.map((step, i) => (
                    <li key={i} className="text-sm leading-relaxed text-foreground/85">
                      {step}
                    </li>
                  ))}
                </ol>
              </ExplanationCard>

              {/* Before / After code */}
              {(result.codeBefore || result.codeAfter) && (
                <ExplanationCard emoji="📝" title="Code Fix">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.codeBefore && (
                      <div>
                        <span className="text-xs font-semibold text-destructive mb-1 block">
                          ❌ Before (broken)
                        </span>
                        <pre className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                          {result.codeBefore}
                        </pre>
                      </div>
                    )}
                    {result.codeAfter && (
                      <div>
                        <span className="text-xs font-semibold text-success mb-1 block">
                          ✅ After (fixed)
                        </span>
                        <pre className="bg-success-light/50 border border-success/20 rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                          {result.codeAfter}
                        </pre>
                      </div>
                    )}
                  </div>
                  {result.codeAfter && (
                    <button
                      onClick={handleCopyFix}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      {copied ? "✅ Copied!" : "📋 Copy fixed code"}
                    </button>
                  )}
                </ExplanationCard>
              )}

              {/* Encouragement */}
              <div className="bg-success-light/40 border border-success/20 rounded-2xl p-4 text-center">
                <p className="text-sm font-medium text-foreground">
                  💪 {result.encouragement}
                </p>
              </div>

              {/* Try another */}
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setErrorInput("");
                    setCodeInput("");
                    setError("");
                  }}
                  className="rounded-xl"
                >
                  🔄 Try another error
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center pb-6 text-xs text-muted-foreground">
        Made for beginners with 💛 — Errors are just clues, not failures!
      </footer>
    </div>
  );
}

function ExplanationCard({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <h3 className="text-base font-bold text-foreground mb-2">
        {emoji} {title}
      </h3>
      {children}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
