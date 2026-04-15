"use client";

import { useState, useEffect } from "react";
import { Download, FileText, Users, Calendar, Loader2, FileCheck, Send, ExternalLink, Copy, CheckCircle, Link2 } from "lucide-react";
import { generateNdaPDF } from "@/lib/ndaGenerator";

interface Interviniente {
  nombre: string;
  dni: string;
  email: string;
  rol: string;
}

interface NDA {
  id: string;
  fecha: string;
  estado: string;
  pdf_url: string | null;
  created_at: string;
  notas: string | null;
  nda_intervinientes?: Interviniente[];
}

export default function NDAForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [ndas, setNdas] = useState<NDA[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [lastSaved, setLastSaved] = useState<any>(null);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [signingUrls, setSigningUrls] = useState<Map<string, { email: string; url: string }[]>>(new Map());
  const [adobeConnected, setAdobeConnected] = useState<boolean | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [fecha, setFecha] = useState(new Date().toLocaleDateString("es-ES"));
  const [intervinientes, setIntervinientes] = useState<Interviniente[]>([
    { nombre: "Alicia Hernández Ruiz", dni: "09192093M", email: "alicia@aleasignature.com", rol: "Representante Alea Signature" },
    { nombre: "Alberto Hernández Gala", dni: "14301422E", email: "albertogala@aleasignature.com", rol: "Representante Alea Signature" },
  ]);

  useEffect(() => {
    fetchNdas();
    checkAdobeConnection();
    checkAdobeCallback();
  }, []);

  const checkAdobeConnection = async () => {
    try {
      const res = await fetch("/api/auth/adobe/status");
      if (res.ok) {
        const data = await res.json();
        setAdobeConnected(data.connected);
      }
    } catch (error) {
      console.error("Error checking Adobe connection:", error);
    }
  };

  const checkAdobeCallback = () => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("adobe_connected");
    const error = params.get("adobe_error");
    if (connected === "true") {
      setAdobeConnected(true);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      alert(`Error conectando con Adobe Sign: ${error}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  };

  const handleConnectAdobe = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch("/api/auth/adobe");
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.authUrl;
      } else {
        alert("Error obteniendo URL de autorización");
      }
    } catch (error) {
      console.error("Error connecting to Adobe:", error);
      alert("Error al conectar con Adobe Sign");
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchNdas = async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch("/api/nda");
      if (res.ok) {
        const data = await res.json();
        setNdas(data.ndas || []);
      }
    } catch (error) {
      console.error("Error fetching NDAs:", error);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleAddInterviniente = () => {
    setIntervinientes([...intervinientes, { nombre: "", dni: "", email: "", rol: "" }]);
  };

  const handleRemoveInterviniente = (index: number) => {
    if (intervinientes.length > 2) {
      setIntervinientes(intervinientes.filter((_, i) => i !== index));
    }
  };

  const handleChange = (index: number, field: keyof Interviniente, value: string) => {
    const updated = [...intervinientes];
    updated[index][field] = value;
    setIntervinientes(updated);
  };

  const downloadPdf = (base64: string, fileName: string) => {
    const linkSource = `data:application/pdf;base64,${base64}`;
    const downloadLink = document.createElement("a");
    downloadLink.href = linkSource;
    downloadLink.download = fileName;
    downloadLink.click();
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const { base64, fileName } = await generateNdaPDF(intervinientes, fecha);

      const res = await fetch("/api/nda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha,
          intervinientes,
          pdfBase64: base64,
          fileName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLastSaved(data.nda);
        downloadPdf(base64, fileName);
        await fetchNdas();
      } else {
        console.error("Error saving NDA to database");
        downloadPdf(base64, fileName);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendForSignature = async (nda: NDA) => {
    if (!nda.nda_intervinientes?.length) {
      alert("El NDA no tiene intervinientes");
      return;
    }

    const missingEmails = nda.nda_intervinientes.filter(i => !i.email);
    if (missingEmails.length > 0) {
      alert(`Faltan emails en los intervinientes: ${missingEmails.map(i => i.nombre).join(", ")}`);
      return;
    }

    setSendingIds(prev => new Set(prev).add(nda.id));

    try {
      const { base64, fileName } = await generateNdaPDF(
        nda.nda_intervinientes!,
        nda.fecha
      );

      const res = await fetch("/api/nda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_for_signature",
          ndaId: nda.id,
          intervinientes: nda.nda_intervinientes,
          pdfBase64: base64,
          fileName,
        }),
      });

      const data = await res.json();

      if (res.ok && data.signingUrls) {
        setSigningUrls(prev => new Map(prev).set(nda.id, data.signingUrls));
        await fetchNdas();
      } else {
        alert(`Error enviando a Adobe Sign: ${data.error}`);
      }
    } catch (error) {
      console.error("Error sending for signature:", error);
      alert("Error al enviar para firma");
    } finally {
      setSendingIds(prev => {
        const next = new Set(prev);
        next.delete(nda.id);
        return next;
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isValid = intervinientes.every(
    (i) => i.nombre.trim() && i.dni.trim() && i.email.trim()
  );

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente_firma":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pendiente Firma</span>;
      case "firmado":
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Firmado</span>;
      case "enviado":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Enviado a Firma</span>;
      case "borrador":
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Borrador</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{estado}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-lg">Acuerdo de Confidencialidad (NDA)</h3>
            <p className="text-sm text-muted-foreground">Genera y envía NDAs para firma electrónica</p>
          </div>
          <div className="flex items-center gap-2">
            {adobeConnected === null ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : adobeConnected ? (
              <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                <CheckCircle className="w-3 h-3" />
                Adobe Conectado
              </span>
            ) : (
              <button
                onClick={handleConnectAdobe}
                disabled={isConnecting}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Link2 className="w-3 h-3" />
                    Conectar Adobe Sign
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Fecha del documento
            </label>
            <input
              type="text"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-border bg-background"
              placeholder="Ej: 15 de Abril de 2026"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Users className="w-4 h-4" />
              Intervinientes ({intervinientes.length})
            </label>
            <button
              onClick={handleAddInterviniente}
              className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              + Añadir
            </button>
          </div>

          {intervinientes.map((interviniente, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50"
            >
              <div className="md:col-span-1">
                <label className="block text-xs text-muted-foreground mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={interviniente.nombre}
                  onChange={(e) => handleChange(index, "nombre", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  placeholder="Nombre y apellidos"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs text-muted-foreground mb-1">DNI/NIE</label>
                <input
                  type="text"
                  value={interviniente.dni}
                  onChange={(e) => handleChange(index, "dni", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  placeholder="12345678A"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs text-muted-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={interviniente.email}
                  onChange={(e) => handleChange(index, "email", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div className="md:col-span-1 flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Rol</label>
                  <input
                    type="text"
                    value={interviniente.rol}
                    onChange={(e) => handleChange(index, "rol", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                    placeholder="Rol / Empresa"
                  />
                </div>
                {intervinientes.length > 2 && (
                  <button
                    onClick={() => handleRemoveInterviniente(index)}
                    className="px-2 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <button
            onClick={handleGeneratePDF}
            disabled={!isValid || isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Crear NDA
              </>
            )}
          </button>
          {!isValid && (
            <span className="text-sm text-muted-foreground">
              Rellena todos los campos de los intervinientes
            </span>
          )}
        </div>

        {lastSaved && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">¡NDA creado correctamente!</p>
              <p className="text-xs text-green-600">ID: {lastSaved.id}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg">NDAs Creados</h3>
          <button
            onClick={fetchNdas}
            className="text-xs px-3 py-1 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            Actualizar
          </button>
        </div>

        {isLoadingList ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : ndas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay NDAs creados todavía
          </p>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {ndas.map((nda) => (
              <div key={nda.id} className="border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{nda.fecha}</p>
                      {getEstadoBadge(nda.estado)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {nda.nda_intervinientes?.map((i) => `${i.nombre} (${i.email})`).join(", ") || "Sin intervinientes"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Creado: {new Date(nda.created_at).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {nda.pdf_url && (
                      <a
                        href={nda.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                        title="Ver PDF"
                      >
                        <FileText className="w-4 h-4 text-primary" />
                      </a>
                    )}
                    {(nda.estado === "pendiente_firma" || nda.estado === "borrador") && (
                      <button
                        onClick={() => handleSendForSignature(nda)}
                        disabled={sendingIds.has(nda.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {sendingIds.has(nda.id) ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            Enviar a Firma
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {signingUrls.has(nda.id) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-medium text-blue-800">Enlaces de firma (válidos 7 días):</p>
                    {signingUrls.get(nda.id)?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white rounded-lg p-2">
                        <span className="text-xs flex-1 truncate">{item.email}</span>
                        <button
                          onClick={() => copyToClipboard(item.url)}
                          className="p-1 hover:bg-blue-100 rounded"
                          title="Copiar enlace"
                        >
                          <Copy className="w-3 h-3 text-blue-600" />
                        </button>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-blue-100 rounded"
                          title="Firmar"
                        >
                          <ExternalLink className="w-3 h-3 text-blue-600" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-muted/30 border border-border rounded-2xl p-4">
        <h4 className="text-sm font-medium mb-2">Información importante</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Los NDAs se guardan en la base de datos de Alea Signature</li>
          <li>• El PDF se almacena en Adobe Sign para firma electrónica</li>
          <li>• Los enlaces de firma son válidos por 7 días</li>
          <li>• Duración de confidencialidad: 2 años desde la fecha del documento</li>
        </ul>
      </div>
    </div>
  );
}
