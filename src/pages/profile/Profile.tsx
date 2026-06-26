import { MainLayout } from "@/components/layout/MainLayout.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { useAuthContext } from "@/contexts/auth/useAuthContext.ts";
import { useIsMobile } from "@/hooks/ui/useMobile.tsx";
import authService from "@/services/auth/AuthService.ts";
import { createMediaUploadService } from "@/services/upload/UploadService.ts";
import { formatName } from "@/utils";
import { motion } from "framer-motion";
import { Camera, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const formatWhatsAppNumber = (number: string): string => {
  const cleanNumber = number.replace(/\D/g, "");
  if (cleanNumber.length === 11) {
    return `(${cleanNumber.slice(0, 2)}) ${cleanNumber.slice(2, 7)}-${cleanNumber.slice(7)}`;
  } else if (cleanNumber.length === 10) {
    return `(${cleanNumber.slice(0, 2)}) ${cleanNumber.slice(2, 6)}-${cleanNumber.slice(6)}`;
  } else if (cleanNumber.length > 0) {
    if (cleanNumber.length <= 2) {
      return `(${cleanNumber}`;
    } else if (cleanNumber.length <= 7) {
      return `(${cleanNumber.slice(0, 2)}) ${cleanNumber.slice(2)}`;
    } else if (cleanNumber.length <= 11) {
      return `(${cleanNumber.slice(0, 2)}) ${cleanNumber.slice(2, 7)}-${cleanNumber.slice(7)}`;
    }
  }
  return number;
};

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 6);
  const part3 = digits.slice(6, 9);
  const part4 = digits.slice(9, 11);
  let out = part1;
  if (part2) out += `.${part2}`;
  if (part3) out += `.${part3}`;
  if (part4) out += `-${part4}`;
  return out;
};

const validateCPF = (value: string) => value.replace(/\D/g, "").length === 11;
const validateWhatsAppNumber = (number: string): boolean => {
  const cleanNumber = number.replace(/\D/g, "");
  return cleanNumber.length >= 10 && cleanNumber.length <= 11;
};

