/** Longest stack kept in a report: enough to find the frame, short enough for an alert. */
const MAX_STACK_LINES = 15;

export interface ReportContext {
  device: string;
  time: string;
}

/** Plain-text report of an error (Error, string or anything thrown) for sharing. */
export function formatReport(error: unknown, { device, time }: ReportContext): string {
  let message: string;
  let stack = "";
  if (error instanceof Error) {
    message = `${error.name}: ${error.message}`;
    stack = (error.stack ?? "").split("\n").slice(1, MAX_STACK_LINES + 1).join("\n");
  } else if (typeof error === "string") {
    message = error;
  } else {
    try {
      message = JSON.stringify(error) ?? String(error);
    } catch {
      message = String(error);
    }
  }
  return [`${time} · ${device}`, message, stack].filter(Boolean).join("\n");
}
