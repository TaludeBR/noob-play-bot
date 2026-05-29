require("dotenv").config();

const express = require("express");
const Parser = require("rss-parser");
const { MessagingResponse } = require("twilio").twiml;

const app = express();
const rssParser = new Parser();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_NAME = process.env.BOT_NAME || "TCG Bot";

app.get("/", (req, res) => {
  res.json({
    status: "online",
    bot: BOT_NAME,
    endpoints: ["/whatsapp", "/health"]
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/whatsapp", async (req, res) => {
  const twiml = new MessagingResponse();

  try {
    const incomingText = normalizeText(req.body.Body || "");
    const reply = await handleCommand(incomingText);

    twiml.message(reply);
    res.type("text/xml").send(twiml.toString());
  } catch (error) {
    console.error("Erro no webhook:", error);

    twiml.message(
      "Tive um problema ao processar sua mensagem. Tente novamente em alguns instantes."
    );

    res.type("text/xml").send(twiml.toString());
  }
});

function normalizeText(text) {
  return text.trim().replace(/\s+/g, " ");
}

async function handleCommand(text) {
  const lower = text.toLowerCase();

if (!text || lower === "!ajuda" || lower === "ajuda" || lower === "help") {
  return helpMessage();
}

if (lower === "!ajuda mtg" || lower === "ajuda mtg" || lower === "!help mtg") {
  return helpMtgMessage();
}

if (
  lower === "!ajuda pkm" ||
  lower === "ajuda pkm" ||
  lower === "!ajuda pokemon" ||
  lower === "ajuda pokemon" ||
  lower === "!help pkm"
) {
  return helpPokemonMessage();
}

if (
  lower === "!ajuda ygo" ||
  lower === "ajuda ygo" ||
  lower === "!ajuda yugioh" ||
  lower === "ajuda yugioh" ||
  lower === "!help ygo"
) {
  return helpYgoMessage();
}

// Atalhos rápidos de consulta
if (lower.startsWith("!mtg ")) {
  const cardName = text.slice("!mtg ".length).trim();
  return await getCard(cardName);
}

if (lower.startsWith("!magic ")) {
  const cardName = text.slice("!magic ".length).trim();
  return await getCard(cardName);
}

if (lower.startsWith("!pkm ")) {
  const cardName = text.slice("!pkm ".length).trim();
  return await getPokemonCard(cardName);
}

if (lower.startsWith("!pokemon ")) {
  const cardName = text.slice("!pokemon ".length).trim();
  return await getPokemonCard(cardName);
}

if (lower.startsWith("!ygo ")) {
  const cardName = text.slice("!ygo ".length).trim();
  return await getYgoCard(cardName);
}

if (lower.startsWith("!yugioh ")) {
  const cardName = text.slice("!yugioh ".length).trim();
  return await getYgoCard(cardName);
}

  // Magic: The Gathering
  if (lower.startsWith("!carta mtg ")) {
    const cardName = text.slice("!carta mtg ".length).trim();
    return await getCard(cardName);
  }

  if (lower.startsWith("!preco mtg ") || lower.startsWith("!preço mtg ")) {
    const commandLength = lower.startsWith("!preço mtg ")
      ? "!preço mtg ".length
      : "!preco mtg ".length;

    const cardName = text.slice(commandLength).trim();
    return await getCardPrices(cardName);
  }

  if (lower.startsWith("!regra mtg ") || lower.startsWith("!regras mtg ")) {
    const commandLength = lower.startsWith("!regras mtg ")
      ? "!regras mtg ".length
      : "!regra mtg ".length;

    const cardName = text.slice(commandLength).trim();
    return await getCardRulings(cardName);
  }

  // Pokémon TCG
  if (lower.startsWith("!carta pkm ") || lower.startsWith("!carta pokemon ")) {
    const commandLength = lower.startsWith("!carta pokemon ")
      ? "!carta pokemon ".length
      : "!carta pkm ".length;

    const cardName = text.slice(commandLength).trim();
    return await getPokemonCard(cardName);
  }

  if (
    lower.startsWith("!preco pkm ") ||
    lower.startsWith("!preço pkm ") ||
    lower.startsWith("!preco pokemon ") ||
    lower.startsWith("!preço pokemon ")
  ) {
    let commandLength = "!preco pkm ".length;

    if (lower.startsWith("!preço pkm ")) commandLength = "!preço pkm ".length;
    if (lower.startsWith("!preco pokemon ")) commandLength = "!preco pokemon ".length;
    if (lower.startsWith("!preço pokemon ")) commandLength = "!preço pokemon ".length;

    const cardName = text.slice(commandLength).trim();
    return await getPokemonCardPrices(cardName);
  }

  if (
    lower.startsWith("!regra pkm ") ||
    lower.startsWith("!regras pkm ") ||
    lower.startsWith("!regra pokemon ") ||
    lower.startsWith("!regras pokemon ")
  ) {
    let commandLength = "!regra pkm ".length;

    if (lower.startsWith("!regras pkm ")) commandLength = "!regras pkm ".length;
    if (lower.startsWith("!regra pokemon ")) commandLength = "!regra pokemon ".length;
    if (lower.startsWith("!regras pokemon ")) commandLength = "!regras pokemon ".length;

    const cardName = text.slice(commandLength).trim();
    return await getPokemonRules(cardName);
  }

  // Yu-Gi-Oh!
  if (lower.startsWith("!carta ygo ")) {
    const cardName = text.slice("!carta ygo ".length).trim();
    return await getYgoCard(cardName);
  }

  if (lower.startsWith("!preco ygo ") || lower.startsWith("!preço ygo ")) {
    const commandLength = lower.startsWith("!preço ygo ")
      ? "!preço ygo ".length
      : "!preco ygo ".length;

    const cardName = text.slice(commandLength).trim();
    return await getYgoCardPrices(cardName);
  }

  if (lower.startsWith("!regra ygo ") || lower.startsWith("!regras ygo ")) {
    const commandLength = lower.startsWith("!regras ygo ")
      ? "!regras ygo ".length
      : "!regra ygo ".length;

    const cardName = text.slice(commandLength).trim();
    return await getYgoRules(cardName);
  }

  // Aliases antigos de Magic, mantidos por compatibilidade
  if (lower.startsWith("!carta ")) {
    const cardName = text.slice("!carta ".length).trim();
    return await getCard(cardName);
  }

  if (lower.startsWith("!regras ") || lower.startsWith("!regra ")) {
    const commandLength = lower.startsWith("!regras ")
      ? "!regras ".length
      : "!regra ".length;

    const cardName = text.slice(commandLength).trim();
    return await getCardRulings(cardName);
  }

  if (lower.startsWith("!preco ") || lower.startsWith("!preço ")) {
    const commandLength = lower.startsWith("!preço ")
      ? "!preço ".length
      : "!preco ".length;

    const cardName = text.slice(commandLength).trim();
    return await getCardPrices(cardName);
  }

  if (lower === "!news" || lower === "!noticias" || lower === "!notícias") {
    return await getLatestNews();
  }

return unknownCommandMessage();
}

function unknownCommandMessage() {
  return `Não entendi esse comando.

Tente um destes exemplos:

!mtg sol ring
!pkm charizard
!ygo dark magician

Ou veja a ajuda:

!ajuda
!ajuda mtg
!ajuda pkm
!ajuda ygo`;
}

function helpMessage() {
  return `*${BOT_NAME}*

Bot multi-TCG para consultar cartas, preços, regras e notícias.

*Comandos rápidos*
!mtg sol ring
!pkm charizard
!ygo dark magician

*Ajuda por jogo*
!ajuda mtg
!ajuda pkm
!ajuda ygo

*Notícias*
!news

Para comandos completos, use a ajuda de cada jogo.`;
}

function helpMtgMessage() {
  return `_*Magic: The Gathering*_

!carta mtg <nome da carta>
Exemplo: !carta mtg lightning bolt

!preco ou !preço mtg <nome da carta>
Exemplo: !preco mtg sol ring

!regra ou !regras mtg <nome da carta>
Exemplo: !regra mtg lightning bolt

*Atalho rápido*
!mtg <nome da carta>
Exemplo: !mtg sol ring`;
}

function helpPokemonMessage() {
  return `_*Pokémon TCG*_

!carta pkm <nome da carta>
Exemplo: !carta pkm charizard

!preco ou !preço pkm <nome da carta>
Exemplo: !preco pkm charizard

!regra ou !regras pkm <nome da carta>
Exemplo: !regra pkm charizard

*Atalho rápido*
!pkm <nome da carta>
Exemplo: !pkm charizard`;
}

function helpYgoMessage() {
  return `_*Yu-Gi-Oh!*_

!carta ygo <nome da carta>
Exemplo: !carta ygo dark magician

!preco ou !preço ygo <nome da carta>
Exemplo: !preco ygo dark magician

!regra ou !regras ygo <nome da carta>
Exemplo: !regra ygo dark magician

*Atalho rápido*
!ygo <nome da carta>
Exemplo: !ygo dark magician`;
}

async function getCard(cardName) {
  if (!cardName) {
    return "Envie o nome da carta. Exemplo: !carta lightning bolt";
  }

  const url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`;

  const response = await fetch(url);

  if (!response.ok) {
    return `Não encontrei nenhuma carta parecida com "${cardName}".`;
  }

  const card = await response.json();

  const name = card.name || "Nome não encontrado";
  const manaCost = card.mana_cost || "";
  const typeLine = card.type_line || "";
  const oracleText = getOracleText(card);
  const legalities = formatLegalities(card.legalities);
  const scryfallUrl = card.scryfall_uri || "";

  return `*${name}* ${manaCost}

${typeLine}

${oracleText}

${legalities}

${scryfallUrl}`;
}

async function getCardRulings(cardName) {
  if (!cardName) {
    return "Envie o nome da carta. Exemplo: !regras lightning bolt";
  }

  const cardUrl = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`;
  const cardResponse = await fetch(cardUrl);

  if (!cardResponse.ok) {
    return `Não encontrei nenhuma carta parecida com "${cardName}".`;
  }

  const card = await cardResponse.json();

  const rulingsUrl = `https://api.scryfall.com/cards/${card.id}/rulings`;
  const rulingsResponse = await fetch(rulingsUrl);

  if (!rulingsResponse.ok) {
    return `Encontrei a carta *${card.name}*, mas não consegui buscar as regras dela agora.`;
  }

  const rulingsData = await rulingsResponse.json();
  const rulings = rulingsData.data || [];

  if (rulings.length === 0) {
    return `*${card.name}*

Não encontrei rulings cadastradas no Scryfall para esta carta.`;
  }

  const latestRulings = rulings.slice(0, 3).map((ruling) => {
    return `• ${ruling.published_at}: ${ruling.comment}`;
  });

  return `*Rulings — ${card.name}*

${latestRulings.join("\n\n")}

${card.scryfall_uri}`;
}

async function getLatestNews() {
  const feeds = (process.env.NEWS_FEEDS || "")
    .split(",")
    .map((feed) => feed.trim())
    .filter(Boolean);

  if (feeds.length === 0) {
    return "Nenhuma fonte de notícias foi configurada ainda.";
  }

  const allItems = [];

  for (const feedUrl of feeds) {
    try {
      const feed = await rssParser.parseURL(feedUrl);

      for (const item of feed.items.slice(0, 5)) {
        allItems.push({
          title: item.title,
          link: item.link,
          date: item.isoDate || item.pubDate || "",
          source: feed.title || feedUrl
        });
      }
    } catch (error) {
      console.error(`Erro lendo feed ${feedUrl}:`, error.message);
    }
  }

  if (allItems.length === 0) {
    return "Não consegui encontrar notícias agora. Tente novamente mais tarde.";
  }

  allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

	const latest = allItems.slice(0, 5).map((item, index) => {
		return `${index + 1}. *${item.title}*

Fonte: ${item.source}
${item.link}`;
	});

  return `*Últimas notícias TCG*

${latest.join("\n\n")}`;
}

function getOracleText(card) {
  if (card.oracle_text) {
    return card.oracle_text;
  }

  if (Array.isArray(card.card_faces)) {
    return card.card_faces
      .map((face) => {
        const faceName = face.name || "";
        const faceText = face.oracle_text || "";
        return `*${faceName}*\n${faceText}`;
      })
      .join("\n\n");
  }

  return "Texto Oracle não encontrado.";
}

async function getCardPrices(cardName) {
  if (!cardName) {
    return "Envie o nome da carta. Exemplo: !preco sol ring";
  }

  const url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`;

  const response = await fetch(url);

  if (!response.ok) {
    return `Não encontrei nenhuma carta parecida com "${cardName}".`;
  }

  const card = await response.json();

  const prices = card.prices || {};

  const usd = prices.usd ? `$${prices.usd}` : "Não informado";
  const usdFoil = prices.usd_foil ? `$${prices.usd_foil}` : "Não informado";
  const usdEtched = prices.usd_etched ? `$${prices.usd_etched}` : "Não informado";
  const eur = prices.eur ? `€${prices.eur}` : "Não informado";
  const eurFoil = prices.eur_foil ? `€${prices.eur_foil}` : "Não informado";
  const tix = prices.tix ? `${prices.tix} tix` : "Não informado";

  return `*Preços — ${card.name}*

USD: ${usd}
USD Foil: ${usdFoil}
USD Etched: ${usdEtched}
EUR: ${eur}
EUR Foil: ${eurFoil}
MTGO: ${tix}

Fonte: Scryfall
${card.scryfall_uri}`;
}

function getPokemonHeaders() {
  const headers = {
    Accept: "application/json"
  };

  if (process.env.POKEMON_TCG_API_KEY) {
    headers["X-Api-Key"] = process.env.POKEMON_TCG_API_KEY;
  }

  return headers;
}

async function getPokemonCard(cardName) {
  if (!cardName) {
    return "Envie o nome da carta Pokémon. Exemplo: !carta pokemon charizard";
  }

  const query = `name:"${cardName}"`;
  const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=1`;

  const response = await fetch(url, {
    headers: getPokemonHeaders()
  });

  if (!response.ok) {
    return `Não consegui buscar cartas de Pokémon agora. Tente novamente em alguns instantes.`;
  }

  const data = await response.json();
  const card = data.data?.[0];

  if (!card) {
    return `Não encontrei nenhuma carta Pokémon parecida com "${cardName}".`;
  }

  const types = Array.isArray(card.types) ? card.types.join(", ") : "Não informado";
  const hp = card.hp || "Não informado";
  const setName = card.set?.name || "Set não informado";
  const rarity = card.rarity || "Raridade não informada";
  const number = card.number || "Número não informado";

  const attacks = Array.isArray(card.attacks)
    ? card.attacks.slice(0, 2).map((attack) => {
        const cost = Array.isArray(attack.cost) ? attack.cost.join(", ") : "Sem custo informado";
        const damage = attack.damage ? ` — Dano: ${attack.damage}` : "";
        const text = attack.text ? `\n${attack.text}` : "";
        return `• ${attack.name} (${cost})${damage}${text}`;
      }).join("\n\n")
    : "Ataques não informados.";

  const abilities = Array.isArray(card.abilities)
    ? card.abilities.slice(0, 2).map((ability) => {
        return `• ${ability.name}: ${ability.text || "Sem texto informado."}`;
      }).join("\n\n")
    : "";

  const priceSummary = formatPokemonPriceSummary(card);

  return `*Pokémon — ${card.name}*

HP: ${hp}
Tipo(s): ${types}
Set: ${setName}
Número: ${number}
Raridade: ${rarity}

${abilities ? `Habilidades:\n${abilities}\n\n` : ""}Ataques:
${attacks}

${priceSummary}

${card.images?.large || card.images?.small || ""}`;
}

async function getPokemonCardPrices(cardName) {
  if (!cardName) {
    return "Envie o nome da carta Pokémon. Exemplo: !preco pkm charizard";
  }

  const query = `name:"${cardName}"`;
  const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=1`;

  const response = await fetch(url, {
    headers: getPokemonHeaders()
  });

  if (!response.ok) {
    return "Não consegui buscar preços de Pokémon agora. Tente novamente em alguns instantes.";
  }

  const data = await response.json();
  const card = data.data?.[0];

  if (!card) {
    return `Não encontrei nenhuma carta Pokémon parecida com "${cardName}".`;
  }

  return `*Preços Pokémon — ${card.name}*

Set: ${card.set?.name || "Set não informado"}
Número: ${card.number || "Número não informado"}
Raridade: ${card.rarity || "Raridade não informada"}

${formatPokemonPriceSummary(card)}

${card.tcgplayer?.url || card.images?.large || ""}`;
}

async function getPokemonRules(cardName) {
  if (!cardName) {
    return "Envie o nome da carta Pokémon. Exemplo: !regra pkm charizard";
  }

  const query = `name:"${cardName}"`;
  const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=1`;

  const response = await fetch(url, {
    headers: getPokemonHeaders()
  });

  if (!response.ok) {
    return "Não consegui buscar informações de regras de Pokémon agora. Tente novamente em alguns instantes.";
  }

  const data = await response.json();
  const card = data.data?.[0];

  if (!card) {
    return `Não encontrei nenhuma carta Pokémon parecida com "${cardName}".`;
  }

  const abilities = Array.isArray(card.abilities)
    ? card.abilities.map((ability) => {
        return `• ${ability.name}: ${ability.text || "Sem texto informado."}`;
      }).join("\n\n")
    : "Nenhuma habilidade informada.";

  const attacks = Array.isArray(card.attacks)
    ? card.attacks.map((attack) => {
        const cost = Array.isArray(attack.cost) ? attack.cost.join(", ") : "Sem custo informado";
        const damage = attack.damage ? ` — Dano: ${attack.damage}` : "";
        const text = attack.text ? `\n${attack.text}` : "";
        return `• ${attack.name} (${cost})${damage}${text}`;
      }).join("\n\n")
    : "Nenhum ataque informado.";

  const rules = Array.isArray(card.rules)
    ? card.rules.map((rule) => `• ${rule}`).join("\n")
    : "Nenhuma regra especial informada.";

  return `*Regras Pokémon — ${card.name}*

Set: ${card.set?.name || "Set não informado"}
Número: ${card.number || "Número não informado"}

Habilidades:
${abilities}

Ataques:
${attacks}

Regras especiais:
${rules}

${card.images?.large || card.images?.small || ""}`;
}

function formatPokemonPriceSummary(card) {
  const prices = card.tcgplayer?.prices;

  if (!prices || Object.keys(prices).length === 0) {
    return "Preços TCGPlayer: Não informado.";
  }

  const lines = Object.entries(prices).slice(0, 4).map(([variant, values]) => {
    const market = values.market ? `$${values.market}` : "Sem market";
    const low = values.low ? `$${values.low}` : "Sem low";
    return `${capitalizeText(variant)}: Market ${market} | Low ${low}`;
  });

  return `Preços TCGPlayer:
${lines.join("\n")}`;
}

async function getYgoCard(cardName) {
  if (!cardName) {
    return "Envie o nome da carta de Yu-Gi-Oh!. Exemplo: !carta ygo dark magician";
  }

  const card = await findYgoCard(cardName);

  if (!card) {
    return `Não encontrei nenhuma carta de Yu-Gi-Oh! parecida com "${cardName}".`;
  }

  const monsterStats = typeof card.atk !== "undefined"
    ? `ATK/DEF: ${card.atk}/${typeof card.def !== "undefined" ? card.def : "?"}`
    : "";

  const level = card.level ? `Nível/Rank/Link: ${card.level}` : "";
  const attribute = card.attribute ? `Atributo: ${card.attribute}` : "";
  const race = card.race ? `Tipo/Raça: ${card.race}` : "";
  const archetype = card.archetype ? `Arquétipo: ${card.archetype}` : "";

  return `*Yu-Gi-Oh! — ${card.name}*

${card.type || "Tipo não informado"}
${race}
${attribute}
${level}
${monsterStats}
${archetype}

${limitText(card.desc || "Texto não informado.", 1200)}

${formatYgoBanlist(card.banlist_info)}

${formatYgoPriceSummary(card)}

${card.ygoprodeck_url || ""}`;
}

async function getYgoCardPrices(cardName) {
  if (!cardName) {
    return "Envie o nome da carta de Yu-Gi-Oh!. Exemplo: !preco ygo dark magician";
  }

  const card = await findYgoCard(cardName);

  if (!card) {
    return `Não encontrei nenhuma carta de Yu-Gi-Oh! parecida com "${cardName}".`;
  }

  return `*Preços Yu-Gi-Oh! — ${card.name}*

${formatYgoPriceSummary(card)}

${card.ygoprodeck_url || ""}`;
}

async function getYgoRules(cardName) {
  if (!cardName) {
    return "Envie o nome da carta de Yu-Gi-Oh!. Exemplo: !regra ygo dark magician";
  }

  const card = await findYgoCard(cardName);

  if (!card) {
    return `Não encontrei nenhuma carta de Yu-Gi-Oh! parecida com "${cardName}".`;
  }

  return `*Regras Yu-Gi-Oh! — ${card.name}*

${card.type || "Tipo não informado"}
${card.race ? `Tipo/Raça: ${card.race}` : ""}
${card.attribute ? `Atributo: ${card.attribute}` : ""}
${card.level ? `Nível/Rank/Link: ${card.level}` : ""}
${typeof card.atk !== "undefined" ? `ATK/DEF: ${card.atk}/${typeof card.def !== "undefined" ? card.def : "?"}` : ""}

Texto da carta:
${limitText(card.desc || "Texto não informado.", 1500)}

${formatYgoBanlist(card.banlist_info)}

${card.ygoprodeck_url || ""}`;
}

async function findYgoCard(cardName) {
  const exactUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(cardName)}`;

  let response = await fetch(exactUrl);

  if (!response.ok) {
    const fuzzyUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(cardName)}`;
    response = await fetch(fuzzyUrl);
  }

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.data?.[0] || null;
}

