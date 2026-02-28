"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { es } from "react-day-picker/locale";
import {
  createService,
  updateService,
} from "@/app/(dashboard)/servicios/actions";
import type { Service, Member } from "@/types/database";
import { cn, formatCurrency } from "@/lib/utils";
import IconEmojiPicker from "@/components/servicios/icon-emoji-picker";

interface ServicePlan {
  label: string;
  price: number;
}

interface ServiceTemplate {
  name: string;
  icon: string;
  color: string;
  plans: ServicePlan[];
}

const SERVICE_TEMPLATES: ServiceTemplate[] = [
  {
    name: "Netflix",
    icon: "simple-icons:netflix",
    color: "#e50914",
    plans: [
      { label: "Estándar con anuncios", price: 99 },
      { label: "Estándar", price: 219 },
      { label: "Premium", price: 299 },
    ],
  },
  {
    name: "Spotify",
    icon: "simple-icons:spotify",
    color: "#1db954",
    plans: [
      { label: "Individual", price: 115 },
      { label: "Duo", price: 149 },
      { label: "Familiar", price: 179 },
      { label: "Estudiante", price: 58 },
    ],
  },
  {
    name: "YouTube",
    icon: "simple-icons:youtube",
    color: "#ff0000",
    plans: [
      { label: "Individual", price: 129 },
      { label: "Familiar", price: 199 },
      { label: "Estudiante", price: 69 },
    ],
  },
  {
    name: "Prime Video",
    icon: "simple-icons:primevideo",
    color: "#00a8e1",
    plans: [
      { label: "Mensual", price: 99 },
      { label: "Anual", price: 899 },
    ],
  },
  {
    name: "Disney+",
    icon: "simple-icons:disneyplus",
    color: "#0057e7",
    plans: [
      { label: "Estándar con anuncios", price: 159 },
      { label: "Estándar", price: 219 },
      { label: "Premium", price: 299 },
    ],
  },
  {
    name: "Apple TV+",
    icon: "simple-icons:appletv",
    color: "#a1a1a1",
    plans: [{ label: "Mensual", price: 99 }],
  },
  {
    name: "HBO Max",
    icon: "simple-icons:hbo",
    color: "#b31aff",
    plans: [
      { label: "Estándar", price: 199 },
      { label: "Platinum", price: 299 },
    ],
  },
  {
    name: "Crunchyroll",
    icon: "simple-icons:crunchyroll",
    color: "#f47521",
    plans: [
      { label: "Fan", price: 79 },
      { label: "Mega Fan", price: 119 },
      { label: "Ultimate Fan", price: 159 },
    ],
  },
  {
    name: "ChatGPT",
    icon: "simple-icons:openai",
    color: "#10a37f",
    plans: [
      { label: "Plus", price: 399 },
      { label: "Pro", price: 3999 },
    ],
  },
  {
    name: "Canva",
    icon: "simple-icons:canva",
    color: "#00c4cc",
    plans: [
      { label: "Pro", price: 149 },
      { label: "Equipos", price: 249 },
    ],
  },
  {
    name: "Apple Music",
    icon: "simple-icons:applemusic",
    color: "#10a37f",
    plans: [
      { label: "Individual", price: 115 },
      { label: "Duo", price: 149 },
      { label: "Familiar", price: 199 },
      { label: "Estudiante", price: 58 },
    ],
  },
  {
    name: "Apple One",
    icon: "simple-icons:appleone",
    color: "#10a37f",
    plans: [
      { label: "Individual", price: 115 },
      { label: "Duo", price: 149 },
      { label: "Familiar", price: 179 },
      { label: "Estudiante", price: 58 },
    ],
  },
];

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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface CreateServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service;
  members: Pick<Member, "id" | "name" | "email">[];
}

