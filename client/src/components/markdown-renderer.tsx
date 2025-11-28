import type React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

export function MarkdownRenderer({ children, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        "text-sm text-foreground",
        // Headings
        "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1:first-child]:mt-0",
        "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5",
        "[&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-4",
        "[&_h4]:text-base [&_h4]:font-medium [&_h4]:mb-2 [&_h4]:mt-4",
        // Paragraphs
        "[&_p]:mb-4 [&_p]:leading-relaxed [&_p:last-child]:mb-0",
        // Lists
        "[&_ul]:list-disc [&_ul]:list-inside [&_ul]:mb-4 [&_ul]:space-y-1",
        "[&_ol]:list-decimal [&_ol]:list-inside [&_ol]:mb-4 [&_ol]:space-y-1",
        "[&_li]:pl-1",
        // Links
        "[&_a]:text-primary [&_a]:hover:underline [&_a]:font-medium",
        // Blockquotes
        "[&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4",
        // Code
        "[&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4",
        "[&_code]:font-mono [&_code]:text-xs",
        // Inline code (not inside pre)
        "[&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded [&_:not(pre)>code]:text-foreground",
        // Tables
        "[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_table]:mb-4",
        "[&_thead]:bg-muted/50",
        "[&_tr]:border-b [&_tr]:transition-colors [&_tr]:hover:bg-muted/50",
        "[&_th]:h-10 [&_th]:px-4 [&_th]:text-left [&_th]:align-middle [&_th]:font-medium [&_th]:text-muted-foreground",
        "[&_td]:p-4 [&_td]:align-middle",
        // HR
        "[&_hr]:my-4 [&_hr]:border-muted",
        // Images
        "[&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-4",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Override a to add target blank
          a: ({ node, ...props }) => (
            <a target="_blank" rel="noopener noreferrer" {...props} />
          ),
          // Override table for responsive wrapper
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table {...props} />
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
