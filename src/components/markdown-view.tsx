import type { ReactNode } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

function splitRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

const isDivider = (line: string) => /^\|?[\s:|-]+\|[\s:|-]*$/.test(line.trim());

/** Minimal Markdown renderer for AI output: headings, bold, bullets and tables. */
export function MarkdownView({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.trim().startsWith("|")) {
      const rows: string[] = [];
      while (index < lines.length && (lines[index] ?? "").trim().startsWith("|")) {
        rows.push(lines[index] ?? "");
        index += 1;
      }
      const dataRows = rows.filter((row) => !isDivider(row));
      const [header, ...body] = dataRows;
      blocks.push(
        <div key={`table-${index}`} className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                {splitRow(header ?? "").map((cell, cellIndex) => (
                  <TableHead key={cellIndex}>{renderInline(cell)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {body.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {splitRow(row).map((cell, cellIndex) => (
                    <TableCell
                      key={cellIndex}
                      className={cellIndex === 0 ? "font-medium" : "text-muted-foreground"}
                    >
                      {renderInline(cell)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>,
      );
      continue;
    }

    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^\s*[-*]\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul key={`list-${index}`} className="space-y-2 pl-1">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-2 text-sm leading-6 text-muted-foreground">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = (heading[1] ?? "").length;
      blocks.push(
        <h3
          key={`heading-${index}`}
          className={
            level <= 2
              ? "text-xl font-extrabold text-foreground"
              : "text-lg font-bold text-foreground"
          }
        >
          {renderInline(heading[2] ?? "")}
        </h3>,
      );
      index += 1;
      continue;
    }

    blocks.push(
      <p key={`p-${index}`} className="text-sm leading-6 text-muted-foreground">
        {renderInline(line.trim())}
      </p>,
    );
    index += 1;
  }

  return <div className="space-y-4">{blocks}</div>;
}
