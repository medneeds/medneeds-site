import { useApplicationsSummary } from "@/hooks/dashboard/useApplicationsSummary.tsx";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ApplicationsSummaryCard() {
  const {
    receivedCount,
    sentCount,
    pendingCount,
    acceptedReceivedCount,
    loading,
    error,
  } = useApplicationsSummary();
  const navigate = useNavigate();

  const handlePress = () => {
    navigate("/solicitacoes");
  };

  const getDescription = () => {
    if (loading) {
      return "Carregando suas solicitações...";
    }

    if (error) {
      return "Erro ao carregar suas solicitações";
    }

    if (receivedCount === 0 && sentCount === 0) {
      return <span className="text-foreground/50">Você ainda não tem solicitações de ofertas</span>;
    }

    const acceptedSentCount = sentCount;

    if (pendingCount > 0) {
      return pendingCount === 1
        ? "1 solicitação aguardando sua resposta"
        : `${pendingCount} solicitações aguardando sua resposta`;
    }

    if (acceptedReceivedCount > 0 && acceptedSentCount > 0) {
      const receivedText =
        acceptedReceivedCount === 1
          ? "1 solicitação aceita"
          : `${acceptedReceivedCount} solicitações aceitas`;
      const sentText =
        acceptedSentCount === 1
          ? "1 solicitação enviada"
          : `${acceptedSentCount} solicitações enviadas`;
      return `${receivedText} • ${sentText}`;
    }

    if (acceptedReceivedCount > 0) {
      return acceptedReceivedCount === 1
        ? "1 solicitação aceita"
        : `${acceptedReceivedCount} solicitações aceitas`;
    }

    return acceptedSentCount === 1
      ? "1 solicitação enviada"
      : `${acceptedSentCount} solicitações enviadas`;
  };

  return (
    <div
      className="mx-4 sm:mx-0 bg-card rounded-2xl p-3 shadow-card cursor-pointer group"
      onClick={handlePress}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <ArrowLeftRight className="w-5 h-5 text-foreground" />
          </div>
          <h3 className="font-bold text-md sm:text-lg text-foreground">
            Solicitações de ofertas
          </h3>
        </div>
        {!loading && pendingCount > 0 && (
          <div className="bg-accent text-accent-foreground px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">
            {pendingCount}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center">
        <p className="text-sm text-muted-foreground font-medium py-4">
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Carregando...
            </span>
          ) : (
            getDescription()
          )}
        </p>
      </div>
    </div>
  );
}
