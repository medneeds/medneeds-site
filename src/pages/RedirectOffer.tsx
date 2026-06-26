import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Loader2,
  MapPin,
  Clock,
  Banknote,
  Smartphone,
  CalendarDays,
  AlertTriangle,
  ExternalLink,
  Stethoscope,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MedneedsLogo } from "@/components/brand/MedneedsLogo";
import { formatCurrency } from "@/utils/numberFormatter";
import { APP_DEEP_LINK_OFFER, APP_SHARE_URL } from "@/config/constants";
import {
  applyOfferOgMetaToDocument,
  buildOfferOgMeta,
  fetchPublicOfferPreview,
  type PublicOfferPreview,
} from "@/lib/publicOfferPreview";

const paymentMethodLabels: Record<string, string> = {
  AV: "À vista",
  NR: "No recebimento",
  AC: "A combinar",
};

function safeFormatDate(iso: string | undefined, pattern: string): string | null {
  if (!iso) return null;
  try {
    return format(parseISO(iso), pattern, { locale: ptBR });
  } catch {
    return null;
  }
}

function RevealButton({
  revealed,
  onToggle,
  label,
}: {
  revealed: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={onToggle}
      aria-label={revealed ? `Ocultar ${label}` : `Mostrar ${label}`}
    >
      {revealed ? (
        <EyeOff className="h-4 w-4" aria-hidden />
      ) : (
        <Eye className="h-4 w-4" aria-hidden />
      )}
    </Button>
  );
}

export default function RedirectOffer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<PublicOfferPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showValue, setShowValue] = useState(false);
  const openInApp = useCallback(() => {
    if (!id) return;
    window.location.href = APP_DEEP_LINK_OFFER(id);
  }, [id]);

  useEffect(() => {
    if (!id) {
      navigate("/ofertas", { replace: true });
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setShowValue(false);

    fetchPublicOfferPreview(id)
      .then((job) => {
        if (!cancelled) {
          setData(job);
          const webBase =
            (import.meta.env.VITE_APP_WEB_URL as string | undefined) ||
            window.location.origin;
          const pageUrl = `${webBase.replace(/\/$/, "")}/oferta/${id}`;
          applyOfferOgMetaToDocument(buildOfferOgMeta(job, pageUrl));
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message || "Não foi possível carregar a oferta.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  if (!id) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/40 px-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <p className="mt-4 text-sm text-muted-foreground">Carregando oferta…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/40 px-4 text-center">
        <MedneedsLogo className="mb-6" size="md" />
        <p className="max-w-md text-lg font-medium text-foreground">
          {error || "Esta oferta não está disponível."}
        </p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          O link pode ter expirado ou a oferta não é mais pública.
        </p>
        <Button className="mt-8" variant="outline" asChild>
          <a href="https://medneeds.com.br">Conhecer o Medneeds</a>
        </Button>
      </div>
    );
  }

  const dateLine = safeFormatDate(data.startDateTime, "EEEE, d 'de' MMMM yyyy");
  const timeStart = safeFormatDate(data.startDateTime, "HH:mm");
  const timeEnd = data.endDateTime
    ? safeFormatDate(data.endDateTime as string, "HH:mm")
    : null;
  const locationParts = [data.placeLabel, data.cityName, data.state].filter(
    Boolean,
  ) as string[];
  const locationStr = locationParts.join(", ");
  const paymentLabel = data.paymentMethod
    ? paymentMethodLabels[data.paymentMethod] || data.paymentMethod
    : "";
  const hasPrice = data.priceInCents != null && data.priceInCents > 0;
  const paymentDisplay = [
    showValue && hasPrice ? formatCurrency(data.priceInCents! / 100) : null,
    paymentLabel || null,
  ]
    .filter(Boolean)
    .join(" · ");
  const isCancelled = Boolean(data.cancelledAt);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40 px-4 py-10 pb-16">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <MedneedsLogo className="mb-8" size="md" />

        <Card className="w-full overflow-hidden border-border/80 shadow-lg">
          <CardHeader className="space-y-2 pb-2">
            <div className="flex flex-wrap gap-2">
              {isCancelled && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Cancelada
                </Badge>
              )}
              {data.unlisted && (
                <Badge variant="secondary">Não listada</Badge>
              )}
              {data.isFilled && !isCancelled && (
                <Badge variant="outline">Vaga preenchida</Badge>
              )}
            </div>
            <CardTitle className="text-xl leading-snug">
              {[data.modalityName, data.clinicalAreaName]
                .filter(Boolean)
                .join(" · ") || "Oferta Medneeds"}
            </CardTitle>
            <CardDescription className="text-base font-medium text-foreground/90">
              Oferta de {data.ownerFullName}
            </CardDescription>
            {data.professionalRegister ? (
              <div className="flex gap-2 pt-1 text-sm text-muted-foreground">
                <Stethoscope className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{data.professionalRegister}</span>
              </div>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            {(dateLine || timeStart) && (
              <div className="flex gap-3 text-sm">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  {dateLine && <p className="font-medium capitalize">{dateLine}</p>}
                  {(timeStart || timeEnd) && (
                    <p className="text-muted-foreground">
                      {timeStart}
                      {data.durationInHours != null
                        ? ` · ${data.durationInHours}h`
                        : ""}
                      {timeEnd ? ` · até ${timeEnd}` : ""}
                    </p>
                  )}
                </div>
              </div>
            )}

            {locationStr || data.addressDetail ? (
              <div className="flex gap-3 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  {locationStr ? <p>{locationStr}</p> : null}
                  {data.addressDetail ? (
                    <p
                      className={
                        locationStr
                          ? "mt-1 text-xs leading-snug text-muted-foreground"
                          : "leading-snug"
                      }
                    >
                      {data.addressDetail}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {(paymentDisplay || hasPrice) ? (
              <div className="flex items-start justify-between gap-2 text-sm">
                <div className="flex min-w-0 gap-3">
                  <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p>
                    {paymentDisplay ||
                      (showValue && hasPrice
                        ? formatCurrency(data.priceInCents! / 100)
                        : "••••")}
                  </p>
                </div>
                {hasPrice ? (
                  <RevealButton
                    revealed={showValue}
                    onToggle={() => setShowValue((v) => !v)}
                    label="valor na oferta"
                  />
                ) : null}
              </div>
            ) : null}

            {data.hasAdditionalDates && data.additionalDatesCount > 0 ? (
              <div className="flex gap-3 text-sm">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p>
                  + {data.additionalDatesCount}{" "}
                  {data.additionalDatesCount === 1
                    ? "data adicional"
                    : "datas adicionais"}{" "}
                  no app
                </p>
              </div>
            ) : null}

            {data.description ? (
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm leading-relaxed text-foreground/90">
                {data.description}
              </p>
            ) : null}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t bg-muted/20 pt-6">
            <Button className="w-full gap-2" size="lg" onClick={openInApp}>
              <Smartphone className="h-5 w-5" />
              Abrir no app Medneeds
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Se o aplicativo estiver instalado, a oferta será aberta
              automaticamente.
            </p>
            <Button variant="outline" className="w-full gap-2" asChild>
              <a href={APP_SHARE_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Baixar na App Store (iOS)
              </a>
            </Button>
          </CardFooter>
        </Card>

        <p className="mt-8 max-w-sm text-center text-xs text-muted-foreground">
          Medneeds conecta médicos a plantões e oportunidades. Baixe o app na
          App Store para solicitar esta oferta e conversar com o anunciante.
        </p>
      </div>
    </div>
  );
}
