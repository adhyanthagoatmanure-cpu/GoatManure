import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlogPostForm } from "@/components/admin/blog-post-form";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl font-medium">Edit Article</h1>
      <BlogPostForm
        postId={post.id}
        defaultValues={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category ?? "",
          author: post.author,
          status: post.status,
          seoTitle: post.seoTitle ?? "",
          seoDescription: post.seoDescription ?? "",
        }}
      />
    </div>
  );
}
