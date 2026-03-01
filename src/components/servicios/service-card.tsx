"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import { ServiceActions } from "./service-actions";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import ServiceDetailModal from "./service-detail-modal";
import EditServiceDrawer from "./edit-service-drawer";
import type { ServiceSummary, Member } from "@/types/database";

const statusConfig: Record<
  string,
  { label: string; dotClass: string; badgeClass: string }
> = {
  active: {
    label: "Al día",
    dotClass: "",
    badgeClass:
      "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
  },
  pending: {
    label: "Pausado",
    dotClass: "",
    badgeClass: "bg-neutral-800 border border-neutral-700 text-neutral-500",
  },
  overdue: {
    label: "Vence pronto",
    dotClass: "animate-pulse",
    badgeClass: "bg-red-500/10 border border-red-500/20 text-red-400",
  },
};

interface ServiceCardProps {
  service: ServiceSummary;
  members: Pick<Member, "id" | "name" | "email">[];
  isOwner: boolean;
}

export function ServiceCard({ service, members, isOwner }: ServiceCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const serviceMembers = service.members ?? [];
  const isInactive = service.status !== "active";
  const status = statusConfig[service.status] ?? statusConfig.pending;

  return (
    <>
      <div
        onClick={() => {
          if (!showEditDrawer) setShowDetail(true);
        }}
        className={cn(
          "group relative flex flex-col justify-between p-5 rounded-[1.5rem] border transition-all cursor-pointer backdrop-blur-sm",
          isInactive
            ? "bg-neutral-900/10 border-dashed border-neutral-800 opacity-70 hover:opacity-100 hover:border-neutral-600 hover:bg-neutral-900/30"
            : "bg-neutral-900/30 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/50",
        )}
      >
        {/* Hover glow — fades in on hover using service color */}
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ backgroundColor: `${service.color}0d` }}
        />

        {/* Header: icon + name */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div
              className={cn(
                "w-12 h-12 rounded-xl border flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300",
                isInactive
                  ? "bg-neutral-900 border-neutral-800 grayscale group-hover:grayscale-0"
                  : "bg-black border-neutral-800",
              )}
              style={{
                boxShadow: isInactive
                  ? undefined
                  : `0 4px 14px ${service.color}1a`,
              }}
            >
              {service.icon_url ? (
                <Icon
                  icon={service.icon_url}
                  width={24}
                  style={{ color: isInactive ? undefined : service.color }}
                  className={cn(isInactive && "text-neutral-500")}
                />
              ) : (
                <Icon
                  icon="solar:tv-bold"
                  width={24}
                  style={{ color: isInactive ? undefined : service.color }}
                  className={cn(isInactive && "text-neutral-500")}
                />
              )}
            </div>
            <div>
              <h3
                className={cn(
                  "text-sm font-semibold leading-tight tracking-tight",
                  isInactive
                    ? "text-neutral-400 group-hover:text-neutral-200"
                    : "text-neutral-200",
                )}
              >
                {service.name}
              </h3>
              <p
                className={cn(
                  "text-[11px] mt-0.5 font-normal",
                  isInactive ? "text-neutral-600" : "text-neutral-500",
                )}
              >
                Día {service.billing_day} •{" "}
                {formatCurrency(service.monthly_cost)}
              </p>
              {isOwner && (
                <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[9px] font-medium text-violet-400">
                  <Icon icon="solar:crown-bold" width={9} />
                  Propietario
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Middle: members + status badge */}
        <div className="mt-5 mb-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            {serviceMembers.length > 0 ? (
              <AvatarGroup>
                {serviceMembers.slice(0, 3).map((m) => (
                  <Avatar key={m.member_id} size="sm">
                    {m.avatar_url ? (
                      <AvatarImage src={m.avatar_url} alt={m.name} />
                    ) : null}
                    <AvatarFallback className="bg-neutral-800 text-neutral-400 text-[8px] font-medium">
                      {getInitials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {serviceMembers.length > 3 && (
                  <AvatarGroupCount className="bg-neutral-800 text-neutral-400 text-[8px] font-medium">
                    +{serviceMembers.length - 3}
                  </AvatarGroupCount>
                )}
              </AvatarGroup>
            ) : (
              <span
                className={cn(
                  "text-[10px] font-medium pl-1",
                  isInactive ? "text-neutral-600" : "text-neutral-500",
                )}
              >
                Sin miembros
              </span>
            )}
          </div>
          <div
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1.5",
              status.badgeClass,
            )}
          >
            {service.status === "overdue" ? (
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full bg-current",
                  status.dotClass,
                )}
              />
            ) : service.status === "active" ? (
              <Icon icon="solar:check-circle-bold" width={10} />
            ) : null}
            {status.label}
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-5 gap-2 relative z-10 pt-3 border-t border-neutral-800/50">
          <ServiceActions
            service={service}
            members={members}
            isOwner={isOwner}
            onEdit={() => setShowEditDrawer(true)}
          />
        </div>
      </div>

      <ServiceDetailModal
        open={showDetail}
        onOpenChange={setShowDetail}
        service={service}
      />

      <EditServiceDrawer
        open={showEditDrawer}
        onOpenChange={setShowEditDrawer}
        service={service}
        members={members}
      />
    </>
  );
}
