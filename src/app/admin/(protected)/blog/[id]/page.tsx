import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Leaf } from "lucide-react";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ButtonLink } from "@/components/ui/button";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={Leaf}
        title="Edit Article"
        description={post.title}
        actions={
          <ButtonLink href="/admin/blog" variant="outline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to blog
          </ButtonLink>
        }
      />
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
