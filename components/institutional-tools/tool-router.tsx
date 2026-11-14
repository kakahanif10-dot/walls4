"use client";

import React from "react";
import type { InstitutionalToolSlug } from "@/lib/institutional-tools-data";
import {
  AlphaSenseSearchView,
  BloombergDeskView,
  CapitalIqCompsView,
  ExcelDcfView,
  TradingViewScreenerView,
} from "./tradfi-views";
import {
  ChainalysisAmlView,
  CoinMetricsKaikoView,
  CryptoFearGreedView,
  DefillamaTerminalView,
  GlassnodeOnchainView,
  MessariResearchView,
  NansenArkhamView,
} from "./crypto-views";
import {
  AiSentimentToolView,
  TopSignalsToolView,
  WhaleAlertToolView,
} from "./frontpage-tool-views";

export default function InstitutionalToolRouter({ slug }: { slug: InstitutionalToolSlug }) {
  switch (slug) {
    case "bloomberg-desk":
      return <BloombergDeskView />;
    case "excel-dcf":
      return <ExcelDcfView />;
    case "capital-iq":
      return <CapitalIqCompsView />;
    case "alphasense":
      return <AlphaSenseSearchView />;
    case "tradingview-screener":
      return <TradingViewScreenerView />;
    case "glassnode-onchain":
      return <GlassnodeOnchainView />;
    case "chainalysis-aml":
      return <ChainalysisAmlView />;
    case "messari-research":
      return <MessariResearchView />;
    case "nansen-arkham":
      return <NansenArkhamView />;
    case "defillama-terminal":
      return <DefillamaTerminalView />;
    case "coinmetrics-kaiko":
      return <CoinMetricsKaikoView />;
    case "crypto-fear-greed":
      return <CryptoFearGreedView />;
    case "whale-alert":
      return <WhaleAlertToolView />;
    case "ai-sentiment":
      return <AiSentimentToolView />;
    case "top-signals":
      return <TopSignalsToolView />;
    default:
      return <BloombergDeskView />;
  }
}
