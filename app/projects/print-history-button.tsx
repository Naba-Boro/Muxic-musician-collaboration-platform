"use client";

export function PrintHistoryButton() {
  return <button className="button button-secondary print-history" type="button" onClick={() => window.print()}>Print / save as PDF <span>↓</span></button>;
}
