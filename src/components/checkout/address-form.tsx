"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema, type AddressInput } from "@/lib/validations/checkout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
        <Input label="Full Name" autoComplete="name" {...register("fullName")} error={errors.fullName?.message} />
          <Input label="Phone Number" type="tel" autoComplete="tel" {...register("phone")} error={errors.phone?.message} />
      </div>
      <Input label="Address" placeholder="House no., street, area" autoComplete="address-line1" {...register("line1")} error={errors.line1?.message} />
      <Input label="Apartment, suite, etc. (optional)" autoComplete="address-line2" {...register("line2")} error={errors.line2?.message} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="City" autoComplete="address-level2" {...register("city")} error={errors.city?.message} />
        <Input label="State / Province / Region" autoComplete="address-level1" {...register("state")} error={errors.state?.message} />
        <Input label="Postal / PIN Code" autoComplete="postal-code" {...register("pincode")} error={errors.pincode?.message} />
      </div>
      <Input label="Country" autoComplete="country-name" {...register("country")} error={errors.country?.message} />

      <div className="mt-2 flex flex-wrap gap-3">
        <Button type="submit" isLoading={isSubmitting}>{submitLabel}</Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
