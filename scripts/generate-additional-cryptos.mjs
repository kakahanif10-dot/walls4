import fs from "fs";

const raw = JSON.parse(fs.readFileSync("scripts/cryptos-temp.json", "utf8"));

function generateCryptoNarrative(asset) {
  const { symbol, name, group, base } = asset;
  const isL1 = /Layer 1|L1|Consensus|Sharded|PoW|PoS|Substrate/i.test(group);
  const isL2 = /Layer 2|Rollup|Optimistic|zkEVM|Scaling/i.test(group);
  const isDeFi = /DeFi|Exchange|DEX|Lending|Liquidity|Yield|AMM|Perps|Derivatives/i.test(group);
  const isDePIN = /DePIN|Compute|GPU|Storage|Wireless|Edge|Sensors/i.test(group);
  const isAI = /AI|Machine Learning|Data|Agent|Intelligence/i.test(group);
  const isGaming = /Gaming|Metaverse|NFT|Play|Virtual/i.test(group);
  const isRWA = /Real World|RWA|Credit|Treasury|Securities|Settlement/i.test(group);

  let blurb = `${name} (${symbol}) operates in the ${group} ecosystem, trading on exchange liquidity, on-chain velocity, and structural staking dynamics.`;
  let bull = [
    `Rising daily active addresses and on-chain transaction throughput across decentralized venues.`,
    `Favorable float distribution with institutional market maker backing across major tier-1 exchanges.`,
    `Constructive momentum structure trading above key short-term moving averages with increasing buy volume.`
  ];
  let bear = [
    `Vulnerability to broad digital asset liquidity contraction and Bitcoin dominance surges.`,
    `Scheduled token unlocks or validator emissions introducing structural sell-side overhead.`,
    `Smart contract surface area risk and competitive displacement from newer specialized chains.`
  ];
  let catalysts = [
    `Upcoming mainnet protocol upgrade or hard fork consensus milestone.`,
    `Tier-1 exchange spot and perpetual derivatives listing expansion.`,
    `Ecosystem developer grant funding rounds and protocol total value locked (TVL) growth prints.`
  ];

  if (isL1) {
    blurb = `${name} provides sovereign base-layer consensus and smart contract execution in ${group}, competing for developer mindshare and validator security.`;
    bull = [
      `High degree of decentralized validator security paired with sub-second transaction finality.`,
      `Growing developer retention and active dApp ecosystem driving steady base gas fee burn.`,
      `Liquid staking adoption locking up circulating supply and reducing exchange liquid inventory.`
    ];
    bear = [
      `Severe ecosystem competition from dominant smart contract platforms and modular rollups.`,
      `Validator node hardware requirements impacting decentralization metrics over time.`,
      `High token inflation rates if initial distribution relies heavily on foundation staking subsidies.`
    ];
    catalysts = [
      `Major network hard fork introducing enhanced execution throughput or lower fees.`,
      `Institutional validator partnership onboarding and staking infrastructure integration.`,
      `Quarterly on-chain developer ecosystem report and hackathon deployment showcase.`
    ];
  } else if (isL2) {
    blurb = `${name} scales Ethereum or base-layer throughput in ${group}, utilizing rollup compression and decentralized sequencing to lower transaction costs.`;
    bull = [
      `Significant gas fee compression compared to Ethereum L1, attracting high-frequency consumer dApps.`,
      `Integration into unified cross-rollup liquidity networks and native yield mechanisms.`,
      `Accelerating TVL growth driven by DeFi incentives and developer deployment tooling.`
    ];
    bear = [
      `Sequencer centralization concerns prior to complete decentralized proof generation milestones.`,
      `High user fragmentation across competing Layer 2 and Layer 3 execution environments.`,
      `Token utility capture remains secondary to underlying base-layer settlement asset demand.`
    ];
    catalysts = [
      `Migration towards decentralized sequencer and prover architecture.`,
      `Ecosystem governance vote to implement native fee burning or revenue sharing.`,
      `Major Web3 consumer application migration onto the rollup network.`
    ];
  } else if (isDeFi) {
    blurb = `${name} delivers decentralized financial primitives in ${group}, facilitating autonomous on-chain liquidity, borrowing, or synthetic asset exchange.`;
    bull = [
      `Strong protocol fee generation with transparent fee sharing or token buyback mechanics.`,
      `Deep order book and liquidity pool depth ensuring low slippage for institutional crypto volume.`,
      `Cross-chain deployment broadening deposit surface area and fee generation channels.`
    ];
    bear = [
      `Liquidity mercenary risk where yield-seeking deposits migrate when incentive emissions taper.`,
      `Smart contract exploit exposure and oracle manipulation vector risks in volatile conditions.`,
      `Global regulatory scrutiny surrounding unhosted decentralized trading and derivative protocols.`
    ];
    catalysts = [
      `V3/V4 protocol architectural upgrade with enhanced capital efficiency and hooks.`,
      `Institutional permissioned liquidity pool launch for compliant asset managers.`,
      `Fee switch activation allocating real protocol revenue to token stakers.`
    ];
  } else if (isDePIN || isAI) {
    blurb = `${name} powers decentralized physical or compute infrastructure in ${group}, coordinating tokenized hardware incentives for machine learning and edge connectivity.`;
    bull = [
      `Surging demand for non-censored GPU compute and decentralized training cluster verification.`,
      `Network effect flywheel: hardware providers earn native tokens while enterprise customers burn compute credits.`,
      `Direct secular alignment with global AI compute shortages and decentralized cloud adoption.`
    ];
    bear = [
      `Hardware verification latency and bandwidth bottlenecks compared to centralized hyperscaler clusters.`,
      `Token emission sustainability if customer hardware leasing demand experiences cyclical digestion.`,
      `Complex onboarding requirements for enterprise developers accustomed to AWS or GCP APIs.`
    ];
    catalysts = [
      `Enterprise compute partnership with major AI model research labs or startups.`,
      `Network cluster hardware capacity milestone disclosure (e.g. active H100/H200 equivalents).`,
      `Protocol tokenomics update converting client payment revenues into automated market buybacks.`
    ];
  } else if (isRWA) {
    blurb = `${name} bridges traditional real-world credit and capital markets in ${group}, bringing yield-bearing securities and debt on-chain with institutional compliance.`;
    bull = [
      `High-yielding institutional collateral backing tokenized treasury and private credit issuance.`,
      `Partnership network with regulated broker-dealers, qualified custodians, and asset managers.`,
      `Countercyclical stability: resilient real-world yields attract flight-to-safety capital in bear markets.`
    ];
    bear = [
      `Regulatory uncertainty regarding cross-border securities tokenization and AML/KYC enforcement.`,
      `Credit underwriting default risks in off-chain private loan structures.`,
      `Liquidity discount compared to traditional secondary bond and treasury exchange venues.`
    ];
    catalysts = [
      `Tokenized assets under management (AUM) crossing major institutional milestones.`,
      `Regulatory compliance clearance or sovereign debt issuance pilot announcement.`,
      `Integration into major decentralized money markets as eligible collateral.`
    ];
  } else if (isGaming) {
    blurb = `${name} powers Web3 entertainment and interactive virtual economies in ${group}, linking gameplay progression with verifiable on-chain digital asset ownership.`;
    bull = [
      `Active daily gamer wallet growth and high engagement retention in primary game loops.`,
      `Strong secondary marketplace transaction volume generating continuous creator royalties.`,
      `Studio partnerships and AAA game engine integration (Unreal Engine 5, Unity).`
    ];
    bear = [
      `Player retention churn if gameplay loops fail to compete with traditional non-blockchain titles.`,
      `Token hyperinflation risk when in-game reward emissions outpace player sink mechanics.`,
      `Distribution barriers on traditional mobile app stores and PC game launcher platforms.`
    ];
    catalysts = [
      `Major game expansion pack release or seasonal battle pass launch.`,
      `Mainstream esports tournament sponsorship and influencer live-stream events.`,
      `Epic Games Store or mobile app store global distribution approval.`
    ];
  }

  return {
    symbol,
    name,
    kind: "crypto",
    group,
    base,
    blurb,
    bull,
    bear,
    catalysts,
  };
}

const assets = raw.map(generateCryptoNarrative);

const output = `import type { Asset } from "./market-assets";

/**
 * 793 Additional Digital Assets (Total Crypto Universe: 831 Cryptos)
 * Encompassing the top Layer-1, Layer-2, DeFi, DePIN, AI, RWA, Gaming,
 * and Staking assets across Binance, Bybit, Coinbase, and CoinGecko.
 */
export const ADDITIONAL_CRYPTOS: Asset[] = ${JSON.stringify(assets, null, 2)};
`;

fs.writeFileSync("lib/additional-cryptos.ts", output);
console.log(`Wrote ${assets.length} additional cryptos to lib/additional-cryptos.ts`);
