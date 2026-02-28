"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { es } from "react-day-picker/locale";
import { updateService } from "@/app/(dashboard)/servicios/actions";
import { formatCurrency } from "@/lib/utils";
import type {
  ServiceSummary,
  ServiceMemberInfo,
  Member,
} from "@/types/database";
import { cn, getInitials } from "@/lib/utils";
import IconEmojiPicker from "@/components/servicios/icon-emoji-picker";
import { useMediaQuery } from "@/hooks/use-media-query";

const COLOR_OPTIONS = [
  { value: "#e50914", tw: "bg-red-500" },
  { value: "#3b82f6", tw: "bg-blue-500" },
  { value: "#22c55e", tw: "bg-green-500" },
  { value: "#a855f7", tw: "bg-purple-500" },
  { value: "#f97316", tw: "bg-orange-500" },
  { value: "#737373", tw: "bg-neutral-500" },
];

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  color: z.string().min(1, "El color es requerido"),
  monthly_cost: z.number().positive("El costo debe ser mayor a 0"),
  billing_day: z.number().int().min(1).max(31),
  split_type: z.enum(["equal", "custom"]),
  icon_url: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function getNextBillingDate(billingDay: number): Date {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), billingDay);
  if (thisMonth > now) return thisMonth;
  return new Date(now.getFullYear(), now.getMonth() + 1, billingDay);
}

interface EditServiceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceSummary;
  members: Pick<Member, "id" | "name" | "email">[];
}

