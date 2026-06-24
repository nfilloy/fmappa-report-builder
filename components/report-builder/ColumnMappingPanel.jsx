"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Columns3, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  SCHEMA_LABELS,
  SCHEMA_OPTIONAL_FIELDS,
  SCHEMA_REQUIRED_FIELDS,
  suggestFieldMapping,
} from "@/lib/data/schema";

const NOT_PRESENT = "";

// Pre-fill exact / case-insensitive matches for both the required and optional
// fields of a schema, so canonical detail columns auto-select and the user only
// has to touch the ones they renamed.
function suggestSchemaMapping(kind, csvColumns) {
  return {
    ...suggestFieldMapping(SCHEMA_REQUIRED_FIELDS[kind], csvColumns),
    ...suggestFieldMapping(SCHEMA_OPTIONAL_FIELDS[kind], csvColumns),
  };
}

// Inline recovery panel shown when an uploaded CSV fails validation. It maps the
// CSV's actual headers onto one of the two known schemas (OCF / PCF). The
// required fields are mandatory; the optional detail columns are pre-matched by
// header name and surfaced in a collapsed section so renamed ones can be fixed.
export function ColumnMappingPanel({ request, onConfirm, onCancel }) {
  const { csvColumns, fileName } = request;
  // Schema may be undetectable from the headers — let the user pick in that case.
  const [kind, setKind] = useState(request.kind ?? null);
  const [mapping, setMapping] = useState(() =>
    request.kind ? suggestSchemaMapping(request.kind, csvColumns) : {},
  );
  const [showUnmapped, setShowUnmapped] = useState(false);

  const requiredFields = useMemo(
    () => (kind ? SCHEMA_REQUIRED_FIELDS[kind] : []),
    [kind],
  );
  const optionalFields = useMemo(
    () => (kind ? SCHEMA_OPTIONAL_FIELDS[kind] : []),
    [kind],
  );
  const unmapped = useMemo(
    () => requiredFields.filter((field) => !mapping[field]),
    [requiredFields, mapping],
  );

  const handleChooseKind = (nextKind) => {
    setKind(nextKind);
    setMapping(suggestSchemaMapping(nextKind, csvColumns));
    setShowUnmapped(false);
  };

  const handleSelect = (field, value) => {
    setMapping((current) => ({ ...current, [field]: value }));
  };

  const handleConfirm = () => {
    if (unmapped.length > 0) {
      setShowUnmapped(true);
      return;
    }
    onConfirm(mapping);
  };

  const renderRow = (field, { invalid = false } = {}) => (
    <div
      key={field}
      className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]"
    >
      <code className="truncate rounded-md bg-secondary px-2 py-1.5 text-xs font-medium text-foreground">
        {field}
      </code>
      <ArrowRight
        aria-hidden="true"
        className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block"
      />
      <select
        aria-label={`CSV column for ${field}`}
        className={cn(
          "h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-all duration-200 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30",
          invalid ? "border-destructive" : "border-input",
        )}
        onChange={(event) => handleSelect(field, event.target.value)}
        value={mapping[field] ?? NOT_PRESENT}
      >
        <option value={NOT_PRESENT}>— not present —</option>
        {csvColumns.map((column) => (
          <option key={column} value={column}>
            {column}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="gap-2 border-b border-border/70 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Columns3 aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <CardTitle>Map your CSV columns</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="break-words font-medium text-foreground">
                  {fileName}
                </span>{" "}
                didn&apos;t match a known schema automatically. Map its columns to
                the required fields to build the report.
              </p>
            </div>
          </div>
          <Button
            aria-label="Cancel mapping"
            onClick={onCancel}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        {!kind ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t tell whether this is an organisational (OCF) or a
              product (PCF) footprint. Which one is it?
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button onClick={() => handleChooseKind("ocf")} type="button" variant="outline">
                {SCHEMA_LABELS.ocf}
              </Button>
              <Button onClick={() => handleChooseKind("pcf")} type="button" variant="outline">
                {SCHEMA_LABELS.pcf}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                Target schema: {SCHEMA_LABELS[kind]}
              </p>
              <button
                className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                onClick={() => setKind(null)}
                type="button"
              >
                Change schema
              </button>
            </div>

            <div className="space-y-3">
              {requiredFields.map((field) =>
                renderRow(field, { invalid: showUnmapped && !mapping[field] }),
              )}
            </div>

            {optionalFields.length > 0 ? (
              <details className="group min-w-0 rounded-lg border border-border bg-secondary/30 p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-foreground">
                  Optional columns ({optionalFields.length}) — auto-matched, expand
                  to adjust
                  <ChevronDown
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180"
                  />
                </summary>
                <p className="mt-3 text-xs text-muted-foreground">
                  Detail columns are pre-filled by header name. Remap any you
                  renamed; leave the rest — unmapped optional columns count as 0.
                </p>
                <div className="mt-3 space-y-3">
                  {optionalFields.map((field) => renderRow(field))}
                </div>
              </details>
            ) : null}

            {showUnmapped && unmapped.length > 0 ? (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Still unmapped: {unmapped.join(", ")}. Map every required field to
                build the report.
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <Button onClick={onCancel} type="button" variant="ghost">
                Cancel
              </Button>
              <Button onClick={handleConfirm} type="button">
                Build report
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
