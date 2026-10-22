import { ArrowLeft, Leaf } from "lucide-react";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ButtonLink } from "@/components/ui/button";

export default function NewBlogPostPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        icon={Leaf}
        title="New Article"
        description="Write a blog article. Drafts stay hidden until you publish them."
        actions={
          <ButtonLink href="/admin/blog" variant="outline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to blog
          </ButtonLink>
        }
      />
      <BlogPostForm />
    </div>
  );
}
