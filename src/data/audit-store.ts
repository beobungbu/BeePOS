import { useMemo } from 'react';
import { create } from 'zustand';
import type { AuditEvent } from '../domain/types';
import type { AuditAction, AuditEntity } from '../domain/audit';
import { t } from '../i18n';
import { auditEvents as seedAuditEvents } from './seed';
import { useSettingsStore } from './settings-store';
import { currentOrgId, useOrgStore } from './org-store';

interface AuditState {
  /** Newest first, which is the order every reader of a log wants. */
  events: AuditEvent[];
  append: (event: AuditEvent) => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  events: seedAuditEvents,
  append: (event) => set((state) => ({ events: [event, ...state.events] })),
}));

/** Everything `recordAudit` needs that it cannot read off the session itself. */
export interface AuditInput {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  /** The sentence a person reads in the log; include amounts and the value that changed. */
  summary: string;
  /**
   * Overrides the session's branch. Only for acts booked against another shop than the one
   * the actor is standing in (a chain price change, a transfer's far end).
   */
  storeId?: string;
  /** Overrides the signed-in member, for the one act performed while signing out. */
  staffId?: string;
}

/**
 * Who is at the till, supplied by `session-store.ts` at import time.
 *
 * An accessor rather than an import, so this module knows nothing about authentication: the
 * session store records a sign-in and a sign-out, and importing it back from here would make
 * the two modules a require cycle. Before the session store is loaded the actor is unknown
 * and `recordAudit` writes nothing, which is the same behaviour as being signed out.
 */
export interface AuditActor {
  staffId?: string;
  storeId?: string;
}

let readActor: () => AuditActor = () => ({});

export function setAuditActorSource(source: () => AuditActor): void {
  readActor = source;
}

let sequence = 0;

function nextEventId(): string {
  sequence += 1;
  return `audit-${Date.now()}-${sequence}`;
}

/**
 * Writes one line into the log.
 *
 * A plain function rather than a hook, because most of the acts worth recording happen inside
 * a store action or an event handler where no hook may run. It reads the actor and the branch
 * off the session itself: a call site that had to pass them would eventually pass the wrong
 * ones, and a log that names the wrong person is worse than no log.
 *
 * Nothing is recorded while signed out. That is not a silent failure: with no session there
 * is no actor to attribute the act to, and the only acts reachable in that state are on the
 * login screen itself.
 */
export function recordAudit(input: AuditInput): void {
  const actor = readActor();
  const staffId = input.staffId ?? actor.staffId;
  if (!staffId) return;

  useAuditStore.getState().append({
    id: nextEventId(),
    orgId: currentOrgId(),
    storeId: input.storeId ?? actor.storeId,
    staffId,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    summary: input.summary,
    createdAt: new Date(),
  });
}

/**
 * Translates outside React, for the two acts (`login`, `logout`) that are recorded from a
 * store action where no hook may run. The locale is read from the settings store, the same
 * one `useT` reads, so a line written while the app is in English reads in English.
 */
export function auditText(key: string): string {
  return t(key, useSettingsStore.getState().locale);
}

/** The chain's log, newest first, scoped to the loaded chain. */
export function useAuditEvents(): AuditEvent[] {
  const events = useAuditStore((state) => state.events);
  const orgId = useOrgStore((state) => state.organization?.id);
  return useMemo(() => {
    const scoped = orgId ? events.filter((event) => event.orgId === orgId) : events;
    return scoped
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [events, orgId]);
}
