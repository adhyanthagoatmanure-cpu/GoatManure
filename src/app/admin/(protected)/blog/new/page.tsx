import { BlogPostForm } from "@/components/admin/blog-post-form";

export default function NewBlogPostPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-medium">New Article</h1>
      <BlogPostForm />
    </div>
  );
}
