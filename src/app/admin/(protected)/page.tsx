import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Bolt,
  Leaf,
  MessageSquareQuote,
  Package,
  ShoppingCart,
  Star,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatINR, normalizeProductImages } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DashboardDateCard, OrderStatusChart, SalesOverview, type SalesPoint, type StatusPoint } from "@/components/admin/dashboard-widgets";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE } from "@/types";

const statusColors: Record<string, string> = {
  Delivered: "#2e9b57",
  Confirmed: "#4f9c42",
  Processing: "#e9a52b",
  Pending: "#c49a4a",
  Cancelled: "#d64545",
};

export default async function AdminDashboardPage() {
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const [
    totalProducts,
    totalOrders,
    totalCustomers,
    totalTestimonials,
    ordersByStatus,
    ordersForChart,
    recentOrders,
    topOrderItems,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.testimonial.count(),
    prisma.order.groupBy({ by: ["orderStatus"], _count: { _all: true } }),
    prisma.order.findMany({ where: { createdAt: { gte: yearAgo }, orderStatus: { not: "CANCELLED" } }, select: { createdAt: true, totalAmount: true }, orderBy: { createdAt: "asc" } }),
    prisma.order.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
    prisma.orderItem.groupBy({ by: ["variantId"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 4 }),
  ]);

  const chartMap = new Map<string, number>();
  for (const order of ordersForChart) {
    const date = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(order.createdAt);
    chartMap.set(date, (chartMap.get(date) ?? 0) + order.totalAmount);
  }
  const salesData: SalesPoint[] = Array.from(chartMap, ([date, revenue]) => ({ date, revenue }));

  const statusData: StatusPoint[] = [
    { name: "Delivered", value: ordersByStatus.find((item) => item.orderStatus === "DELIVERED")?._count._all ?? 0, color: statusColors.Delivered },
    { name: "Confirmed", value: ordersByStatus.find((item) => item.orderStatus === "CONFIRMED")?._count._all ?? 0, color: statusColors.Confirmed },
    { name: "Processing", value: ordersByStatus.filter((item) => ["PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"].includes(item.orderStatus)).reduce((sum, item) => sum + item._count._all, 0), color: statusColors.Processing },
    { name: "Pending", value: ordersByStatus.find((item) => item.orderStatus === "NEW")?._count._all ?? 0, color: statusColors.Pending },
    { name: "Cancelled", value: ordersByStatus.find((item) => item.orderStatus === "CANCELLED")?._count._all ?? 0, color: statusColors.Cancelled },
  ];

  const topVariants = await prisma.productVariant.findMany({
    where: { id: { in: topOrderItems.map((item) => item.variantId) } },
    include: { product: { select: { name: true, images: true } } },
  });
  const topProducts = topOrderItems.map((item) => {
    const variant = topVariants.find((candidate) => candidate.id === item.variantId);
    return variant ? { id: variant.id, name: variant.product.name, image: normalizeProductImages(variant.product.images)[0], stock: variant.stock, orders: item._sum.quantity ?? 0 } : null;
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  const stats = [
    { label: "Total Products", value: totalProducts, icon: Leaf, href: "/admin/products", tint: "bg-[#eef8e7]", iconTint: "text-[#4f9c42]" },
    { label: "Total Orders", value: totalOrders, icon: ShoppingCart, href: "/admin/orders", tint: "bg-[#edf6f8]", iconTint: "text-[#3c8c9b]" },
    { label: "Total Customers", value: totalCustomers, icon: Users, href: "/admin/customers", tint: "bg-[#fff6e5]", iconTint: "text-[#d28b25]" },
    { label: "Testimonials", value: totalTestimonials, icon: Star, href: "/admin/testimonials", tint: "bg-[#fff0ef]", iconTint: "text-[#d05c55]" },
  ];

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-3 lg:h-full lg:gap-2">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center lg:min-h-[52px]">
        <div>
          <p className="mb-1 text-xs font-medium text-[#69a653]">Good to see you again</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[#173d2b] sm:text-3xl">Welcome Back, Admin!</h1>
          <p className="mt-0.5 text-xs text-[#6b7a70]">Here&apos;s what&apos;s happening with your business today.</p>
        </div>
        <DashboardDateCard />
      </div>

      <div className="grid min-h-0 items-start gap-3 md:grid-cols-[minmax(0,1fr)_minmax(245px,280px)] lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(245px,280px)]">
        <div className="flex min-w-0 flex-col gap-3 lg:min-h-0">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:shrink-0">
            {stats.map((stat) => (
              <Link key={stat.label} href={stat.href} className="group rounded-xl border border-[#e3ebe2] bg-white p-2.5 shadow-[0_8px_24px_rgba(20,67,43,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(20,67,43,0.1)] lg:min-h-0">
                <div className="flex items-center justify-between"><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.tint}`}><stat.icon className={`h-4 w-4 ${stat.iconTint}`} /></span><ArrowUpRight className="h-3.5 w-3.5 text-[#9aae9d] transition group-hover:text-[#4f9c42]" /></div>
                <p className="mt-1 font-display text-xl font-semibold text-[#173d2b]">{stat.value}</p>
                <p className="mt-0.5 text-xs text-[#6b7a70]">{stat.label}</p>
                <p className="mt-1 text-[10px] font-medium text-[#69a653]">Live data ↑</p>
              </Link>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1.6fr)_minmax(245px,0.9fr)] lg:min-h-0 lg:shrink-0">
            <SalesOverview data={salesData} />
            <OrderStatusChart data={statusData} total={totalOrders} />
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:min-h-0 lg:flex-1">
            <section className="overflow-hidden rounded-xl border border-[#e3ebe2] bg-white p-3 shadow-[0_8px_24px_rgba(20,67,43,0.05)] sm:p-4">
              <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 font-display text-lg font-semibold text-[#173d2b]"><Leaf className="h-5 w-5 text-[#69be28]" />Top Products</h2><Link href="/admin/products" className="text-xs font-semibold text-[#4f9c42] hover:underline">View All →</Link></div>
              <div className="grid grid-cols-2 gap-3">
                {topProducts.length === 0 && <p className="col-span-2 py-10 text-center text-sm text-[#6b7a70]">Products will appear here after sales.</p>}
                {topProducts.map((product) => (
                  <Link key={product.id} href={`/admin/products/${product.id}`} className="group rounded-xl border border-[#edf2eb] p-3 transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="relative aspect-[2.1] overflow-hidden rounded-lg bg-[#f3f8f1]">{product.image ? <Image src={product.image} alt={product.name} fill sizes="180px" className="object-cover transition group-hover:scale-105" /> : <Package className="absolute inset-0 m-auto h-6 w-6 text-[#a2b9a0]" />}</div>
                      <p className="mt-1 truncate text-[11px] font-semibold text-[#315b45]">{product.name}</p><p className="mt-0.5 text-[10px] text-[#849289]">{product.stock} in stock · {product.orders} sold</p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-[#e3ebe2] bg-white p-3 shadow-[0_8px_24px_rgba(20,67,43,0.05)] sm:p-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-[#173d2b]"><Bolt className="h-5 w-5 text-[#e9a52b]" />Quick Actions</h2>
              <div className="mt-2 grid gap-1">{[
                ["/admin/products/new", "Add New Product", Package], ["/admin/orders", "View Orders", ShoppingCart], ["/admin/customers", "Manage Customers", Users], ["/admin/testimonials", "View Testimonials", MessageSquareQuote], ["/admin/blog", "Update Blog", Leaf],
              ].map(([href, label, Icon]) => <Link key={String(href)} href={String(href)} className="flex items-center gap-2 rounded-lg bg-[#f7faf5] px-2 py-1.5 text-xs font-medium text-[#315b45] transition hover:bg-[#eaf6e2]"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[#4f9c42] shadow-sm"><Icon className="h-3.5 w-3.5" /></span>{String(label)}<ArrowUpRight className="ml-auto h-3.5 w-3.5 text-[#9aae9d]" /></Link>)}</div>
            </section>
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-3 lg:min-h-0">
          <section className="overflow-hidden rounded-xl border border-[#e3ebe2] bg-white p-3 shadow-[0_8px_24px_rgba(20,67,43,0.05)] sm:p-4">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-semibold text-[#173d2b]">Recent Orders</h2><Link href="/admin/orders" className="text-xs font-semibold text-[#4f9c42] hover:underline">View All <span aria-hidden>→</span></Link></div>
            <div className="divide-y divide-[#edf2eb]">
              {recentOrders.length === 0 && <p className="py-10 text-center text-sm text-[#6b7a70]">No orders yet.</p>}
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/admin/orders/${order.id}`} className="block py-3 transition hover:bg-[#fbfdf9]">
                  <div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-[#315b45]">{order.orderNumber}</p><p className="mt-1 text-xs text-[#849289]">{formatDate(order.createdAt)}</p></div><p className="font-semibold text-[#173d2b]">{formatINR(order.totalAmount)}</p></div>
                  <div className="mt-2 flex items-center justify-between"><Badge tone={ORDER_STATUS_TONE[order.orderStatus]}>{ORDER_STATUS_LABELS[order.orderStatus]}</Badge><ArrowUpRight className="h-4 w-4 text-[#9aae9d]" /></div>
                </Link>
              ))}
            </div>
          </section>

          <section className="relative min-h-[150px] overflow-hidden rounded-xl bg-[#0b4d2c] p-4 text-white shadow-[0_8px_24px_rgba(20,67,43,0.12)] lg:flex-1">
            <div className="relative z-10 max-w-[190px]"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#bde7a5]">ADHYANTHA</p><h2 className="mt-2 font-display text-2xl font-semibold leading-tight">Better Soil.<br />Better Harvest.</h2><p className="mt-2 text-xs leading-4 text-[#d8efda]">100% organic care for healthier farms and greener futures.</p><div className="mt-3 flex flex-wrap gap-1 text-[10px] font-medium text-[#e7f6df]"><span className="rounded-full bg-white/10 px-2 py-1">100% Organic</span><span className="rounded-full bg-white/10 px-2 py-1">Soil Health</span></div></div>
            <Image src="/images/08_adhyantha_product_bag.jpg" alt="Adhyantha goat manure product" fill sizes="500px" className="object-cover opacity-35" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b4d2c] via-[#0b4d2c]/80 to-transparent" />
          </section>
        </aside>
      </div>
    </div>
  );
}
