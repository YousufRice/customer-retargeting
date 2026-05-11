"use client";

import { useEffect, useCallback } from "react";
import { appwriteClient } from "@/lib/appwrite-auth";
import {
  UnifiedCustomer,
  WordPressCustomer,
  ExistingCustomer,
} from "@/lib/types";
import { normalizePhone } from "@/lib/utils";
import {
  RETARGETING_DATABASE_ID,
  WORDPRESS_CUSTOMERS_TABLE_ID,
  EXISTING_DATABASE_ID,
  EXISTING_CUSTOMERS_TABLE_ID,
} from "@/lib/appwrite";

function wpPayloadToUnified(payload: any): UnifiedCustomer {
  const wp = payload as WordPressCustomer;
  const normalized = normalizePhone(wp.phone);
  const fullName = `${wp.first_name} ${wp.last_name}`.trim();
  return {
    phone: normalized,
    firstName: wp.first_name,
    lastName: wp.last_name,
    fullName,
    email: wp.email || "",
    city: wp.city,
    lifetimeValue: wp.value || 0,
    source: "wordpress",
    wordpressData: wp,
    orderCount: 0,
  };
}

function existingPayloadToUnified(payload: any): UnifiedCustomer {
  const ec = payload as ExistingCustomer;
  const normalized = normalizePhone(ec.phone);
  const nameParts = ec.full_name?.split(" ") || ["", ""];
  return {
    phone: normalized,
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    fullName: ec.full_name || "",
    email: ec.email || "",
    city: "",
    lifetimeValue: 0,
    source: "website",
    websiteData: ec,
    orderCount: 0,
  };
}

export function useRealtimeCustomers(
  customers: UnifiedCustomer[],
  onUpdate: (updated: UnifiedCustomer[]) => void,
) {
  const mergeCustomer = useCallback(
    (incoming: UnifiedCustomer) => {
      const existing = customers.find((c) => c.phone === incoming.phone);
      if (!existing) {
        return [...customers, incoming];
      }

      // If incoming is website, it takes precedence over wordpress
      const merged: UnifiedCustomer = {
        ...existing,
        ...incoming,
        source: incoming.source === "website" ? "website" : existing.source,
        wordpressData: incoming.wordpressData || existing.wordpressData,
        websiteData: incoming.websiteData || existing.websiteData,
      };

      return customers.map((c) => (c.phone === merged.phone ? merged : c));
    },
    [customers],
  );

  useEffect(() => {
    const channels = [
      `databases.${RETARGETING_DATABASE_ID}.collections.${WORDPRESS_CUSTOMERS_TABLE_ID}.documents`,
      `databases.${EXISTING_DATABASE_ID}.collections.${EXISTING_CUSTOMERS_TABLE_ID}.documents`,
    ];

    const unsubscribe = appwriteClient.subscribe(channels, (response) => {
      const events = response.events || [];
      const isCreate = events.some((e: string) => e.includes(".create"));
      const isUpdate = events.some((e: string) => e.includes(".update"));

      if (!isCreate && !isUpdate) return;

      const channelStr = response.channels?.[0] || "";
      const payload = response.payload;

      let incoming: UnifiedCustomer;
      if (channelStr.includes(WORDPRESS_CUSTOMERS_TABLE_ID)) {
        incoming = wpPayloadToUnified(payload);
      } else if (channelStr.includes(EXISTING_CUSTOMERS_TABLE_ID)) {
        incoming = existingPayloadToUnified(payload);
      } else {
        return;
      }

      const updated = mergeCustomer(incoming);
      onUpdate(updated);
    });

    return () => {
      unsubscribe();
    };
  }, [mergeCustomer, onUpdate]);
}
