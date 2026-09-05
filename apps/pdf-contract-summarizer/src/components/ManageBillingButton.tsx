"use client";

export default function ManageBillingButton() {
  async function handleClick() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error ?? "Could not open billing portal.");
    }
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
    >
      Manage Billing
    </button>
  );
}
