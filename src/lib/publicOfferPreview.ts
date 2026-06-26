export type PublicOfferPreview = {
  id: string;
  modalityName: string | null;
  clinicalAreaName: string | null;
  placeLabel: string | null;
  cityName: string | null;
  state: string | null;
  addressDetail: string | null;
  professionalRegister: string | null;
  startDateTime?: string;
  endDateTime?: string | null;
  durationInHours: number | null;
  priceInCents: number | null;
  paymentMethod?: string;
  description: string | null;
  previewImageUrl: string | null;
  ownerFirstName: string;
  ownerFullName: string;
  cancelledAt?: unknown;
  isFilled: boolean;
  unlisted: boolean;
  hasAdditionalDates: boolean;
  additionalDatesCount: number;
};

export type OfferOgMeta = {
  title: string;
  description: string;
  image: string;
  url: string;
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  AV: "À vista",
  NR: "No recebimento",
  AC: "A combinar",
};

const DEFAULT_OG_IMAGE = "https://app.medneeds.com.br/medneeds-favicon.jpeg";

export function getPublicApiBase(apiBaseUrl?: string): string {
  if (apiBaseUrl) return apiBaseUrl.replace(/\/$/, "");
  if (typeof window !== "undefined" && import.meta.env.DEV) return "/api";
  const base = import.meta.env.VITE_API_BASE_URL || "/api";
  return base.replace(/\/$/, "");
}

