"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

type Comment = { id: string; authorName: string; comment: string; createdAt: string };

export function BlogComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/blog/${postId}/comments`).then((response) => response.json()).then((data) => setComments(data.comments ?? [])).catch(() => setMessage("Comments could not be loaded."));
  }, [postId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/blog/${postId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, comment }) });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Could not submit comment.");
        return;
      }
      setComments((current) => [data.comment, ...current]);
      setName("");
      setEmail("");
      setComment("");
      setMessage("Your comment was posted.");
    } catch {
      setMessage("Could not submit comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto mt-14 max-w-3xl border-t border-[var(--color-border)] pt-8">
      <h2 className="flex items-center gap-2 font-display text-2xl font-medium"><MessageCircle className="h-5 w-5 text-[var(--color-canopy)]" /> Comments ({comments.length})</h2>
      <form onSubmit={submit} className="mt-5 grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-2">
        <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="rounded border border-[var(--color-border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--color-canopy)]" />
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email" className="rounded border border-[var(--color-border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--color-canopy)]" />
        <textarea required minLength={3} maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Write a comment..." className="min-h-24 rounded border border-[var(--color-border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--color-canopy)] sm:col-span-2" />
        <div className="flex items-center justify-between gap-3 sm:col-span-2"><span className="text-xs text-[var(--color-stone)]">{message}</span><Button type="submit" size="sm" isLoading={submitting}>Post Comment</Button></div>
      </form>
      <div className="mt-5 space-y-4">{comments.map((item) => <div key={item.id} className="border-b border-[var(--color-border)] pb-4"><div className="flex items-center justify-between gap-3"><strong className="text-sm">{item.authorName}</strong><time className="text-xs text-[var(--color-stone)]">{formatDate(item.createdAt)}</time></div><p className="mt-1 text-sm leading-relaxed text-[var(--color-stone)]">{item.comment}</p></div>)}</div>
    </section>
  );
}
