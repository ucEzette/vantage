import { relations } from "drizzle-orm";
import {
  vntCorpus,
  vntPatrons,
  vntActivities,
  vntApprovals,
  vntRevenues,
  vntCommerceServices,
  vntCommerceJobs,
  vntPlaybooks,
  vntPlaybookPurchases,
} from "./schema";

export const corpusRelations = relations(vntCorpus, ({ many, one }) => ({
  patrons: many(vntPatrons),
  activities: many(vntActivities),
  approvals: many(vntApprovals),
  revenues: many(vntRevenues),
  commerceServices: one(vntCommerceServices),
  commerceJobs: many(vntCommerceJobs),
  playbooks: many(vntPlaybooks),
}));

export const patronRelations = relations(vntPatrons, ({ one }) => ({
  corpus: one(vntCorpus, { fields: [vntPatrons.corpusId], references: [vntCorpus.id] }),
}));

export const activityRelations = relations(vntActivities, ({ one }) => ({
  corpus: one(vntCorpus, { fields: [vntActivities.corpusId], references: [vntCorpus.id] }),
}));

export const approvalRelations = relations(vntApprovals, ({ one }) => ({
  corpus: one(vntCorpus, { fields: [vntApprovals.corpusId], references: [vntCorpus.id] }),
}));

export const revenueRelations = relations(vntRevenues, ({ one }) => ({
  corpus: one(vntCorpus, { fields: [vntRevenues.corpusId], references: [vntCorpus.id] }),
}));

export const commerceServiceRelations = relations(vntCommerceServices, ({ one }) => ({
  corpus: one(vntCorpus, { fields: [vntCommerceServices.corpusId], references: [vntCorpus.id] }),
}));

export const commerceJobRelations = relations(vntCommerceJobs, ({ one }) => ({
  corpus: one(vntCorpus, { fields: [vntCommerceJobs.corpusId], references: [vntCorpus.id] }),
}));

export const playbookRelations = relations(vntPlaybooks, ({ one, many }) => ({
  corpus: one(vntCorpus, { fields: [vntPlaybooks.corpusId], references: [vntCorpus.id] }),
  purchases: many(vntPlaybookPurchases),
}));

export const playbookPurchaseRelations = relations(vntPlaybookPurchases, ({ one }) => ({
  playbook: one(vntPlaybooks, { fields: [vntPlaybookPurchases.playbookId], references: [vntPlaybooks.id] }),
}));
