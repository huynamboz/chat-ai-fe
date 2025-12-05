import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

import type { ReactNode } from "react";

interface MessageContentProps {
  content: string;
  className?: string;
}

export function MessageContent({
  content,
  className = "",
}: MessageContentProps) {
  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      style={{
        // Override prose styles for better integration
        color: "inherit",
      }}
    >
      <ReactMarkdown
        components={{
          // Customize code blocks
          code({
            node,
            inline,
            className,
            children,
            ...props
          }: {
            node?: unknown;
            inline?: boolean;
            className?: string;
            children?: ReactNode;
            [key: string]: unknown;
          }) {
            const match = /language-(\w+)/.exec(className || "");

            return !inline && match ? (
              <pre className="bg-gray-800 rounded-lg p-4 overflow-x-auto">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code
                className="bg-gray-200 px-1.5 py-0.5 rounded text-sm"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Customize paragraphs
          p({ children }: { children?: ReactNode }) {
            return <p className="mb-2 last:mb-0">{children}</p>;
          },
          // Customize lists
          ul({ children }: { children?: ReactNode }) {
            return (
              <ul className="list-disc list-inside mb-2 space-y-1">
                {children}
              </ul>
            );
          },
          ol({ children }: { children?: ReactNode }) {
            return (
              <ol className="list-decimal list-inside mb-2 space-y-1">
                {children}
              </ol>
            );
          },
          // Customize headings
          h1({ children }: { children?: ReactNode }) {
            return (
              <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">
                {children}
              </h1>
            );
          },
          h2({ children }: { children?: ReactNode }) {
            return (
              <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">
                {children}
              </h2>
            );
          },
          h3({ children }: { children?: ReactNode }) {
            return (
              <h3 className="text-base font-semibold mb-2 mt-2 first:mt-0">
                {children}
              </h3>
            );
          },
          // Customize links
          a({ href, children }: { href?: string; children?: ReactNode }) {
            return (
              <a
                className="text-primary hover:underline"
                href={href}
                rel="noopener noreferrer"
                target="_blank"
              >
                {children}
              </a>
            );
          },
          // Customize blockquotes
          blockquote({ children }: { children?: ReactNode }) {
            return (
              <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2">
                {children}
              </blockquote>
            );
          },
          // Customize tables
          table({ children }: { children?: ReactNode }) {
            return (
              <div className="overflow-x-auto my-2">
                <table className="min-w-full border-collapse border border-gray-300">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }: { children?: ReactNode }) {
            return (
              <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold">
                {children}
              </th>
            );
          },
          td({ children }: { children?: ReactNode }) {
            return (
              <td className="border border-gray-300 px-4 py-2">{children}</td>
            );
          },
        }}
        rehypePlugins={[rehypeHighlight]}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