export default function EditServiceDrawer({
  open,
  onOpenChange,
  service,
  members,
}: EditServiceDrawerProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [submitting, setSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Local member state (changes are NOT saved until submit)
  const [serviceMembers, setServiceMembers] = useState<ServiceMemberInfo[]>(
    service.members ?? [],
  );
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingAmountFor, setEditingAmountFor] = useState<string | null>(null);
  const [editAmountValue, setEditAmountValue] = useState("");

  // Track pending changes (applied on submit)
  const [addedMemberIds, setAddedMemberIds] = useState<Set<string>>(new Set());
  const [removedMemberIds, setRemovedMemberIds] = useState<Set<string>>(
    new Set(),
  );
  const [amountChanges, setAmountChanges] = useState<
    Record<string, number | null>
  >({});

  const [billingDate, setBillingDate] = useState<Date>(() =>
    getNextBillingDate(service.billing_day),
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: service.name,
      color: service.color,
      monthly_cost: service.monthly_cost,
      billing_day: service.billing_day,
      split_type: service.split_type,
      icon_url: service.icon_url,
    },
  });

  // Reset state when drawer opens or service changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: service.name,
        color: service.color,
        monthly_cost: service.monthly_cost,
        billing_day: service.billing_day,
        split_type: service.split_type,
        icon_url: service.icon_url,
      });
      setServiceMembers(service.members ?? []);
      setBillingDate(getNextBillingDate(service.billing_day));
      setShowAddMember(false);
      setEditingAmountFor(null);
      setAddedMemberIds(new Set());
      setRemovedMemberIds(new Set());
      setAmountChanges({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, service.id]);

  const watchedColor = form.watch("color");
  const watchedIcon = form.watch("icon_url");
  const watchedCost = form.watch("monthly_cost");
  const watchedSplit = form.watch("split_type");

  const totalPersons = serviceMembers.length + 1; // +1 for owner
  const perPersonAmount =
    watchedSplit === "equal" && watchedCost > 0 && totalPersons > 0
      ? watchedCost / totalPersons
      : 0;

  // Personas available to add (not already members)
  const memberMemberIds = new Set(serviceMembers.map((m) => m.member_id));
  const availableMembers = members.filter((m) => !memberMemberIds.has(m.id));

  function formatBillingDate(date: Date) {
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "long",
    }).format(date);
  }

  // Add member locally (no DB call)
  function handleAddMember(person: Pick<Member, "id" | "name" | "email">) {
    setServiceMembers((prev) => [
      ...prev,
      {
        member_id: person.id,
        custom_amount: null,
        is_active: true,
        name: person.name,
        email: person.email ?? null,
        avatar_url: null,
      },
    ]);

    // If this member was previously removed in this session, undo the removal
    if (removedMemberIds.has(person.id)) {
      setRemovedMemberIds((prev) => {
        const next = new Set(prev);
        next.delete(person.id);
        return next;
      });
    } else {
      setAddedMemberIds((prev) => new Set(prev).add(person.id));
    }

    if (availableMembers.length <= 1) {
      setShowAddMember(false);
    }
  }

  // Remove member locally (no DB call)
  function handleRemoveMember(member: ServiceMemberInfo) {
    setServiceMembers((prev) =>
      prev.filter((m) => m.member_id !== member.member_id),
    );

    // If this member was added in this session, undo the addition
    if (addedMemberIds.has(member.member_id)) {
      setAddedMemberIds((prev) => {
        const next = new Set(prev);
        next.delete(member.member_id);
        return next;
      });
    } else {
      setRemovedMemberIds((prev) => new Set(prev).add(member.member_id));
    }

    // Clean up any amount changes for this member
    setAmountChanges((prev) => {
      const next = { ...prev };
      delete next[member.member_id];
      return next;
    });
  }

  // Save custom amount locally (no DB call)
  function handleSaveCustomAmount(member: ServiceMemberInfo) {
    const amount = editAmountValue.trim() ? parseFloat(editAmountValue) : null;
    if (editAmountValue.trim() && (isNaN(amount!) || amount! < 0)) {
      toast.error("Cantidad inválida");
      return;
    }

    setServiceMembers((prev) =>
      prev.map((m) =>
        m.member_id === member.member_id ? { ...m, custom_amount: amount } : m,
      ),
    );
    setAmountChanges((prev) => ({
      ...prev,
      [member.member_id]: amount,
    }));
    setEditingAmountFor(null);
    setEditAmountValue("");
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("id", service.id);
      fd.set("name", values.name);
      fd.set("color", values.color);
      fd.set("monthly_cost", String(values.monthly_cost));
      fd.set("billing_day", String(values.billing_day));
      fd.set("split_type", values.split_type);
      if (values.icon_url) fd.set("icon_url", values.icon_url);

      // Batch member additions
      if (addedMemberIds.size > 0) {
        const addedMembers = [...addedMemberIds].map((id) => ({
          id,
          custom_amount: amountChanges[id] ?? null,
        }));
        fd.set("added_members", JSON.stringify(addedMembers));
      }

      // Batch member removals
      if (removedMemberIds.size > 0) {
        fd.set("removed_members", JSON.stringify([...removedMemberIds]));
      }

      // Batch amount updates (only for existing members, not newly added)
      const existingAmountUpdates = Object.entries(amountChanges)
        .filter(([id]) => !addedMemberIds.has(id))
        .map(([member_id, custom_amount]) => ({ member_id, custom_amount }));
      if (existingAmountUpdates.length > 0) {
        fd.set("amount_updates", JSON.stringify(existingAmountUpdates));
      }

      const result = await updateService(fd);
      if (result.success) {
        toast.success("Servicio actualizado");
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Error al actualizar");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const hasPendingChanges =
    addedMemberIds.size > 0 ||
    removedMemberIds.size > 0 ||
    Object.keys(amountChanges).length > 0 ||
    form.formState.isDirty;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        showCloseButton={false}
        className={cn(
          "bg-neutral-950 border-neutral-800 p-0 gap-0 flex flex-col",
          isDesktop ? "sm:max-w-md h-full" : "max-h-[92vh] rounded-t-2xl",
        )}
      >
        {/* Drag Handle (mobile only) */}
        {!isDesktop && (
          <div className="flex justify-center pt-2 pb-0">
            <div className="w-9 h-1 rounded-full bg-neutral-700" />
          </div>
        )}

        {/* Header */}
        <div className="flex shrink-0 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl items-center justify-between px-5 pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-black border border-neutral-800 flex items-center justify-center shadow-lg"
              style={{ boxShadow: `0 4px 14px ${watchedColor}1a` }}
            >
              <Icon
                icon={watchedIcon || "solar:tv-bold"}
                width={20}
                style={{ color: watchedColor }}
              />
            </div>
            <SheetTitle className="text-lg font-medium text-white tracking-tight">
              Editar Servicio
            </SheetTitle>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors focus:outline-none"
          >
            <Icon icon="solar:close-circle-linear" width={20} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col overflow-hidden flex-1"
        >
          <div className="p-5 overflow-y-auto space-y-6 flex-1">
            {/* Name & Icon */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-neutral-400 tracking-wide">
                NOMBRE E ICONO
              </label>
              <div className="flex gap-3">
                <IconEmojiPicker
                  value={watchedIcon ?? null}
                  color={watchedColor}
                  onChange={(v) => form.setValue("icon_url", v || null)}
                />
                <div className="flex-1">
                  <input
                    {...form.register("name")}
                    placeholder="Ej. Netflix"
                    className="w-full h-12 bg-neutral-900/20 border border-neutral-800 focus:border-neutral-600 focus:ring-0 rounded-xl px-4 text-sm font-medium text-neutral-200 placeholder:text-neutral-600 outline-none transition-all"
                  />
                </div>
              </div>
              {form.formState.errors.name && (
                <p className="text-xs text-red-400">
                  {form.formState.errors.name.message}
                </p>
              )}

              {/* Color Palette */}
              <div className="flex items-center gap-3 py-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => form.setValue("color", c.value)}
                    className={cn(
                      "w-5 h-5 rounded-full cursor-pointer focus:outline-none transition-opacity",
                      c.tw,
                      watchedColor === c.value
                        ? "ring-2 ring-offset-2 ring-offset-neutral-950 ring-white"
                        : "opacity-30 hover:opacity-100",
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-neutral-400 tracking-wide">
                COSTO MENSUAL
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium">
                  $
                </span>
                <input
                  {...form.register("monthly_cost", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full h-12 bg-neutral-900/20 border border-neutral-800 focus:border-neutral-600 focus:ring-0 rounded-xl pl-8 pr-4 text-sm font-medium text-neutral-200 outline-none transition-all"
                />
              </div>
              {form.formState.errors.monthly_cost && (
                <p className="text-xs text-red-400">
                  {form.formState.errors.monthly_cost.message}
                </p>
              )}
              {watchedCost > 0 &&
                serviceMembers.length > 0 &&
                watchedSplit === "equal" && (
                  <p className="text-[11px] text-neutral-500">
                    Cada miembro paga{" "}
                    <span className="text-neutral-300">
                      {formatCurrency(perPersonAmount)}
                    </span>{" "}
                    ({totalPersons} personas)
                  </p>
                )}
            </div>

            {/* Billing Day */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-neutral-400 tracking-wide">
                DIA DE COBRO
              </label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full h-12 bg-neutral-900/20 border border-neutral-800 hover:border-neutral-700 rounded-xl px-4 text-sm font-medium text-neutral-200 outline-none transition-all flex items-center justify-between group focus:outline-none"
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon
                        icon="solar:calendar-linear"
                        width={16}
                        className="text-neutral-500 group-hover:text-neutral-300 transition-colors"
                      />
                      Día {form.watch("billing_day")} de cada mes
                    </span>
                    <span className="text-neutral-500 text-xs">
                      Próximo: {formatBillingDate(billingDate)}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-neutral-950 border-neutral-800 rounded-xl"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={billingDate}
                    onSelect={(date) => {
                      if (date) {
                        setBillingDate(date);
                        form.setValue("billing_day", date.getDate());
                        setCalendarOpen(false);
                      }
                    }}
                    locale={es}
                    defaultMonth={billingDate}
                    className="bg-neutral-950 text-neutral-200"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Split Type */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-neutral-400 tracking-wide">
                TIPO DE DIVISION
              </label>
              <div className="flex p-1 bg-neutral-900/40 border border-neutral-800 rounded-xl h-12">
                <button
                  type="button"
                  onClick={() => form.setValue("split_type", "equal")}
                  className={cn(
                    "flex-1 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 focus:outline-none",
                    watchedSplit === "equal"
                      ? "text-white bg-neutral-700/60 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-300",
                  )}
                >
                  <Icon icon="solar:users-group-rounded-linear" width={16} />
                  Equitativa
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue("split_type", "custom")}
                  className={cn(
                    "flex-1 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 focus:outline-none",
                    watchedSplit === "custom"
                      ? "text-white bg-neutral-700/60 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-300",
                  )}
                >
                  <Icon icon="solar:tuning-2-linear" width={16} />
                  Personalizada
                </button>
              </div>
            </div>

            {/* Members Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-400 tracking-wide">
                  MIEMBROS ({serviceMembers.length})
                </label>
              </div>

              <div className="space-y-2">
                {/* Owner (always shown) */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/30 border border-neutral-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-medium text-neutral-400">
                      TÚ
                    </div>
                    <span className="text-sm font-medium text-neutral-200">
                      Tú (Propietario)
                    </span>
                  </div>
                  {watchedSplit === "equal" && perPersonAmount > 0 && (
                    <span className="text-xs font-mono text-neutral-500">
                      {formatCurrency(perPersonAmount)}
                    </span>
                  )}
                </div>

                {/* Current Members */}
                {serviceMembers.map((member) => {
                  const isNewlyAdded = addedMemberIds.has(member.member_id);
                  return (
                    <div
                      key={member.member_id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl bg-neutral-900/30 border group/member",
                        isNewlyAdded
                          ? "border-violet-500/30 bg-violet-500/5"
                          : "border-neutral-800/80",
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-medium text-neutral-400">
                          {getInitials(member.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-200 truncate">
                            {member.name}
                          </p>
                          {member.email && (
                            <p className="text-[10px] text-neutral-500 truncate">
                              {member.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Amount display / edit */}
                        {watchedSplit === "custom" ? (
                          editingAmountFor === member.member_id ? (
                            <div className="flex items-center gap-1.5">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">
                                  $
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editAmountValue}
                                  onChange={(e) =>
                                    setEditAmountValue(e.target.value)
                                  }
                                  placeholder="0.00"
                                  className="w-20 h-7 bg-neutral-900 border border-neutral-700 focus:border-neutral-500 rounded-lg pl-5 pr-2 text-xs font-mono text-neutral-200 outline-none"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleSaveCustomAmount(member);
                                    }
                                    if (e.key === "Escape") {
                                      setEditingAmountFor(null);
                                      setEditAmountValue("");
                                    }
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSaveCustomAmount(member)}
                                className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-colors focus:outline-none"
                              >
                                <Icon
                                  icon="solar:check-read-linear"
                                  width={14}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAmountFor(null);
                                  setEditAmountValue("");
                                }}
                                className="w-7 h-7 rounded-lg bg-neutral-800/40 flex items-center justify-center text-neutral-400 hover:text-neutral-200 transition-colors focus:outline-none"
                              >
                                <Icon
                                  icon="solar:close-circle-linear"
                                  width={14}
                                />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAmountFor(member.member_id);
                                setEditAmountValue(
                                  member.custom_amount != null
                                    ? String(member.custom_amount)
                                    : "",
                                );
                              }}
                              className="px-2 h-7 rounded-lg bg-neutral-800/40 border border-neutral-800 hover:border-neutral-600 text-xs font-mono text-neutral-400 hover:text-neutral-200 transition-all flex items-center gap-1.5 focus:outline-none"
                            >
                              {member.custom_amount != null
                                ? formatCurrency(member.custom_amount)
                                : "Sin monto"}
                              <Icon icon="solar:pen-linear" width={10} />
                            </button>
                          )
                        ) : (
                          perPersonAmount > 0 && (
                            <span className="text-xs font-mono text-neutral-500">
                              {formatCurrency(perPersonAmount)}
                            </span>
                          )
                        )}

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member)}
                          className="w-7 h-7 rounded-lg opacity-0 group-hover/member:opacity-100 bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all focus:outline-none"
                        >
                          <Icon
                            icon="solar:trash-bin-trash-linear"
                            width={12}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add Member Panel */}
                {showAddMember && (
                  <div className="rounded-xl border border-neutral-700/60 bg-neutral-900/20 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-neutral-300">
                        Agregar miembro
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddMember(false)}
                        className="text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none"
                      >
                        <Icon icon="solar:close-circle-linear" width={16} />
                      </button>
                    </div>

                    {/* Existing members to add */}
                    {availableMembers.length > 0 && (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {availableMembers.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleAddMember(m)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-800/50 transition-colors text-left focus:outline-none"
                          >
                            <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-medium text-neutral-400 shrink-0">
                              {getInitials(m.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-neutral-200 truncate">
                                {m.name}
                              </p>
                              {m.email && (
                                <p className="text-[10px] text-neutral-500 truncate">
                                  {m.email}
                                </p>
                              )}
                            </div>
                            <Icon
                              icon="solar:add-circle-linear"
                              width={16}
                              className="text-neutral-500 shrink-0"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Empty state when no available members */}
                    {availableMembers.length === 0 && (
                      <p className="text-[11px] text-neutral-500 text-center py-2">
                        Crea miembros en la sección de Miembros para agregarlas
                        aquí
                      </p>
                    )}
                  </div>
                )}

                {/* Empty state */}
                {serviceMembers.length === 0 && !showAddMember && (
                  <button
                    type="button"
                    onClick={() => setShowAddMember(true)}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-neutral-700 hover:border-neutral-500 hover:bg-neutral-900/50 text-neutral-400 hover:text-neutral-200 transition-all text-sm font-medium focus:outline-none"
                  >
                    <Icon icon="solar:user-plus-linear" width={18} />
                    Agregar primer miembro
                  </button>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/20 p-4 space-y-3">
              <span className="text-xs font-medium text-neutral-500 tracking-wide">
                RESUMEN
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-neutral-500">Miembros</p>
                  <p className="text-sm font-medium text-neutral-200">
                    {serviceMembers.length}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-neutral-500">Cobrado</p>
                  <p className="text-sm font-medium text-emerald-400">
                    {formatCurrency(service.collected_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-neutral-500">Pendiente</p>
                  <p className="text-sm font-medium text-orange-400">
                    {formatCurrency(service.pending_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-neutral-500">Status</p>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      service.status === "active"
                        ? "text-emerald-400"
                        : service.status === "overdue"
                          ? "text-red-400"
                          : "text-neutral-500",
                    )}
                  >
                    {service.status === "active"
                      ? "Activo"
                      : service.status === "overdue"
                        ? "Vencido"
                        : "Pausado"}
                  </p>
                </div>
              </div>
            </div>

            {/* Pending changes indicator */}
            {hasPendingChanges && (
              <p className="text-[11px] text-orange-400 text-center">
                Tienes cambios sin guardar
              </p>
            )}
          </div>

          {/* Footer */}
          <SheetFooter className="p-4 border-t border-neutral-800/80 bg-neutral-950/80 flex-row justify-end gap-3 mt-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors focus:outline-none"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-black bg-white hover:bg-neutral-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)] focus:outline-none disabled:opacity-50"
            >
              {submitting ? "Guardando..." : "Actualizar"}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