function useProfileEditor() {
  const { user } = useAuthContext();

  const [name, setName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [cpf, setCpf] = useState("");
  const [crmNumber, setCrmNumber] = useState("");
  const [crmUf, setCrmUf] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [moreRegisters, setMoreRegisters] = useState<
    Array<{ id?: string; number: string; uf: string; description?: string }>
  >([]);

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      const phoneValue =
        (user as any).whatsappNumber || (user as any).phoneNumber || "";
      setWhatsappNumber(formatWhatsAppNumber(phoneValue));
      if ((user as any).cpf) setCpf(formatCPF((user as any).cpf));

      if ((user as any).register) {
        setCrmNumber(String((user as any).register.number || ""));
        setCrmUf((user as any).register.uf || "AC");
      }

      if ((user as any).graduationYear)
        setGraduationYear(String((user as any).graduationYear));

      if (
        (user as any).moreRegisters &&
        Array.isArray((user as any).moreRegisters)
      ) {
        const normalized = (user as any).moreRegisters.map((r: any) => ({
          id: r.id,
          number: r.number ? String(r.number) : "",
          uf: (r.uf || "").toString(),
          description: r.description || "",
        }));
        setMoreRegisters(normalized);
      }
    }
  }, [user]);

  const addMoreRegister = () =>
    setMoreRegisters((prev) => [
      ...prev,
      { number: "", uf: "AC", description: "" },
    ]);
  const updateMoreRegister = (
    index: number,
    field: "number" | "uf" | "description",
    value: string,
  ) => {
    setMoreRegisters((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  };
  const removeMoreRegister = (index: number) => {
    setMoreRegisters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const hasChanges = () => {
    const originalPhoneValue =
      (user as any)?.whatsappNumber || (user as any)?.phoneNumber || "";
    const formattedOriginalPhone = formatWhatsAppNumber(originalPhoneValue);
    const originalCpf = (user as any)?.cpf ? formatCPF((user as any).cpf) : "";
    const originalCrmNumber = (user as any)?.register?.number
      ? String((user as any)?.register?.number)
      : "";
    const originalCrmUf = (user as any)?.register?.uf || "";
    const originalGradYear = (user as any)?.graduationYear
      ? String((user as any).graduationYear)
      : "";
    const originalRegsKey = (((user as any)?.moreRegisters || []) as any[])
      .map(
        (r) =>
          `${r.number || ""}-${(r.uf || "").toString().toUpperCase()}-${r.description || ""}`,
      )
      .sort()
      .join("|");
    const currentRegsKey = moreRegisters
      .filter((r) => r.number || r.uf || r.description)
      .map(
        (r) =>
          `${r.number}-${(r.uf || "").toUpperCase()}-${r.description || ""}`,
      )
      .sort()
      .join("|");

    return (
      name !== (user?.name || "") ||
      whatsappNumber !== formattedOriginalPhone ||
      !!selectedImageFile ||
      cpf !== originalCpf ||
      crmNumber !== originalCrmNumber ||
      crmUf.toUpperCase() !== originalCrmUf ||
      graduationYear !== originalGradYear ||
      originalRegsKey !== currentRegsKey
    );
  };

  const isWhatsAppValid =
    whatsappNumber.trim() && validateWhatsAppNumber(whatsappNumber);
  const canSave = hasChanges() && isWhatsAppValid && !isSaving;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.warning("Por favor, informe seu nome.");
      return;
    }
    if (!whatsappNumber.trim()) {
      toast.warning("Por favor, informe seu número do WhatsApp.");
      return;
    }
    if (!validateWhatsAppNumber(whatsappNumber)) {
      toast.warning("Por favor, informe um número de WhatsApp válido com DDD.");
      return;
    }
    if (cpf && !validateCPF(cpf)) {
      toast.warning("Informe um CPF válido (11 dígitos).");
      return;
    }
    if (
      (crmNumber && !/^[0-9]+$/.test(crmNumber)) ||
      (crmUf && crmUf.trim().length !== 2)
    ) {
      toast.warning("Informe CRM numérico e UF com 2 letras.");
      return;
    }
    if (graduationYear && !/^[0-9]{4}$/.test(graduationYear)) {
      toast.warning("Informe o ano de formatura com 4 dígitos.");
      return;
    }

    const hasIncompleteRQE = moreRegisters.some(
      (r) =>
        (r.number || r.uf || r.description) &&
        (!r.number ||
          !/^[0-9]+$/.test(r.number) ||
          !r.uf ||
          r.uf.trim().length !== 2),
    );
    if (hasIncompleteRQE) {
      toast.warning(
        "Preencha número (apenas dígitos) e UF (2 letras) para cada RQE ou remova a linha.",
      );
      return;
    }

    setIsSaving(true);
    try {
      const updateData: any = {
        name: name.trim(),
        whatsappNumber: whatsappNumber.replace(/\D/g, ""),
        cpf: cpf ? cpf.replace(/\D/g, "") : null,
        graduationYear: graduationYear ? Number(graduationYear) : null,
        register:
          crmNumber || crmUf
            ? {
                type: "CRM",
                number: crmNumber ? Number(crmNumber) : null,
                uf: crmUf ? crmUf.toUpperCase() : null,
              }
            : null,
        moreRegisters: moreRegisters
          .filter((r) => r.number && r.uf)
          .map((r) => ({
            type: "RQE",
            number: Number(r.number),
            uf: (r.uf || "").toUpperCase(),
            description: r.description || null,
          })),
      };

      if (selectedImageFile) {
        const mediaUpload = createMediaUploadService();
        const result = await mediaUpload.upload(
          selectedImageFile,
          selectedImageFile.name,
          selectedImageFile.type,
        );
        if (result.success && result.data && (result.data as any).id) {
          updateData.profilePicture = (result.data as any).id;
        }
      }

      await authService.updateProfile(updateData);
      await authService.refreshUser();
      toast.success("Seus dados foram salvos com sucesso.");
    } catch (error: any) {
      toast.error(
        "Não foi possível salvar as alterações. " + (error.message || ""),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getAvatarUrl = () => {
    if (previewImage) return previewImage;
    if (user && (user as any).profilePicture) {
      const pic = (user as any).profilePicture;
      if (typeof pic === "string") return pic;
      if (typeof pic === "object" && pic?.url) {
        let url = pic.url;
        if (url.includes("/api/api")) url = url.replace("/api/api", "/api");
        const apiBaseUrl =
          import.meta.env.VITE_APP_WEB_CLOUD_URL || "http://localhost:3000/api";
        const baseWithoutApi = apiBaseUrl.replace(/\/api$/, "");
        return url.startsWith("http") ? url : `${baseWithoutApi}${url}`;
      }
    }
    return undefined;
  };

  const getInitials = () => {
    return formatName(name, "initials");
  };

  return {
    state: {
      name,
      setName,
      whatsappNumber,
      setWhatsappNumber,
      cpf,
      setCpf,
      crmNumber,
      setCrmNumber,
      crmUf,
      setCrmUf,
      graduationYear,
      setGraduationYear,
      moreRegisters,
      isSaving,
      canSave,
      user,
      avatarUrl: getAvatarUrl(),
      initials: getInitials(),
    },
    actions: {
      handleSave,
      handleImageClick,
      handleImageChange,
      addMoreRegister,
      updateMoreRegister,
      removeMoreRegister,
    },
    refs: {
      fileInputRef,
    },
  };
}

export default function Profile() {
  const isMobile = useIsMobile();
  const editor = useProfileEditor();
  const { state, actions, refs } = editor;

  const mobileRightAction = (
    <Button
      variant="ghost"
      size="sm"
      className="text-accent font-medium hover:bg-transparent"
      onClick={actions.handleSave}
      disabled={!state.canSave}
    >
      {state.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
    </Button>
  );

  const renderPersonalDataForm = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Nome completo</Label>
        <Input
          id="name"
          value={state.name}
          className={"border border-border"}
          onChange={(e) => state.setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          placeholder="000.000.000-00"
          value={state.cpf}
          className={"border border-border"}
          onChange={(e) => state.setCpf(formatCPF(e.target.value))}
          maxLength={14}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Número do WhatsApp</Label>
        <Input
          id="phone"
          placeholder="(11) 99999-9999"
          value={state.whatsappNumber}
          className={"border border-border"}
          onChange={(e) =>
            state.setWhatsappNumber(formatWhatsAppNumber(e.target.value))
          }
          maxLength={15}
        />
        <p className="text-xs text-muted-foreground">
          Este número será usado para contato em ofertas de trabalho
        </p>
      </div>
    </>
  );

  const renderProfessionalForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="space-y-2">
        <Label htmlFor="crm">CRM (número)</Label>
        <Input
          id="crm"
          placeholder="123456"
          value={state.crmNumber}
          className={"border border-border"}
          onChange={(e) =>
            state.setCrmNumber(e.target.value.replace(/\D/g, ""))
          }
          maxLength={7}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="uf">UF</Label>
        <Select value={state.crmUf} onValueChange={state.setCrmUf} >
          <SelectTrigger id="uf" className={"bg-card border border-border"}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UFS.map((uf) => (
              <SelectItem key={uf} value={uf}>
                {uf}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="formatura">Formatura</Label>
        <Input
          id="formatura"
          placeholder="YYYY"
          value={state.graduationYear}
          className={"border border-border"}
          onChange={(e) =>
            state.setGraduationYear(
              e.target.value.replace(/\D/g, "").slice(0, 4),
            )
          }
          maxLength={4}
        />
      </div>
    </div>
  );

  const renderSpecialtiesForm = () => (
    <div className="space-y-4">
      {state.moreRegisters.map((reg, idx) => (
        <div
          key={idx}
          className="bg-muted/30 p-4 rounded-lg border border-border space-y-3 relative"
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
            onClick={() => actions.removeMoreRegister(idx)}
          >
            <X className="w-4 h-4" />
          </Button>
          <div className="space-y-2 pr-8">
            <Label>Descrição</Label>
            <Input
              placeholder="Ex.: Cardiologia, UTI"
              value={reg.description || ""}
              onChange={(e) =>
                actions.updateMoreRegister(idx, "description", e.target.value)
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>RQE</Label>
              <Input
                placeholder="123456"
                value={reg.number}
                onChange={(e) =>
                  actions.updateMoreRegister(
                    idx,
                    "number",
                    e.target.value.replace(/\D/g, ""),
                  )
                }
                maxLength={7}
              />
            </div>
            <div className="space-y-2">
              <Label>UF</Label>
              <Select
                value={reg.uf || "AC"}
                onValueChange={(val) =>
                  actions.updateMoreRegister(idx, "uf", val)
                }
              >
                <SelectTrigger className={"bg-card border border-border"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UFS.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={actions.addMoreRegister}
        className="w-full py-3 text-center text-lime-500 font-medium border-2 border-dashed border-lime-500 rounded-lg hover:bg-lime-muted transition-colors"
      >
        Adicionar especialidade
      </button>
    </div>
  );

  const renderSharedContent = () => (
    <>
      <input
        type="file"
        ref={refs.fileInputRef}
        onChange={actions.handleImageChange}
        accept="image/*"
        className="hidden"
      />

      {!isMobile && (
        <div className="bg-card rounded-md p-6 border border-border shadow-card mb-6 flex items-center gap-6">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage
                src={state.avatarUrl}
                style={{ objectFit: "cover" }}
              />
              <AvatarFallback className="bg-accent text-accent-foreground text-2xl font-bold">
                {state.initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={actions.handleImageClick}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">
              {state.name || "Usuário"}
            </h3>
            <p className="text-muted-foreground">{state.user?.email}</p>
            <Button
              variant="link"
              className="p-0 h-auto text-lime-500"
              onClick={actions.handleImageClick}
            >
              Alterar foto
            </Button>
          </div>
        </div>
      )}

      {isMobile && (
        <div className="flex flex-col items-center py-6 bg-card border-b border-border">
          <div className="relative mb-3">
            <Avatar className="w-24 h-24">
              <AvatarImage
                src={state.avatarUrl}
                style={{ objectFit: "cover" }}
              />
              <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-semibold">
                {state.initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={actions.handleImageClick}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Toque para alterar a foto
          </p>
        </div>
      )}

      <div className={isMobile ? "px-4 py-6 space-y-6" : "space-y-6"}>
        <div
          className={
            isMobile
              ? "space-y-4"
              : "bg-card rounded-md p-6 border border-border shadow-card"
          }
        >
          {!isMobile && (
            <h3 className="font-semibold text-foreground mb-4">
              Dados pessoais
            </h3>
          )}
          <div className={isMobile ? "space-y-4" : "grid md:grid-cols-2 gap-4"}>
            {renderPersonalDataForm()}
          </div>
        </div>

        <div
          className={
            isMobile
              ? "space-y-4"
              : "bg-card rounded-md p-6 border border-border shadow-card"
          }
        >
          <h3
            className={
              isMobile
                ? "font-semibold text-primary"
                : "font-semibold text-foreground mb-4"
            }
          >
            Registro profissional
          </h3>
          {renderProfessionalForm()}
        </div>

        <div
          className={
            isMobile
              ? "space-y-4"
              : "bg-card rounded-md p-6 border border-border shadow-card"
          }
        >
          {!isMobile && (
            <h3 className="font-semibold text-foreground mb-4">
              Especialidades
            </h3>
          )}
          {isMobile && (
            <h3 className="font-bold">Especialidade</h3>
          )}
          {renderSpecialtiesForm()}
        </div>

        {!isMobile && (
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
              disabled={state.isSaving}
            >
              Cancelar
            </Button>
            <Button
              className="btn-lime"
              onClick={actions.handleSave}
              disabled={!state.canSave}
            >
              {state.isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <MainLayout
      mobileTitle="Editar Profile"
      showMobileBack
      mobileRightAction={mobileRightAction}
    >
      {!isMobile ? (
        <div className="page-container max-w-3xl">
          <div className="page-header">
            <h1 className="page-title">Meu perfil</h1>
            <p className="page-subtitle">
              Gerencie suas informações pessoais e profissionais
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {renderSharedContent()}
          </motion.div>
        </div>
      ) : (
        <div className="pb-8">{renderSharedContent()}</div>
      )}
    </MainLayout>
  );
}
