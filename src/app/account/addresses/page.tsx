"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Star } from "lucide-react";
import { AddressForm } from "@/components/checkout/address-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";
import type { AddressInput } from "@/lib/validations/checkout";
import type { Address } from "@prisma/client";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { show } = useToast();

  async function load() {
    const res = await fetch("/api/addresses");
    const data = await res.json();
    setAddresses(data.addresses ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(values: AddressInput) {
    setSubmitting(true);
    try {
      const res = editing
        ? await fetch(`/api/addresses/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          })
        : await fetch("/api/addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });
      if (res.ok) {
        show(editing ? "Address updated" : "Address added");
        setShowForm(false);
        setEditing(null);
        load();
      } else {
        show("Couldn't save this address", "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this address?")) return;
    const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    if (res.ok) {
      show("Address deleted");
      load();
    }
  }

  async function handleSetDefault(id: string) {
    const res = await fetch(`/api/addresses/${id}`, { method: "PATCH" });
    if (res.ok) {
      show("Default address updated");
      load();
    }
  }

  if (addresses === null) return <PageSpinner />;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Saved Addresses</h2>
        {!showForm && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden /> Add Address
          </Button>
        )}
      </div>

      {showForm && (
        <div className="surface mb-6 rounded-[var(--radius-md)] p-5 sm:p-6">
          <AddressForm
            defaultValues={
              editing
                ? {
                    ...editing,
                    line2: editing.line2 ?? undefined,
                  }
                : undefined
            }
            submitLabel={editing ? "Update Address" : "Save Address"}
            isSubmitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        </div>
      )}

      {addresses.length === 0 && !showForm ? (
        <EmptyState icon={MapPin} title="No saved addresses" description="Add an address to speed up checkout next time." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div key={addr.id} className="surface rounded-[var(--radius-md)] p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{addr.fullName}</p>
                {addr.isDefault && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-semibold text-gold-dark">
                    <Star className="h-3 w-3 fill-current" aria-hidden /> Default
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-stone">{addr.phone}</p>
              <p className="mt-1 text-sm text-stone">
                {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} {addr.pincode}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <button
                  onClick={() => {
                    setEditing(addr);
                    setShowForm(true);
                  }}
                  className="flex min-h-11 items-center gap-1 font-semibold text-canopy underline-offset-4 hover:underline sm:min-h-9"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="flex min-h-11 items-center gap-1 font-semibold text-error underline-offset-4 hover:underline sm:min-h-9"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
                </button>
                {!addr.isDefault && (
                  <button onClick={() => handleSetDefault(addr.id)} className="min-h-11 font-semibold text-stone underline-offset-4 hover:underline sm:min-h-9">
                    Set as default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
