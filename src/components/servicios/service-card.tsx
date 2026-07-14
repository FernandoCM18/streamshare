"use client";

import { useState, useRef } from "react";
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
import { ServiceIconBox } from "@/components/shared/service-icon-box";
import { StatusBadge } from "@/components/shared/status-badge";
import { serviceStatusConfig } from "@/lib/status-config";
import dynamic from "next/dynamic";

const ServiceDetailModal = dynamic(() => import("./service-detail-modal"), {
  ssr: false,
});

const EditServiceDrawer = dynamic(() => import("./edit-service-drawer"), {
  ssr: false,
});
import type { ServiceSummary, Member } from "@/types/database";
import type { MemberPayment } from "@/components/dashboard/service-card-utils";
import type { PairSummary } from "@/lib/compute-payment-summaries";

interface ServiceCardProps {
  service: ServiceSummary;
  members: Pick<Member, "id" | "name" | "email">[];
  payments?: MemberPayment[];
  summaries?: Record<string, PairSummary>;
  isOwner: boolean;
}

export function ServiceCard({
  service,
  members,
  payments = [],
  summaries,
  isOwner,
}: ServiceCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const blockedRef = useRef(false);
  const serviceMembers = service.members ?? [];
  const isInactive = service.status !== "active";
  const hasDebt = service.pending_amount > 0;
  const status =
    serviceStatusConfig[service.status] ?? serviceStatusConfig.pending;

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!showEditDrawer && !blockedRef.current) setShowDetail(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!showEditDrawer && !blockedRef.current) setShowDetail(true);
          }
        }}
        className={cn(
          "group relative flex flex-col justify-between overflow-hidden p-5 rounded-[1.5rem] border transition-colors cursor-pointer backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70",
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
            <ServiceIconBox
              iconUrl={service.icon_url}
              color={service.color}
              inactive={isInactive}
              className="group-hover:scale-105 transition-transform duration-300"
            />
            <div className="min-w-0">
              <h3
                className={cn(
                  "text-sm font-semibold leading-tight tracking-tight truncate",
                  isInactive
                    ? "text-neutral-400 group-hover:text-neutral-200"
                    : "text-neutral-200",
                )}
              >
                {service.name}
              </h3>
              <p
                className={cn(
                  "text-[11px] mt-0.5 font-normal truncate",
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
          <StatusBadge
            badgeClass={
              !isInactive && hasDebt
                ? "bg-orange-400/10 border border-orange-400/20"
                : status.badgeClass
            }
            label={isInactive ? status.label : hasDebt ? "Pendiente" : "Al día"}
            icon={
              !isInactive && hasDebt ? "solar:clock-circle-bold" : status.icon
            }
            dotClass={
              !isInactive && hasDebt ? "bg-orange-400" : status.dotClass
            }
          />
        </div>

        {/* Action buttons */}
        <div
          className={cn(
            "grid gap-2 relative z-10 pt-3 border-t border-neutral-800/50",
            service.status === "active" ? "grid-cols-4" : "grid-cols-5",
          )}
        >
          <ServiceActions
            service={service}
            members={members}
            isOwner={isOwner}
            onEdit={() => setShowEditDrawer(true)}
            onDeletingChange={(v) => {
              blockedRef.current = v;
            }}
          />
        </div>
      </article>

      {showDetail && (
        <ServiceDetailModal
          open={showDetail}
          onOpenChange={setShowDetail}
          service={service}
          payments={payments}
          summaries={summaries}
        />
      )}

      {showEditDrawer && (
        <EditServiceDrawer
          open={showEditDrawer}
          onOpenChange={setShowEditDrawer}
          service={service}
          members={members}
        />
      )}
    </>
  );
}
