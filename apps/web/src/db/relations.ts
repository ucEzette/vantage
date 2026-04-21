import { relations } from "drizzle-orm";
import {
  vantageTable,
  vntPatrons,
  vntActivities,
  vntApprovals,
  vntRevenues,
  vntCommerceServices,
  vntCommerceJobs,
  vntPlaybooks,
  vntPlaybookPurchases,
} from "./schema";

export const vantageRelations = relations(vantageTable, ({ many, one }) => ({
  patrons: many(vntPatrons),
  activities: many(vntActivities),
  approvals: many(vntApprovals),
  revenues: many(vntRevenues),
  commerceServices: one(vntCommerceServices),
  commerceJobs: many(vntCommerceJobs),
  playbooks: many(vntPlaybooks),
}));

export const patronRelations = relations(vntPatrons, ({ one }) => ({
  vantage: one(vantageTable, { fields: [vntPatrons.vantageId], references: [vantageTable.id] }),
}));

export const activityRelations = relations(vntActivities, ({ one }) => ({
  vantage: one(vantageTable, { fields: [vntActivities.vantageId], references: [vantageTable.id] }),
}));

export const approvalRelations = relations(vntApprovals, ({ one }) => ({
  vantage: one(vantageTable, { fields: [vntApprovals.vantageId], references: [vantageTable.id] }),
}));

export const revenueRelations = relations(vntRevenues, ({ one }) => ({
  vantage: one(vantageTable, { fields: [vntRevenues.vantageId], references: [vantageTable.id] }),
}));

export const commerceServiceRelations = relations(vntCommerceServices, ({ one }) => ({
  vantage: one(vantageTable, { fields: [vntCommerceServices.vantageId], references: [vantageTable.id] }),
}));

export const commerceJobRelations = relations(vntCommerceJobs, ({ one }) => ({
  vantage: one(vantageTable, { fields: [vntCommerceJobs.vantageId], references: [vantageTable.id] }),
}));

export const playbookRelations = relations(vntPlaybooks, ({ one, many }) => ({
  vantage: one(vantageTable, { fields: [vntPlaybooks.vantageId], references: [vantageTable.id] }),
  purchases: many(vntPlaybookPurchases),
}));

export const playbookPurchaseRelations = relations(vntPlaybookPurchases, ({ one }) => ({
  playbook: one(vntPlaybooks, { fields: [vntPlaybookPurchases.playbookId], references: [vntPlaybooks.id] }),
}));
