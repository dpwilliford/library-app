"use client";

import { useFormStatus } from "react-dom";

export function SaveSelectedButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button" type="submit" disabled={pending}>
      {pending ? "Saving Selected Drafts..." : "Save Selected Drafts"}
    </button>
  );
}
