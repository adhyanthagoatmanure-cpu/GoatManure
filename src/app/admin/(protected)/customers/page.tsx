"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, FileSpreadsheet, FileText, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/spinner";
import { formatDate, formatINR } from "@/lib/utils";
import { AdminPageHeader, EmptyNote, TABLE_HEAD, TBODY, TD, TH, TR, TableShell } from "@/components/admin/admin-ui";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

interface AdminCustomer {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[] | null>(null);
  const [query, setQuery] = useState("");
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  async function load(q?: string) {
    const res = await fetch(`/api/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const data = await res.json();
    setCustomers(data.customers ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function getAllCustomers() {
    const res = await fetch("/api/admin/customers");
    if (!res.ok) throw new Error("Unable to load customers for export");
    const data = await res.json();
    return (data.customers ?? []) as AdminCustomer[];
  }

  async function downloadExcel() {
    setExporting("excel");
    try {
      const allCustomers = await getAllCustomers();
      const rows = allCustomers.map((customer) => ({
        Name: customer.name ?? "",
        Email: customer.email,
        Phone: customer.phone ?? "",
        Status: customer.status,
        Registered: formatDate(customer.createdAt),
        Orders: customer.totalOrders,
        "Total Spent": customer.totalSpent,
      }));
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
      XLSX.writeFile(workbook, `adhyantha-customers-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch {
      window.alert("Unable to download customer details. Please try again.");
    } finally {
      setExporting(null);
    }
  }

  async function downloadPdf() {
    setExporting("pdf");
    try {
      const allCustomers = await getAllCustomers();
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const left = 10;
      const columnX = [left, 47, 105, 153, 190, 218, 242];
      let y = 16;

      pdf.setFontSize(16);
      pdf.text("ADHYANTHA Customer Details", left, y);
      pdf.setFontSize(9);
      pdf.text(`Exported: ${new Date().toLocaleDateString("en-IN")}`, left, y + 6);
      y += 16;

      const headers = ["Name", "Email", "Phone", "Status", "Registered", "Orders", "Total Spent"];
      const drawRow = (values: string[], bold = false) => {
        pdf.setFont("helvetica", bold ? "bold" : "normal");
        values.forEach((value, index) => pdf.text(value.slice(0, index === 1 ? 30 : 22), columnX[index], y));
        y += 7;
      };

      drawRow(headers, true);
      pdf.setFont("helvetica", "normal");
      allCustomers.forEach((customer) => {
        if (y > 195) {
          pdf.addPage();
          y = 16;
          drawRow(headers, true);
          pdf.setFont("helvetica", "normal");
        }
        drawRow([
          customer.name ?? "-",
          customer.email,
          customer.phone ?? "-",
          customer.status,
          formatDate(customer.createdAt),
          String(customer.totalOrders),
          formatINR(customer.totalSpent),
        ]);
      });

      pdf.save(`adhyantha-customers-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch {
      window.alert("Unable to download customer details. Please try again.");
    } finally {
      setExporting(null);
    }
  }

  if (customers === null) return <PageSpinner />;

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
      <AdminPageHeader
        icon={Users}
        title="Customers"
        description="Registered customers and their order history."
        actions={
          <>
            <Button type="button" size="sm" variant="outline" onClick={downloadExcel} disabled={exporting !== null} className="max-sm:h-11">
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
              {exporting === "excel" ? "Preparing Excel…" : "Download Excel"}
              {exporting === "excel" && <Download className="h-3.5 w-3.5" aria-hidden />}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={downloadPdf} disabled={exporting !== null} className="max-sm:h-11">
              <FileText className="h-4 w-4" aria-hidden />
              {exporting === "pdf" ? "Preparing PDF…" : "Download PDF"}
              {exporting === "pdf" && <Download className="h-3.5 w-3.5" aria-hidden />}
            </Button>
          </>
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(query);
        }}
        className="flex h-11 max-w-sm items-center gap-2 rounded-[var(--radius-sm)] border border-field-border bg-white/90 px-3.5 transition-[border-color,box-shadow] focus-within:border-canopy focus-within:ring-4 focus-within:ring-canopy/15"
      >
        <Search className="h-4 w-4 shrink-0 text-stone" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customers…"
          aria-label="Search customers"
          className="w-full bg-transparent text-sm text-ink placeholder:text-stone-light focus:outline-none"
        />
      </form>

      <TableShell>
        <table className="w-full min-w-[760px] text-sm">
          <caption className="sr-only">Customers</caption>
          <thead className={TABLE_HEAD}>
            <tr>
              <th scope="col" className={TH}>Customer</th>
              <th scope="col" className={TH}>Email</th>
              <th scope="col" className={TH}>Phone</th>
              <th scope="col" className={TH}>Registered</th>
              <th scope="col" className={TH}>Orders</th>
              <th scope="col" className={TH}>Total Spent</th>
              <th scope="col" className={TH}>Status</th>
            </tr>
          </thead>
          <tbody className={TBODY}>
            {customers.map((c) => (
              <tr key={c.id} className={TR}>
                <td className={`${TD} font-medium`}>
                  <Link href={`/admin/customers/${c.id}`} className="text-canopy underline-offset-4 hover:underline">
                    {c.name ?? "—"}
                  </Link>
                </td>
                <td className={`${TD} text-stone`}>{c.email}</td>
                <td className={`${TD} text-stone`}>{c.phone ?? "—"}</td>
                <td className={`${TD} text-stone`}>{formatDate(c.createdAt)}</td>
                <td className={`${TD} text-ink`}>{c.totalOrders}</td>
                <td className={`${TD} font-medium text-ink`}>{formatINR(c.totalSpent)}</td>
                <td className={TD}>
                  <Badge tone={c.status === "ACTIVE" ? "success" : "error"}>{c.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && <EmptyNote>No customers yet.</EmptyNote>}
      </TableShell>
    </div>
  );
}
