import firebaseConfig from "../firebase-applet-config.json";

interface Env {
  ASSETS: Fetcher;
}

type FirestoreValue = {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

type FirestoreDocument = {
  fields?: Record<string, FirestoreValue>;
};

const readString = (fields: Record<string, FirestoreValue>, key: string): string =>
  fields[key]?.stringValue || "";

const readBool = (fields: Record<string, FirestoreValue>, key: string): boolean =>
  fields[key]?.booleanValue === true;

const htmlEscape = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[char] || char;
  });

const isShareCrawler = (userAgent: string): boolean =>
  /twitterbot|xbot|facebookexternalhit|facebot|linkedinbot|discordbot|slackbot|telegrambot|whatsapp|pinterestbot|googlebot|bingbot|crawler|spider/i.test(
    userAgent
  );

async function loadPublicProduct(productId: string): Promise<Record<string, FirestoreValue> | null> {
  const databaseId = encodeURIComponent(firebaseConfig.firestoreDatabaseId);
  const encodedProductId = encodeURIComponent(productId);
  const endpoint =
    `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${databaseId}/documents/products/${encodedProductId}?key=${firebaseConfig.apiKey}`;

  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    cf: { cacheTtl: 120, cacheEverything: true },
  } as RequestInit & { cf?: Record<string, unknown> });

  if (!response.ok) return null;
  const document = (await response.json()) as FirestoreDocument;
  return document.fields || null;
}

function primaryImage(fields: Record<string, FirestoreValue>): string {
  const main = readString(fields, "imageUrl");
  if (main) return main;
  const imageValues = fields.imageUrls?.arrayValue?.values || [];
  return imageValues[0]?.stringValue || "";
}

function imageDataResponse(dataUrl: string): Response | null {
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) return null;
  const subtype = match[1].toLowerCase() === "jpg" ? "jpeg" : match[1].toLowerCase();
  try {
    const binary = atob(match[2].replace(/\s/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return new Response(bytes, {
      headers: {
        "Content-Type": `image/${subtype}`,
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return null;
  }
}

function unavailableResponse(): Response {
  return new Response("商品画像を取得できませんでした。", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const imageMatch = url.pathname.match(/^\/share-image\/([^/]+)$/);
    const shareMatch = url.pathname.match(/^\/share\/([^/]+)$/);

    if (imageMatch) {
      const productId = decodeURIComponent(imageMatch[1]);
      const fields = await loadPublicProduct(productId);
      if (!fields || readString(fields, "status") !== "掲載中" || !readBool(fields, "verifiedForPublic")) {
        return unavailableResponse();
      }
      const image = primaryImage(fields);
      if (!image) return unavailableResponse();
      if (image.startsWith("data:image/")) {
        return imageDataResponse(image) || unavailableResponse();
      }
      if (image.startsWith("https://")) {
        return Response.redirect(image, 302);
      }
      return unavailableResponse();
    }

    if (shareMatch) {
      // Human visitors see the normal SENA LUXE SPA. Social crawlers receive
      // product-specific server-rendered Open Graph/Twitter metadata.
      if (!isShareCrawler(request.headers.get("user-agent") || "")) {
        return env.ASSETS.fetch(new Request(new URL("/", request.url), request));
      }

      const productId = decodeURIComponent(shareMatch[1]);
      const fields = await loadPublicProduct(productId);
      if (
        !fields ||
        readString(fields, "status") !== "掲載中" ||
        !readBool(fields, "verifiedForPublic") ||
        !["引退垢", "初期垢"].includes(readString(fields, "category"))
      ) {
        return env.ASSETS.fetch(new Request(new URL("/", request.url), request));
      }

      const title = readString(fields, "title") || readString(fields, "gameName") || "SENA LUXE";
      const gameName = readString(fields, "gameName");
      const summary = readString(fields, "summary");
      const description = [gameName, summary, "商品内容・在庫・価格は公式LINEでご確認ください。"]
        .filter(Boolean)
        .join("｜")
        .slice(0, 300);
      const canonical = `${url.origin}/share/${encodeURIComponent(productId)}`;
      const imageUrl = primaryImage(fields)
        ? `${url.origin}/share-image/${encodeURIComponent(productId)}`
        : `${url.origin}/sena-luxe-icon.svg`;
      const safeTitle = htmlEscape(`${title} | SENA LUXE`);
      const safeDescription = htmlEscape(description);
      const safeCanonical = htmlEscape(canonical);
      const safeImageUrl = htmlEscape(imageUrl);

      const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeTitle}</title>
<meta name="description" content="${safeDescription}">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDescription}">
<meta property="og:type" content="product">
<meta property="og:url" content="${safeCanonical}">
<meta property="og:image" content="${safeImageUrl}">
<meta property="og:image:alt" content="${safeTitle}のメイン画像">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeDescription}">
<meta name="twitter:image" content="${safeImageUrl}">
<link rel="canonical" href="${safeCanonical}">
</head>
<body><p><a href="/">SENA LUXE</a></p><h1>${safeTitle}</h1><p>${safeDescription}</p><img src="${safeImageUrl}" alt="${safeTitle}"></body>
</html>`;

      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=180",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