export function absolutePublicMediaUrl(
  pathOrUrl: string,
  apiBaseUrl?: string,
): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const apiBase = getPublicApiBase(apiBaseUrl);
  const origin = apiBase.replace(/\/api\/?$/, "") || "";
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${origin}${path}`;
}

export function resolvePreviewImageForPortal(
  url: string | null,
  apiBaseUrl?: string,
): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  if (u.startsWith("/")) return absolutePublicMediaUrl(u, apiBaseUrl);
  try {
    const parsed = new URL(u);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return absolutePublicMediaUrl(parsed.pathname + parsed.search, apiBaseUrl);
    }
  } catch {
    return null;
  }
  return u;
}

export function normalizeOfferPreview(
  raw: unknown,
  apiBaseUrl?: string,
): PublicOfferPreview {
  if (!raw || typeof raw !== "object") {
    throw new Error("Resposta inválida");
  }
  const r = raw as Record<string, unknown>;

  const from = r.from as Record<string, unknown> | undefined;
  const nameFromProfile =
    from && typeof from.name === "string" ? from.name.trim() : "";

  let ownerFirstName =
    typeof r.ownerFirstName === "string" ? r.ownerFirstName.trim() : "";
  let ownerFullName =
    typeof r.ownerFullName === "string" ? r.ownerFullName.trim() : "";

  if (nameFromProfile) {
    if (!ownerFullName) ownerFullName = nameFromProfile;
    if (!ownerFirstName) {
      ownerFirstName = nameFromProfile.split(/\s+/)[0] || "Profissional";
    }
  }
  if (!ownerFirstName) ownerFirstName = "Profissional";
  if (!ownerFullName) ownerFullName = ownerFirstName;

  const modality = r.modality as { name?: string } | undefined;
  const clinicalArea = r.clinicalArea as { name?: string } | undefined;

  let modalityName: string | null =
    typeof r.modalityName === "string" && r.modalityName.trim()
      ? r.modalityName.trim()
      : null;
  if (!modalityName && modality?.name) modalityName = modality.name;

  let clinicalAreaName: string | null =
    typeof r.clinicalAreaName === "string" && r.clinicalAreaName.trim()
      ? r.clinicalAreaName.trim()
      : null;
  if (!clinicalAreaName && clinicalArea?.name) {
    clinicalAreaName = clinicalArea.name;
  }

  const city = r.city as { name?: string; label?: string } | undefined;
  let cityName: string | null =
    typeof r.cityName === "string" && r.cityName.trim()
      ? r.cityName.trim()
      : null;
  if (!cityName && city) {
    if (typeof city.name === "string" && city.name.trim()) {
      cityName = city.name.trim();
    } else if (typeof city.label === "string" && city.label.trim()) {
      cityName = city.label.split(",")[0]?.trim() ?? null;
    }
  }

  const place = r.place as { name?: string; formattedAddress?: string } | undefined;

  let placeLabel: string | null =
    typeof r.placeLabel === "string" && r.placeLabel.trim()
      ? r.placeLabel.trim()
      : null;
  if (!placeLabel) {
    if (typeof r.placeDisplayName === "string" && r.placeDisplayName.trim()) {
      placeLabel = r.placeDisplayName.trim();
    } else if (typeof place?.name === "string") {
      placeLabel = place.name;
    }
  }

  let addressDetail: string | null =
    typeof r.addressDetail === "string" && r.addressDetail.trim()
      ? r.addressDetail.trim()
      : null;
  if (!addressDetail && typeof place?.formattedAddress === "string") {
    addressDetail = place.formattedAddress.trim();
  }

  let professionalRegister: string | null =
    typeof r.professionalRegister === "string" && r.professionalRegister.trim()
      ? r.professionalRegister.trim()
      : null;
  if (!professionalRegister && from?.register && typeof from.register === "object") {
    const reg = from.register as {
      type?: string;
      uf?: string;
      number?: unknown;
    };
    if (reg.type != null && reg.number !== undefined && reg.number !== null) {
      const uf = typeof reg.uf === "string" ? reg.uf : "";
      professionalRegister = uf
        ? `${reg.type} ${uf} · ${reg.number}`
        : `${reg.type} · ${reg.number}`;
    }
  }

  let previewImageUrl: string | null =
    typeof r.previewImageUrl === "string" && r.previewImageUrl.trim()
      ? r.previewImageUrl.trim()
      : null;
  if (!previewImageUrl && r.previewImage && typeof r.previewImage === "object") {
    const url = (r.previewImage as { url?: string }).url;
    if (typeof url === "string" && url) {
      previewImageUrl = url.startsWith("http")
        ? url
        : absolutePublicMediaUrl(url, apiBaseUrl);
    }
  }

  previewImageUrl = resolvePreviewImageForPortal(previewImageUrl, apiBaseUrl);

  const additionalDates = r.additionalDates as unknown[] | undefined;

  return {
    id: String(r.id),
    modalityName,
    clinicalAreaName,
    placeLabel,
    cityName,
    state: typeof r.state === "string" ? r.state : null,
    addressDetail,
    professionalRegister,
    startDateTime: r.startDateTime as string | undefined,
    endDateTime: (r.endDateTime as string | null) ?? null,
    durationInHours:
      typeof r.durationInHours === "number" ? r.durationInHours : null,
    priceInCents: typeof r.priceInCents === "number" ? r.priceInCents : null,
    paymentMethod: r.paymentMethod as string | undefined,
    description: typeof r.description === "string" ? r.description : null,
    previewImageUrl,
    ownerFirstName,
    ownerFullName,
    cancelledAt: r.cancelledAt,
    isFilled:
      typeof r.isFilled === "boolean" ? r.isFilled : Boolean(r.to),
    unlisted:
      typeof r.unlisted === "boolean"
        ? r.unlisted
        : r.visibility === "UNLISTED",
    hasAdditionalDates:
      Array.isArray(additionalDates) && additionalDates.length > 0,
    additionalDatesCount: Array.isArray(additionalDates)
      ? additionalDates.length
      : typeof r.additionalDatesCount === "number"
        ? r.additionalDatesCount
        : 0,
  };
}

export async function fetchPublicOfferPreview(
  id: string,
  apiBaseUrl?: string,
): Promise<PublicOfferPreview> {
  const res = await fetch(`${getPublicApiBase(apiBaseUrl)}/jobs/${id}/preview`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      typeof err?.error === "string" ? err.error : "Oferta não encontrada",
    );
  }
  const json = await res.json();
  return normalizeOfferPreview(json, apiBaseUrl);
}

function formatOfferDate(iso: string | undefined): string | null {
  if (!iso) return null;
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    }).format(date);
  } catch {
    return null;
  }
}

export function buildOfferOgMeta(
  offer: PublicOfferPreview,
  pageUrl: string,
  apiBaseUrl?: string,
): OfferOgMeta {
  const titleParts = [offer.modalityName, offer.clinicalAreaName].filter(
    Boolean,
  ) as string[];
  const title =
    titleParts.length > 0
      ? `${titleParts.join(" · ")} | Medneeds`
      : "Oferta Medneeds";

  const descriptionParts: string[] = [];
  if (offer.ownerFullName) {
    descriptionParts.push(`Oferta de ${offer.ownerFullName}`);
  }

  const locationParts = [offer.placeLabel, offer.cityName, offer.state].filter(
    Boolean,
  ) as string[];
  if (locationParts.length > 0) {
    descriptionParts.push(locationParts.join(", "));
  }

  const dateLine = formatOfferDate(offer.startDateTime);
  if (dateLine) descriptionParts.push(dateLine);

  if (offer.paymentMethod) {
    const paymentLabel =
      PAYMENT_METHOD_LABELS[offer.paymentMethod] || offer.paymentMethod;
    descriptionParts.push(paymentLabel);
  }

  const description =
    offer.description?.trim() ||
    descriptionParts.join(" · ") ||
    "Veja esta oferta de plantão no Medneeds e abra no app para solicitar.";

  const resolvedImage = resolvePreviewImageForPortal(
    offer.previewImageUrl,
    apiBaseUrl,
  );

  return {
    title,
    description: description.slice(0, 300),
    image: resolvedImage || DEFAULT_OG_IMAGE,
    url: pageUrl,
  };
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function upsertMetaTag(html: string, attr: "name" | "property", key: string, content: string): string {
  const escaped = escapeHtmlAttr(content);
  const tag = `<meta ${attr}="${key}" content="${escaped}" />`;
  const pattern = new RegExp(
    `<meta\\s+${attr}=["']${key}["'][^>]*>`,
    "i",
  );
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

