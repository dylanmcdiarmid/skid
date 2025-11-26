import { useState } from 'react';
import { EditableText } from '@/components/editable-text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Custom display wrapper that renders markdown-like bold text
const MarkdownBoldWrapper = ({ sourceText }: { sourceText: string }) => {
  // Simple markdown: **text** becomes bold
  const parts = sourceText.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong className="font-bold text-amber-600" key={index}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

// Custom wrapper that shows a heading
const HeadingWrapper = ({ sourceText }: { sourceText: string }) => (
  <h2 className="font-bold text-xl tracking-tight">{sourceText}</h2>
);

// Custom wrapper with a subtle style
const SubtleWrapper = ({ sourceText }: { sourceText: string }) => (
  <span className="text-muted-foreground text-sm italic">{sourceText}</span>
);

export default function DemoEditableText() {
  const [simpleText, setSimpleText] = useState('Click me to edit!');
  const [markdownText, setMarkdownText] = useState(
    'This has **bold** text and **more bold** here'
  );
  const [headingText, setHeadingText] = useState('Editable Heading');
  const [multiLineText, setMultiLineText] = useState(
    'Line one\nLine two\nLine three'
  );
  const [eventLog, setEventLog] = useState<string[]>([]);

  const logEvent = (event: string) => {
    setEventLog((prev) => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${event}`]);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl tracking-tight">
          Editable Text Demo
        </h1>
        <p className="text-muted-foreground">
          Click on any text below to edit it. Press Enter to save, Escape to
          cancel. In multi-line mode, use Shift+Enter for line breaks.
        </p>
      </div>

      {/* Simple Example */}
      <Card>
        <CardHeader>
          <CardTitle>Simple Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableText
            sourceText={simpleText}
            onEditComplete={(text) => {
              setSimpleText(text);
              logEvent(`Simple text saved: "${text}"`);
            }}
            onEditStart={() => logEvent('Started editing simple text')}
            onEditCancel={() => logEvent('Cancelled editing simple text')}
          />
          <div className="rounded-md bg-neutral-100 p-3 dark:bg-neutral-800">
            <p className="font-mono text-muted-foreground text-xs">
              Current value: {JSON.stringify(simpleText)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Markdown Example */}
      <Card>
        <CardHeader>
          <CardTitle>With Custom Display (Markdown Bold)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            The display wrapper renders **text** as bold, but you edit the raw
            markdown.
          </p>
          <EditableText
            sourceText={markdownText}
            DisplayWrapper={MarkdownBoldWrapper}
            onEditComplete={(text) => {
              setMarkdownText(text);
              logEvent(`Markdown text saved: "${text}"`);
            }}
          />
          <div className="rounded-md bg-neutral-100 p-3 dark:bg-neutral-800">
            <p className="font-mono text-muted-foreground text-xs">
              Source: {JSON.stringify(markdownText)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Heading Example */}
      <Card>
        <CardHeader>
          <CardTitle>As Heading</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableText
            sourceText={headingText}
            DisplayWrapper={HeadingWrapper}
            onEditComplete={(text) => {
              setHeadingText(text);
              logEvent(`Heading saved: "${text}"`);
            }}
          />
        </CardContent>
      </Card>

      {/* Multi-line Example */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-line Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Use Shift+Enter for line breaks, Enter to save.
          </p>
          <EditableText
            sourceText={multiLineText}
            multiLine
            DisplayWrapper={SubtleWrapper}
            onEditComplete={(text) => {
              setMultiLineText(text);
              logEvent(`Multi-line text saved (${text.split('\n').length} lines)`);
            }}
          />
          <div className="rounded-md bg-neutral-100 p-3 dark:bg-neutral-800">
            <pre className="font-mono text-muted-foreground text-xs whitespace-pre-wrap">
              {multiLineText}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Disabled Example */}
      <Card>
        <CardHeader>
          <CardTitle>Disabled State</CardTitle>
        </CardHeader>
        <CardContent>
          <EditableText
            sourceText="This text cannot be edited"
            disabled
          />
        </CardContent>
      </Card>

      {/* Empty State Example */}
      <Card>
        <CardHeader>
          <CardTitle>Empty with Placeholder</CardTitle>
        </CardHeader>
        <CardContent>
          <EditableText
            sourceText=""
            placeholder="Click to add a description..."
            onEditComplete={(text) => logEvent(`Added description: "${text}"`)}
          />
        </CardContent>
      </Card>

      {/* Event Log */}
      <Card>
        <CardHeader>
          <CardTitle>Event Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 overflow-auto rounded-md bg-neutral-950 p-4">
            {eventLog.length === 0 ? (
              <p className="font-mono text-neutral-500 text-xs">
                Events will appear here...
              </p>
            ) : (
              <ul className="space-y-1">
                {eventLog.map((event, index) => (
                  <li className="font-mono text-green-400 text-xs" key={index}>
                    {event}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

