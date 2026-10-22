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
import { cn, formatDate, formatINR, normalizeProductImages } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DashboardDateCard, OrderStatusChart, SalesOverview, type SalesPoint, type StatusPoint } from "@/components/admin/dashboard-widgets";
import { ORDER_STATUS_CHART_COLORS } from "@/components/admin/chart-colors";
import { PANEL, PANEL_GLASS } from "@/components/admin/admin-ui";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE } from "@/types";

export const dynamic = "force-dynamic";

const statusColors = ORDER_STATUS_CHART_COLORS;

const QUICK_ACTIONS = [
  { href: "/admin/products/new", label: "Add New Product", icon: Package },
  { href: "/admin/orders", label: "View Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Manage Customers", icon: Users },
  { href: "/admin/testimonials", label: "View Testimonials", icon: MessageSquareQuote },
  { href: "/admin/blog", label: "Update Blog", icon: Leaf },
];

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

  // Icon chips use token tints; the glass cards themselves are the only blurred elements in this row.
  const stats = [
    { label: "Total Products", value: totalProducts, icon: Leaf, href: "/admin/products", tint: "bg-sage text-canopy" },
    { label: "Total Orders", value: totalOrders, icon: ShoppingCart, href: "/admin/orders", tint: "bg-bronze/10 text-bronze-dark" },
    { label: "Total Customers", value: totalCustomers, icon: Users, href: "/admin/customers", tint: "bg-leaf/10 text-canopy-light" },
    { label: "Testimonials", value: totalTestimonials, icon: Star, href: "/admin/testimonials", tint: "bg-gold/20 text-gold-dark" },
  ];

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-4 lg:gap-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="eyebrow">Good to see you again</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Welcome Back, Admin!</h1>
          <p className="mt-1 text-sm text-stone">Here&apos;s what&apos;s happening with your business today.</p>
        </div>
        <DashboardDateCard />
      </div>

      <div className="grid items-start gap-4 lg:gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((stat) => (
              <Link key={stat.label} href={stat.href} className={cn(PANEL_GLASS, "glass-lift group p-3.5 sm:p-4")}>
                <div className="flex items-center justify-between">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)]", stat.tint)}>
                    <stat.icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-stone-light transition-colors group-hover:text-canopy" aria-hidden />
                </div>
                <p className="mt-3 font-display text-2xl font-semibold text-ink">{stat.value}</p>
                <p className="mt-0.5 text-sm text-stone">{stat.label}</p>
                <p className="mt-1.5 text-xs font-medium text-canopy-light">Live data</p>
              </Link>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(245px,0.9fr)] lg:gap-5">
            <SalesOverview data={salesData} />
            <OrderStatusChart data={statusData} total={totalOrders} />
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-5">
            <section className={cn(PANEL, "overflow-hidden p-4 sm:p-5")}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                  <Leaf className="h-5 w-5 text-leaf" aria-hidden />
                  Top Products
                </h2>
                <Link href="/admin/products" className="text-xs font-semibold text-canopy underline-offset-4 hover:underline">View All →</Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {topProducts.length === 0 && <p className="col-span-2 py-10 text-center text-sm text-stone">Products will appear here after sales.</p>}
                {topProducts.map((product) => (
                  <Link key={product.id} href={`/admin/products/${product.id}`} className="glass-lift group rounded-[var(--radius-sm)] border border-border bg-white p-3">
                    <div className="relative aspect-[2.1] overflow-hidden rounded-[var(--radius-sm)] bg-sage">
                      {product.image ? (
                        <Image src={product.image} alt={product.name} fill sizes="180px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <Package className="absolute inset-0 m-auto h-6 w-6 text-stone-light" aria-hidden />
                      )}
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold text-ink">{product.name}</p>
                    <p className="mt-0.5 text-xs text-stone">{product.stock} in stock · {product.orders} sold</p>
                  </Link>
                ))}
              </div>
            </section>

            <section className={cn(PANEL, "overflow-hidden p-4 sm:p-5")}>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                <Bolt className="h-5 w-5 text-gold-dark" aria-hidden />
                Quick Actions
              </h2>
              <div className="mt-3 grid gap-1.5">
                {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex min-h-11 items-center gap-2.5 rounded-[var(--radius-sm)] bg-sage/50 px-2.5 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-sage"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-canopy shadow-sm">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    {label}
                    <ArrowUpRight className="ml-auto h-4 w-4 text-stone-light" aria-hidden />
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>

        <aside className="grid min-w-0 gap-4 md:grid-cols-2 lg:gap-5 xl:grid-cols-1">
          <section className={cn(PANEL, "overflow-hidden p-4 sm:p-5")}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-ink">Recent Orders</h2>
              <Link href="/admin/orders" className="text-xs font-semibold text-canopy underline-offset-4 hover:underline">View All <span aria-hidden>→</span></Link>
            </div>
            <div className="divide-y divide-border">
              {recentOrders.length === 0 && <p className="py-10 text-center text-sm text-stone">No orders yet.</p>}
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/admin/orders/${order.id}`} className="-mx-2 block rounded-[var(--radius-sm)] px-2 py-3 transition-colors hover:bg-sage/40">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{order.orderNumber}</p>
                      <p className="mt-0.5 text-xs text-stone">{formatDate(order.createdAt)}</p>
                    </div>
                    <p className="shrink-0 font-semibold text-ink">{formatINR(order.totalAmount)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge tone={ORDER_STATUS_TONE[order.orderStatus]}>{ORDER_STATUS_LABELS[order.orderStatus]}</Badge>
                    <ArrowUpRight className="h-4 w-4 text-stone-light" aria-hidden />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="relative isolate min-h-[190px] overflow-hidden rounded-[var(--radius-md)] bg-canopy-dark p-5 text-white shadow-[var(--shadow-soft)]">
            <div className="relative z-10 max-w-[210px]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage-deep">ADHYANTHA</p>
              <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-white">Better Soil.<br />Better Harvest.</h2>
              <p className="mt-2 text-sm leading-5 text-sage">100% organic care for healthier farms and greener futures.</p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-medium text-white">
                <span className="rounded-full bg-white/15 px-2.5 py-1">100% Organic</span>
                <span className="rounded-full bg-white/15 px-2.5 py-1">Soil Health</span>
              </div>
            </div>
            <Image src="/images/08_adhyantha_product_bag.jpg" alt="Adhyantha goat manure product" fill sizes="500px" className="object-cover opacity-35" />
            <div className="absolute inset-0 bg-gradient-to-r from-canopy-dark via-canopy-dark/80 to-transparent" />
          </section>
        </aside>
      </div>
    </div>
  );
}