function formatYgoPriceSummary(card) {
  const prices = card.card_prices?.[0];

  if (!prices) {
    return "Preços: Não informado.";
  }

  return `Preços:
Cardmarket: €${prices.cardmarket_price || "Não informado"}
TCGPlayer: $${prices.tcgplayer_price || "Não informado"}
eBay: $${prices.ebay_price || "Não informado"}
Amazon: $${prices.amazon_price || "Não informado"}
CoolStuffInc: $${prices.coolstuffinc_price || "Não informado"}`;
}

function formatYgoBanlist(banlistInfo = {}) {
  if (!banlistInfo || Object.keys(banlistInfo).length === 0) {
    return "Banlist: Sem restrição informada.";
  }

  return `Banlist:
TCG: ${banlistInfo.ban_tcg || "Sem restrição informada"}
OCG: ${banlistInfo.ban_ocg || "Sem restrição informada"}
GOAT: ${banlistInfo.ban_goat || "Sem restrição informada"}`;
}

function capitalizeText(text) {
  if (!text) {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function limitText(text, maxLength) {
  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

function formatLegalities(legalities = {}) {
  const formats = {
    commander: "Commander",
    modern: "Modern",
    pioneer: "Pioneer",
    pauper: "Pauper",
    standard: "Standard"
  };

  const translateStatus = {
    legal: "Permitida",
    not_legal: "Não permitida",
    banned: "Banida",
    restricted: "Restrita",
    unknown: "Desconhecida"
  };

  const lines = Object.entries(formats).map(([key, label]) => {
    const status = legalities[key] || "unknown";
    return `${label}: ${translateStatus[status] || status}`;
  });

  return `Legalidade:
${lines.join("\n")}`;
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`${BOT_NAME} rodando na porta ${PORT}`);
});