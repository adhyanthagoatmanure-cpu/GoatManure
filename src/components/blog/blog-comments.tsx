"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    <section aria-labelledby="blog-comments-heading" className="mx-auto mt-14 max-w-3xl border-t border-border pt-8">
      <h2 id="blog-comments-heading" className="flex items-center gap-2.5 font-display text-2xl font-medium sm:text-3xl">
        <MessageCircle className="h-5 w-5 text-leaf" aria-hidden /> Comments ({comments.length})
      </h2>
      <form onSubmit={submit} className="surface mt-5 grid gap-4 rounded-[var(--radius-lg)] p-5 sm:grid-cols-2 sm:p-6">
        <Input label="Your name" name="comment-name" required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
        <Input label="Your email" name="comment-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        <div className="sm:col-span-2">
          <Textarea label="Comment" name="comment-body" required minLength={3} maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Write a comment..." />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
          <span role="status" aria-live="polite" className="text-sm text-stone">{message}</span>
          <Button type="submit" isLoading={submitting}>Post Comment</Button>
        </div>
      </form>
      <ul className="mt-6 space-y-3">
        {comments.map((item) => (
          <li key={item.id} className="surface rounded-[var(--radius-md)] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <strong className="text-sm font-semibold text-ink">{item.authorName}</strong>
              <time dateTime={item.createdAt} className="text-xs text-stone">{formatDate(item.createdAt)}</time>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-stone">{item.comment}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
