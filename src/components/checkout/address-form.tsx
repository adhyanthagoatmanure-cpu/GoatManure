"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, type AddressInput } from "@/lib/validations/checkout";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry",
  "Chandigarh", "Andaman and Nicobar Islands",
];

export function AddressForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save Address",
  isSubmitting,
  onCancel,
}: {
  defaultValues?: Partial<AddressInput>;
  onSubmit: (values: AddressInput) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  onCancel?: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "India", ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full Name" {...register("fullName")} error={errors.fullName?.message} />
        <Input label="Phone Number" type="tel" inputMode="numeric" {...register("phone")} error={errors.phone?.message} />
      </div>
      <Input label="Address" placeholder="House no., street, area" {...register("line1")} error={errors.line1?.message} />
      <Input label="Apartment, suite, etc. (optional)" {...register("line2")} error={errors.line2?.message} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="City" {...register("city")} error={errors.city?.message} />
        <Select label="State" {...register("state")} error={errors.state?.message} defaultValue="">
          <option value="" disabled>Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Input label="PIN Code" inputMode="numeric" {...register("pincode")} error={errors.pincode?.message} />
      </div>
      <Input label="Country" {...register("country")} readOnly className="bg-[var(--color-parchment-deep)]" />

      <div className="mt-2 flex gap-3">
        <Button type="submit" isLoading={isSubmitting}>{submitLabel}</Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