export function injectOfferOgMetaIntoHtml(html: string, meta: OfferOgMeta): string {
  let result = html.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${escapeHtmlAttr(meta.title)}</title>`,
  );

  result = upsertMetaTag(result, "name", "description", meta.description);
  result = upsertMetaTag(result, "property", "og:title", meta.title);
  result = upsertMetaTag(result, "property", "og:description", meta.description);
  result = upsertMetaTag(result, "property", "og:type", "website");
  result = upsertMetaTag(result, "property", "og:url", meta.url);
  result = upsertMetaTag(result, "property", "og:image", meta.image);
  result = upsertMetaTag(result, "property", "og:site_name", "Medneeds");
  result = upsertMetaTag(result, "name", "twitter:card", "summary_large_image");
  result = upsertMetaTag(result, "name", "twitter:title", meta.title);
  result = upsertMetaTag(result, "name", "twitter:description", meta.description);
  result = upsertMetaTag(result, "name", "twitter:image", meta.image);

  return result;
}

export function applyOfferOgMetaToDocument(meta: OfferOgMeta): void {
  if (typeof document === "undefined") return;

  document.title = meta.title;

  const setMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
    let el = document.querySelector(selector) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  setMeta('meta[name="description"]', "name", "description", meta.description);
  setMeta('meta[property="og:title"]', "property", "og:title", meta.title);
  setMeta('meta[property="og:description"]', "property", "og:description", meta.description);
  setMeta('meta[property="og:type"]', "property", "og:type", "website");
  setMeta('meta[property="og:url"]', "property", "og:url", meta.url);
  setMeta('meta[property="og:image"]', "property", "og:image", meta.image);
  setMeta('meta[property="og:site_name"]', "property", "og:site_name", "Medneeds");
  setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
  setMeta('meta[name="twitter:title"]', "name", "twitter:title", meta.title);
  setMeta('meta[name="twitter:description"]', "name", "twitter:description", meta.description);
  setMeta('meta[name="twitter:image"]', "name", "twitter:image", meta.image);
}
