import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload as UploadIcon, FileText, Image, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [accountType, setAccountType] = useState<"bank" | "credit_card">("bank");
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>();
  const [selectedCardId, setSelectedCardId] = useState<number | undefined>();
  const [uploading, setUploading] = useState(false);

  const { data: accounts } = trpc.accounts.list.useQuery();
  const { data: creditCards } = trpc.creditCards.list.useQuery();
  const { data: uploadedFiles, refetch: refetchFiles } = trpc.files.list.useQuery();
  const uploadMutation = trpc.files.upload.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileType = file.type;
      if (fileType === "application/pdf" || fileType.startsWith("image/")) {
        setSelectedFile(file);
      } else {
        toast.error("Solo se permiten archivos PDF o imágenes");
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Por favor selecciona un archivo");
      return;
    }

    if (accountType === "bank" && !selectedAccountId) {
      toast.error("Por favor selecciona una cuenta bancaria");
      return;
    }

    if (accountType === "credit_card" && !selectedCardId) {
      toast.error("Por favor selecciona una tarjeta de crédito");
      return;
    }

    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result?.toString().split(",")[1];
        if (!base64) {
          toast.error("Error al procesar el archivo");
          setUploading(false);
          return;
        }

        const fileType = selectedFile.type === "application/pdf" ? "pdf" : "image";

        await uploadMutation.mutateAsync({
          fileName: selectedFile.name,
          fileType,
          fileData: base64,
          accountId: accountType === "bank" ? selectedAccountId : undefined,
          creditCardId: accountType === "credit_card" ? selectedCardId : undefined,
          accountType,
        });

        toast.success("Archivo subido correctamente. Procesando transacciones...");
        setSelectedFile(null);
        setSelectedAccountId(undefined);
        setSelectedCardId(undefined);
        refetchFiles();
        setUploading(false);
      };

      reader.onerror = () => {
        toast.error("Error al leer el archivo");
        setUploading(false);
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error("Error al subir el archivo");
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "processing":
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado";
      case "failed":
        return "Fallido";
      case "processing":
        return "Procesando";
      default:
        return "Pendiente";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Subir Estados de Cuenta</h1>
        <p className="text-muted-foreground mt-1">
          Sube tus estados de cuenta en PDF o capturas de pantalla para extraer transacciones automáticamente
        </p>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Nuevo Archivo</CardTitle>
          <CardDescription>
            Selecciona un archivo PDF o imagen de tu estado de cuenta bancario o tarjeta de crédito
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Cuenta</Label>
            <Select value={accountType} onValueChange={(value: "bank" | "credit_card") => setAccountType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Cuenta Bancaria</SelectItem>
                <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {accountType === "bank" && (
            <div className="space-y-2">
              <Label>Cuenta Bancaria</Label>
              <Select
                value={selectedAccountId?.toString()}
                onValueChange={(value) => setSelectedAccountId(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name} - {account.bankName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {accountType === "credit_card" && (
            <div className="space-y-2">
              <Label>Tarjeta de Crédito</Label>
              <Select
                value={selectedCardId?.toString()}
                onValueChange={(value) => setSelectedCardId(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una tarjeta" />
                </SelectTrigger>
                <SelectContent>
                  {creditCards?.map((card) => (
                    <SelectItem key={card.id} value={card.id.toString()}>
                      {card.name} - {card.bankName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Archivo</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <UploadIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedFile ? selectedFile.name : "Haz clic para seleccionar un archivo"}
                </p>
                <p className="text-xs text-muted-foreground">PDF o imágenes (JPG, PNG)</p>
              </label>
            </div>
          </div>

          <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <UploadIcon className="w-4 h-4 mr-2" />
                Subir y Procesar
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Archivos Subidos</CardTitle>
          <CardDescription>Historial de archivos procesados</CardDescription>
        </CardHeader>
        <CardContent>
          {uploadedFiles && uploadedFiles.length > 0 ? (
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    {file.fileType === "pdf" ? (
                      <FileText className="w-8 h-8 text-red-600" />
                    ) : (
                      <Image className="w-8 h-8 text-blue-600" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{file.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(file.createdAt).toLocaleDateString("es-MX")} -{" "}
                        {file.transactionsCount || 0} transacciones
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(file.processingStatus)}
                    <span className="text-sm font-medium">{getStatusText(file.processingStatus)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No has subido ningún archivo todavía
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
