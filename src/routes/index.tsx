import { createFileRoute } from "@tanstack/react-router";
import { ErrorExplainer } from "@/components/ErrorExplainer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Bug Whisperer — Code Error Explainer for Beginners" },
      { name: "description", content: "Paste any code error message and get a simple, beginner-friendly explanation. No jargon, no panic!" },
    ],
  }),
});

function Index() {
  return <ErrorExplainer />;
}
