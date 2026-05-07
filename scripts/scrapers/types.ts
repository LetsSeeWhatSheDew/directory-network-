// scripts/scrapers/types.ts

export type Platform = "dutchie" | "leafly" | "iheartjane" | "generic";

export type RunStatus = "running" | "success" | "partial" | "failed";

export type DispensaryConfig = {
  slug: string;
  name: string;
  city: string;
  platform: Platform;
  menu_url: string | null;
  deals_url: string | null;
  selectors: GenericSelectors | null;
};

export type GenericSelectors = {
  deal_card: string;
  title: string;
  description?: string;
  original_price?: string;
  sale_price?: string;
};

export type DealCategory =
  | "flower"
  | "edibles"
  | "concentrates"
  | "vapes"
  | "pre-rolls"
  | "other";

export type ScrapedDeal = {
  title: string;
  description?: string;
  category?: DealCategory;
  original_price?: number;
  sale_price?: number;
  discount_value?: number;
  discount_unit?: "percent" | "dollar" | "bogo" | "other";
  source_url: string;
};

export type DispensaryRunStatus =
  | "success"
  | "failed"
  | "skipped";

export type DispensaryResult = {
  slug: string;
  platform: Platform;
  status: DispensaryRunStatus;
  deals_added: number;
  deals_updated: number;
  deals_deactivated: number;
  error_message: string | null;
};

export type IngestResult = {
  added: number;
  updated: number;
  deactivated: number;
};

export type ScraperResult = {
  runId: string;
  status: RunStatus;
  totals: {
    added: number;
    updated: number;
    deactivated: number;
  };
  results: DispensaryResult[];
};