export default function CreateServiceModal({
  open,
  onOpenChange,
  service,
  members,
}: CreateServiceModalProps) {
  const isEdit = !!service;

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const activeService = SERVICE_TEMPLATES.find(
    (t) => t.name === activeTemplate,
  );

  const initialDay = service?.billing_day ?? 1;
  const now = new Date();
  const [billingDate, setBillingDate] = useState<Date>(
    new Date(now.getFullYear(), now.getMonth(), initialDay),
  );

  function formatBillingDate(date: Date) {
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: service?.name ?? "",
      color: service?.color ?? COLOR_OPTIONS[0].value,
      monthly_cost: service?.monthly_cost ?? 0,
      billing_day: service?.billing_day ?? 1,
      split_type: service?.split_type ?? "equal",
      icon_url: service?.icon_url ?? null,
    },
  });

  const watchedCost = form.watch("monthly_cost");
  const watchedSplit = form.watch("split_type");
  const watchedColor = form.watch("color");
  const watchedIcon = form.watch("icon_url");

  const memberCount = selectedMembers.length + 1;
  const monthlyCost =
    billingCycle === "annual" && watchedCost > 0
      ? watchedCost / 12
      : watchedCost;
  const perPersonAmount =
    watchedSplit === "equal" && monthlyCost > 0 ? monthlyCost / memberCount : 0;

  // Custom amounts validation
  const customTotal = Object.entries(customAmounts)
    .filter(([id]) => selectedMembers.includes(id))
    .reduce((sum, [, amount]) => sum + (amount || 0), 0);
  const ownerCustomAmount =
    watchedSplit === "custom" ? monthlyCost - customTotal : 0;

  // Filter personas by search query, excluding already selected
  const filteredMembers = members.filter((m) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      m.name.toLowerCase().includes(query) ||
      (m.email && m.email.toLowerCase().includes(query))
    );
  });

  function applyTemplate(template: ServiceTemplate) {
    const wasActive = activeTemplate === template.name;
    if (wasActive) {
      setActiveTemplate(null);
      setSelectedPlanIndex(0);
      form.setValue("name", "");
      form.setValue("color", COLOR_OPTIONS[0].value);
      form.setValue("icon_url", null);
      form.setValue("monthly_cost", 0);
      setBillingCycle("monthly");
    } else {
      setActiveTemplate(template.name);
      setSelectedPlanIndex(0);
      form.setValue("name", template.name);
      form.setValue("color", template.color);
      form.setValue("icon_url", template.icon);
      form.setValue("monthly_cost", template.plans[0].price);
      setBillingCycle("monthly");
    }
  }

  function selectPlan(index: number) {
    if (!activeService) return;
    setSelectedPlanIndex(index);
    form.setValue("monthly_cost", activeService.plans[index].price);
  }

  function toggleMember(id: string) {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function setCustomAmount(memberId: string, amount: number) {
    setCustomAmounts((prev) => ({ ...prev, [memberId]: amount }));
  }

  async function onSubmit(values: FormValues) {
    // Validate custom amounts if split_type is custom
    if (values.split_type === "custom" && selectedMembers.length > 0) {
      const hasEmptyAmounts = selectedMembers.some(
        (id) => !customAmounts[id] || customAmounts[id] <= 0,
      );
      if (hasEmptyAmounts) {
        toast.error(
          "Asigna un monto a cada miembro en la división personalizada",
        );
        return;
      }
      if (customTotal > monthlyCost) {
        toast.error(
          "La suma de los montos personalizados excede el costo total",
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("name", values.name);
      fd.set("color", values.color);
      const costToSave =
        billingCycle === "annual"
          ? values.monthly_cost / 12
          : values.monthly_cost;
      fd.set("monthly_cost", String(costToSave));
      fd.set("billing_day", String(values.billing_day));
      fd.set("split_type", values.split_type);
      if (values.icon_url) fd.set("icon_url", values.icon_url);

      let result;
      if (isEdit) {
        fd.set("id", service.id);
        result = await updateService(fd);
      } else {
        const uniqueMembers = [...new Set(selectedMembers)];
        if (uniqueMembers.length > 0) {
          fd.set("member_ids", uniqueMembers.join(","));
          // Pass custom amounts as JSON if split is custom
          if (values.split_type === "custom") {
            fd.set("custom_amounts", JSON.stringify(customAmounts));
          }
        }
        result = await createService(fd);
      }

      if (result.success) {
        toast.success(isEdit ? "Servicio actualizado" : "Servicio creado");
        onOpenChange(false);
        form.reset();
        setSelectedMembers([]);
        setCustomAmounts({});
        setActiveTemplate(null);
        setBillingCycle("monthly");
        setSearchQuery("");
      } else {
        toast.error(result.error ?? "Error al guardar");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] bg-neutral-950 border-neutral-800/80 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-0 gap-0 flex flex-col overflow-hidden sm:max-w-xl sm:max-h-[90vh]"
        showCloseButton={false}
      >
        {/* Drag Handle (mobile only) */}
        <div className="flex justify-center pt-2 pb-0 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-neutral-700" />
        </div>

        {/* Modal Header */}
        <div className="sm:px-6 flex shrink-0 bg-neutral-950/80 border-neutral-800/80 border-b pt-3 pr-5 pb-4 pl-5 sm:pt-4 backdrop-blur-xl items-center justify-between">
          <DialogTitle className="text-lg font-medium text-white tracking-tight">
            {isEdit ? "Editar Servicio" : "Agregar Servicio"}
          </DialogTitle>
          <DialogClose className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors focus:outline-none">
            <Icon icon="solar:close-circle-linear" width={20} />
          </DialogClose>
        </div>

        {/* Modal Body (Scrollable) */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col overflow-hidden flex-1"
        >
          <div className="p-5 sm:p-6 overflow-y-auto space-y-7 relative">
            {/* Section 1: Quick Templates */}
            {!isEdit && (
              <>
                <div className="space-y-3">
                  <label className="text-xs font-medium text-neutral-400 block tracking-wide">
                    PLANTILLAS RÁPIDAS
                  </label>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
                    {SERVICE_TEMPLATES.map((t) => {
                      const isActive = activeTemplate === t.name;
                      return (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => applyTemplate(t)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all min-w-[76px] shrink-0",
                            isActive
                              ? "border-neutral-700 bg-neutral-800/50 ring-1 ring-white/10 ring-offset-1 ring-offset-neutral-950"
                              : "border-neutral-800/60 bg-neutral-900/30 hover:bg-neutral-800/50 hover:border-neutral-700",
                          )}
                        >
                          <div className="w-10 h-10 rounded-xl bg-black border border-neutral-800 flex items-center justify-center shadow-md">
                            <Icon
                              icon={t.icon}
                              width={20}
                              style={{ color: t.color }}
                            />
                          </div>
                          <span
                            className={cn(
                              "text-[11px] font-medium leading-tight",
                              isActive ? "text-white" : "text-neutral-400",
                            )}
                          >
                            {t.name}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] leading-none",
                              isActive
                                ? "text-neutral-300"
                                : "text-neutral-600",
                            )}
                          >
                            {isActive
                              ? formatCurrency(
                                  t.plans[selectedPlanIndex]?.price ??
                                    t.plans[0].price,
                                )
                              : formatCurrency(t.plans[0].price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Plan Selector (when template is active with multiple plans) */}
                {activeService && activeService.plans.length > 1 && (
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-neutral-400 block tracking-wide">
                      ELIGE TU PLAN
                    </label>
                    <div className="grid gap-2">
                      {activeService.plans.map((plan, idx) => {
                        const isSelected = selectedPlanIndex === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => selectPlan(idx)}
                            className={cn(
                              "flex items-center justify-between p-3.5 rounded-xl border transition-all text-left group",
                              isSelected
                                ? "border-white/20 bg-white/4 ring-1 ring-white/10"
                                : "border-neutral-800/60 bg-neutral-900/20 hover:border-neutral-700 hover:bg-neutral-800/30",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                                  isSelected
                                    ? "border-white bg-white"
                                    : "border-neutral-600 group-hover:border-neutral-500",
                                )}
                              >
                                {isSelected && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-950" />
                                )}
                              </div>
                              <span
                                className={cn(
                                  "text-sm font-medium transition-colors",
                                  isSelected
                                    ? "text-white"
                                    : "text-neutral-400 group-hover:text-neutral-300",
                                )}
                              >
                                {plan.label}
                              </span>
                            </div>
                            <span
                              className={cn(
                                "text-sm font-mono tabular-nums transition-colors",
                                isSelected
                                  ? "text-white"
                                  : "text-neutral-500 group-hover:text-neutral-400",
                              )}
                            >
                              {formatCurrency(plan.price)}
                              <span className="text-[10px] text-neutral-500 ml-0.5">
                                /mes
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 border-t border-neutral-800" />
                  <span className="text-xs text-neutral-500 font-medium tracking-wide">
                    {activeTemplate ? "PERSONALIZAR" : "O CREAR DESDE CERO"}
                  </span>
                  <div className="flex-1 border-t border-neutral-800" />
                </div>
              </>
            )}

            {/* Section 2: Custom Configuration Form */}
            <div className="space-y-5">
              {/* Name & Icon */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-neutral-400">
                  Nombre e icono
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
                      placeholder="Ej. ChatGPT Plus"
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

              {/* Price & Payment Cycle Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400">
                    Precio total
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium">
                      $
                    </span>
                    <input
                      {...form.register("monthly_cost", {
                        valueAsNumber: true,
                      })}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="w-full h-10 bg-neutral-900/20 border border-neutral-800 focus:border-neutral-600 focus:ring-0 rounded-xl pl-8 pr-4 text-sm font-medium text-neutral-200 outline-none transition-all"
                    />
                  </div>
                  {form.formState.errors.monthly_cost && (
                    <p className="text-xs text-red-400">
                      {form.formState.errors.monthly_cost.message}
                    </p>
                  )}
                  {billingCycle === "annual" && watchedCost > 0 && (
                    <p className="text-[11px] text-neutral-500">
                      Equivale a{" "}
                      <span className="text-neutral-300">
                        {formatCurrency(watchedCost / 12)}
                      </span>
                      /mes
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-400">
                    Ciclo de pago
                  </label>
                  <div className="flex p-1 bg-neutral-900/40 border border-neutral-800 rounded-xl h-10">
                    <button
                      type="button"
                      onClick={() => setBillingCycle("monthly")}
                      className={cn(
                        "flex-1 text-xs font-medium rounded-lg transition-all flex items-center justify-center focus:outline-none",
                        billingCycle === "monthly"
                          ? "text-white bg-neutral-700/60 shadow-sm"
                          : "text-neutral-500 hover:text-neutral-300",
                      )}
                    >
                      Mensual
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle("annual")}
                      className={cn(
                        "flex-1 text-xs font-medium rounded-lg transition-all flex items-center justify-center focus:outline-none",
                        billingCycle === "annual"
                          ? "text-white bg-neutral-700/60 shadow-sm"
                          : "text-neutral-500 hover:text-neutral-300",
                      )}
                    >
                      Anual
                    </button>
                  </div>
                </div>
              </div>

              {/* Next Payment Date (Calendar Picker) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-400">
                  Próximo cobro
                </label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full h-10 bg-neutral-900/20 border border-neutral-800 hover:border-neutral-700 rounded-xl px-4 text-sm font-medium text-neutral-200 outline-none transition-all flex items-center justify-between group focus:outline-none"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon
                          icon="solar:calendar-linear"
                          width={16}
                          className="text-neutral-500 group-hover:text-neutral-300 transition-colors"
                        />
                        {formatBillingDate(billingDate)}
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
                {form.formState.errors.billing_day && (
                  <p className="text-xs text-red-400">
                    {form.formState.errors.billing_day.message}
                  </p>
                )}
              </div>

              {/* Members Setup */}
              {!isEdit && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-neutral-400">
                      Miembros compartidos
                    </label>
                    <span className="text-xs text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded-md border border-neutral-800">
                      División:{" "}
                      <button
                        type="button"
                        onClick={() =>
                          form.setValue(
                            "split_type",
                            watchedSplit === "equal" ? "custom" : "equal",
                          )
                        }
                        className="text-white font-medium hover:text-neutral-300 transition-colors"
                      >
                        {watchedSplit === "equal"
                          ? "Equitativa"
                          : "Personalizada"}
                      </button>
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Owner (always included) */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/30 border border-neutral-800/80">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-medium text-neutral-400">
                          TÚ
                        </div>
                        <span className="text-sm font-medium text-neutral-200">
                          Tú (Propietario)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {watchedSplit === "equal" && perPersonAmount > 0 && (
                          <span className="text-sm font-mono text-neutral-400">
                            {formatCurrency(perPersonAmount)}
                          </span>
                        )}
                        {watchedSplit === "custom" && monthlyCost > 0 && (
                          <span
                            className={cn(
                              "text-sm font-mono",
                              ownerCustomAmount < 0
                                ? "text-red-400"
                                : "text-neutral-400",
                            )}
                          >
                            {formatCurrency(Math.max(0, ownerCustomAmount))}
                          </span>
                        )}
                        <div className="w-9 h-5 rounded-full bg-emerald-500 relative flex items-center shrink-0">
                          <span className="w-4 h-4 rounded-full bg-white absolute shadow-sm translate-x-[18px]" />
                        </div>
                      </div>
                    </div>

                    {/* Search bar for existing personas */}
                    {members.length > 3 && (
                      <div className="relative">
                        <Icon
                          icon="solar:magnifer-linear"
                          width={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                        />
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Buscar persona..."
                          className="w-full h-9 bg-neutral-900/40 border border-neutral-800 focus:border-neutral-600 focus:ring-0 rounded-xl pl-9 pr-4 text-sm text-neutral-200 placeholder:text-neutral-600 outline-none transition-all"
                        />
                      </div>
                    )}

                    {/* Persona toggles */}
                    {filteredMembers.map((m) => {
                      const isSelected = selectedMembers.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          className="rounded-xl bg-neutral-900/30 border border-neutral-800/80 overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => toggleMember(m.id)}
                            className="w-full flex items-center justify-between p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-medium text-neutral-400">
                                {getInitials(m.name)}
                              </div>
                              <div className="text-left">
                                <span className="text-sm font-medium text-neutral-200 block">
                                  {m.name}
                                </span>
                                {m.email && (
                                  <span className="text-[10px] text-neutral-500 block">
                                    {m.email}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {isSelected &&
                                watchedSplit === "equal" &&
                                perPersonAmount > 0 && (
                                  <span className="text-sm font-mono text-neutral-400">
                                    {formatCurrency(perPersonAmount)}
                                  </span>
                                )}
                              <div
                                className={cn(
                                  "w-9 h-5 rounded-full relative flex items-center shrink-0 transition-colors",
                                  isSelected
                                    ? "bg-emerald-500"
                                    : "bg-neutral-700",
                                )}
                              >
                                <span
                                  className={cn(
                                    "w-4 h-4 rounded-full bg-white absolute shadow-sm transition-transform",
                                    isSelected
                                      ? "translate-x-[18px]"
                                      : "translate-x-[2px]",
                                  )}
                                />
                              </div>
                            </div>
                          </button>

                          {/* Custom amount input — shown when selected + custom split */}
                          {isSelected && watchedSplit === "custom" && (
                            <div className="px-3 pb-3 pt-0">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs font-medium">
                                  $
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Monto asignado"
                                  value={customAmounts[m.id] || ""}
                                  onChange={(e) =>
                                    setCustomAmount(
                                      m.id,
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  className="w-full h-8 bg-neutral-950/50 border border-neutral-700 focus:border-neutral-500 focus:ring-0 rounded-lg pl-7 pr-3 text-sm font-mono text-neutral-200 placeholder:text-neutral-600 outline-none transition-all"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* No results */}
                    {searchQuery && filteredMembers.length === 0 && (
                      <p className="text-xs text-neutral-500 text-center py-3">
                        No se encontraron miembros con &quot;{searchQuery}&quot;
                      </p>
                    )}

                    {/* Custom split summary */}
                    {watchedSplit === "custom" &&
                      selectedMembers.length > 0 &&
                      monthlyCost > 0 && (
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-900/50 border border-neutral-800/50">
                          <span className="text-[11px] text-neutral-500">
                            Total asignado
                          </span>
                          <span
                            className={cn(
                              "text-xs font-mono font-medium",
                              customTotal > monthlyCost
                                ? "text-red-400"
                                : customTotal === monthlyCost
                                  ? "text-emerald-400"
                                  : "text-orange-400",
                            )}
                          >
                            {formatCurrency(
                              customTotal + Math.max(0, ownerCustomAmount),
                            )}{" "}
                            / {formatCurrency(monthlyCost)}
                          </span>
                        </div>
                      )}

                    {/* Empty state — guide to Personas section */}
                    {members.length === 0 && (
                      <div className="p-4 rounded-xl border border-dashed border-neutral-700 bg-neutral-900/20 text-center space-y-1">
                        <p className="text-xs text-neutral-400">
                          No tienes miembros registrados
                        </p>
                        <p className="text-[11px] text-neutral-600">
                          Crea miembros en la sección de Miembros para poder
                          agregarlo a este servicio
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-neutral-800/80 bg-neutral-950/80 flex justify-end gap-3 z-10 shrink-0">
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
              {submitting
                ? "Guardando..."
                : isEdit
                  ? "Actualizar"
                  : "Crear Servicio"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
