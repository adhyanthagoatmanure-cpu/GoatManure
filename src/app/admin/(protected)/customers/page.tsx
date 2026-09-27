"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, FileSpreadsheet, FileText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/spinner";
import { formatDate, formatINR } from "@/lib/utils";
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-medium">Customers</h1>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={downloadExcel} disabled={exporting !== null}>
            <FileSpreadsheet className="h-4 w-4" />
            {exporting === "excel" ? "Preparing Excel…" : "Download Excel"}
            {exporting === "excel" && <Download className="h-3.5 w-3.5" />}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={downloadPdf} disabled={exporting !== null}>
            <FileText className="h-4 w-4" />
            {exporting === "pdf" ? "Preparing PDF…" : "Download PDF"}
            {exporting === "pdf" && <Download className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(query);
        }}
        className="flex max-w-sm items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-white px-3.5 py-2"
      >
        <Search className="h-4 w-4 text-[var(--color-stone)]" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers…" className="w-full text-sm focus:outline-none" />
      </form>

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-parchment-deep)]/50 text-left text-xs uppercase tracking-wide text-[var(--color-stone)]">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total Spent</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/admin/customers/${c.id}`} className="text-[var(--color-canopy)] hover:underline">
                    {c.name ?? "—"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--color-stone)]">{c.email}</td>
                <td className="px-4 py-3 text-[var(--color-stone)]">{c.phone ?? "—"}</td>
                <td className="px-4 py-3 text-[var(--color-stone)]">{formatDate(c.createdAt)}</td>
                <td className="px-4 py-3">{c.totalOrders}</td>
                <td className="px-4 py-3 font-medium">{formatINR(c.totalSpent)}</td>
                <td className="px-4 py-3">
                  <Badge tone={c.status === "ACTIVE" ? "success" : "error"}>{c.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && <p className="p-8 text-center text-sm text-[var(--color-stone)]">No customers yet.</p>}
      </div>
    </div>
  );
}
