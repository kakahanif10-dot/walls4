import fs from "fs";

const raw = JSON.parse(fs.readFileSync("scripts/memes-temp.json", "utf8"));

function generateMemeNarrative(asset) {
  const { symbol, name, group, base } = asset;
  const isAI = /AI|Agent|Terminal|Synthetic/i.test(group);
  const isSolana = /Solana|pump\.fun|Bonding|Raydium/i.test(group);
  const isBase = /Base|Warpcast|Farcaster/i.test(group);
  const isAnimal = /Animal|Mascot|Dog|Cat|Hippo|Squirrel|Pup/i.test(group);
  const isPoliti = /Politi|Trump|President|Election|Affairs/i.test(group);

  let blurb = `${name} (${symbol}) is a viral community speculation token in ${group}, trading strictly on decentralized liquidity pool velocity, viral attention, and social engagement.`;
  let bull = [
    `Explosive viral traction across crypto Twitter, Telegram communities, and TikTok trend loops.`,
    `Rapid liquidity pool bootstrapping on decentralized exchanges with 100% burned LP tokens.`,
    `High velocity retail engagement driving intense volume-to-market-cap ratios.`
  ];
  let bear = [
    `Extreme intraday price volatility with zero fundamental valuation floor or earnings backing.`,
    `High risk of short-term attention decay as speculative liquidity rotates into newer meta tokens.`,
    `Whale holder concentration in early sniped bonding curve wallet clusters.`
  ];
  let catalysts = [
    `Influencer endorsements and viral social media post saturation.`,
    `Tier-1 centralized exchange spot or perpetual futures contract listing.`,
    `Community raiding events and cross-chain bridge liquidity integration.`
  ];

  if (isAI) {
    blurb = `${name} represents the autonomous AI agent and terminal meta in ${group}, where autonomous Twitter agents trade, generate memes, or deploy on-chain contracts.`;
    bull = [
      `Novel intersection of LLM autonomous reasoning and real-time on-chain tokenized action.`,
      `Continuous automated content generation on social media keeping mindshare perpetually active.`,
      `Cult following among AI crypto researchers, developers, and tech venture builders.`
    ];
    bear = [
      `Fast-moving technology cycle where newer agent architectures risk obsoleting older token narratives.`,
      `API rate limits or account suspensions on social platforms impacting agent autonomous activity.`,
      `Speculative froth running far ahead of actual technical agent capabilities.`
    ];
    catalysts = [
      `Major autonomous agent framework upgrade or multi-agent collaboration capability.`,
      `Autonomous treasury deployment announcement by the agent model.`,
      `Integration with decentralized compute networks or on-chain execution SDKs.`
    ];
  } else if (isBase) {
    blurb = `${name} is a native culture and social token within the Base and Farcaster ecosystem in ${group}, driven by Warpcast tipping and Coinbase wallet adoption.`;
    bull = [
      `Direct tailwinds from Coinbase Smart Wallet onboarding and gasless transaction infrastructure.`,
      `Strong organic social distribution across Warpcast channels without paid venture capital overhead.`,
      `High holder retention among core Ethereum and Base builder communities.`
    ];
    bear = [
      `Ecosystem dependency on Base sequencer uptime and Farcaster platform engagement health.`,
      `Lower total speculative liquidity compared to primary Solana DEX trading venues.`,
      `Fast-moving internal Base meta rotations into newly minted creator tokens.`
    ];
    catalysts = [
      `Farcaster channel tipping integration or viral Warpcast frame campaign.`,
      `Coinbase Wallet featured trending token showcase.`,
      `Aerodrome liquidity gauge incentive boost or DEX volume print.`
    ];
  } else if (isPoliti) {
    blurb = `${name} trades in the PolitiFi sector in ${group}, functioning as a high-beta financial proxy on political headlines, debates, and election cycles.`;
    bull = [
      `Massive free mainstream media coverage during major televised rallies and breaking news events.`,
      `Passionate, politically aligned community that treats the token as ideological merchandise.`,
      `Global speculative participation across US, European, and Asian trading hours.`
    ];
    bear = [
      `Post-event attention dropoff and severe profit-taking following major political milestones.`,
      `Unpredictable headline risks that can cause sudden double-digit intraday drawdowns.`,
      `Zero formal connection to official political campaigns or public figures.`
    ];
    catalysts = [
      `Keynote rally speeches, press conferences, and viral debate soundbites.`,
      `Public figures referencing meme culture or wearing campaign merchandise.`,
      `High-profile mainstream news features on international television broadcasts.`
    ];
  } else if (isAnimal) {
    blurb = `${name} captures the beloved internet animal and cute mascot meta in ${group}, converting universal pet affection into viral meme currency.`;
    bull = [
      `Universal cross-cultural appeal that easily bridges non-crypto retail internet audiences.`,
      `Limitless creative meme templates allowing immediate adaptation to any trending pop culture event.`,
      `Charitable animal shelter donations that generate heartwarming viral press coverage.`
    ];
    bear = [
      `Severe meme dilution from hundreds of copycat animal derivative tokens launched daily.`,
      `Vulnerability to attention fatigue if the mascot imagery becomes stale.`,
      `Absence of protocol revenue outside of community merchandise and decentralized liquidity pools.`
    ];
    catalysts = [
      `Original pet owner or viral zoo social media updates and photo drops.`,
      `Celebrity or athlete interactions and organic meme reposts on Instagram and X.`,
      `Major exchange derivative listing announcements with high retail visibility.`
    ];
  }

  return {
    symbol,
    name,
    kind: "meme",
    group,
    base,
    blurb,
    bull,
    bear,
    catalysts,
  };
}

const assets = raw.map(generateMemeNarrative);

const output = `import type { Asset } from "./market-assets";

/**
 * 370 Additional Viral Memecoins (Total Meme Universe: 407 Memecoins)
 * Covering pump.fun, Solana DEXs, Base Social, Ethereum, TRON, and BSC
 * with realistic micro/dollar pricing, trading blurbs, and volatility catalysts.
 */
export const ADDITIONAL_MEMECOINS: Asset[] = ${JSON.stringify(assets, null, 2)};
`;

fs.writeFileSync("lib/additional-memecoins.ts", output);
console.log(`Wrote ${assets.length} additional memecoins to lib/additional-memecoins.ts`);
