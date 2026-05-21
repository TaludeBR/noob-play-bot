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

  if (lower.startsWith("!carta ")) {
    const cardName = text.slice("!carta ".length).trim();
    return await getCard(cardName);
  }

  if (lower.startsWith("!regras ")) {
    const cardName = text.slice("!regras ".length).trim();
    return await getCardRulings(cardName);
  }

  if (lower.startsWith("!preco ") || lower.startsWith("!preço ")) {
    const commandLength = lower.startsWith("!preço ") ? "!preço ".length : "!preco ".length;
    const cardName = text.slice(commandLength).trim();
    return await getCardPrices(cardName);
  }

  if (lower === "!news" || lower === "!noticias" || lower === "!notícias") {
    return await getLatestNews();
  }

  return `Não entendi esse comando.

${helpMessage()}`;
}

function helpMessage() {
  return `*${BOT_NAME}*

Comandos disponíveis:

!ajuda
Mostra esta lista de comandos.

!carta <nome da carta>
Exemplo: !carta sol ring

!regras <nome da carta>
Exemplo: !regras sol ring

!news
Mostra as últimas notícias configuradas.

!preco ou !preço <nome da carta>
Exemplo: !preco sol ring`;
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