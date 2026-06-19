/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

export interface MapSpecialist {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  specialty?: string | null;
  pricePerDay?: number | null;
}

interface Props {
  specialists: MapSpecialist[];
  className?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
}

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

let loaderPromise: Promise<typeof google> | null = null;

function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if ((window as any).google?.maps) return Promise.resolve((window as any).google);
  if (loaderPromise) return loaderPromise;
  if (!BROWSER_KEY) return Promise.reject(new Error("Chave do Google Maps ausente."));

  loaderPromise = new Promise((resolve, reject) => {
    (window as any).__initMediPetMap = () => resolve((window as any).google);
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key: BROWSER_KEY,
      loading: "async",
      callback: "__initMediPetMap",
      libraries: "marker",
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.onerror = () => reject(new Error("Falha ao carregar Google Maps."));
    document.head.appendChild(s);
  });
  return loaderPromise;
}

export function SpecialistsMap({ specialists, className, center, zoom = 12 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !ref.current) return;
        const fallback = center ?? { lat: -23.5505, lng: -46.6333 };
        mapRef.current = new g.maps.Map(ref.current, {
          center: fallback,
          zoom,
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] },
          ],
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Erro no mapa.");
        setLoading(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !(window as any).google) return;
    const g = (window as any).google as typeof google;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (specialists.length === 0) return;
    const bounds = new g.maps.LatLngBounds();

    specialists.forEach((s) => {
      const marker = new g.maps.Marker({
        position: { lat: s.latitude, lng: s.longitude },
        map,
        title: s.name,
      });
      const info = new g.maps.InfoWindow({
        content: `<div style="font-family:system-ui;font-size:13px;min-width:160px">
          <strong>${escapeHtml(s.name)}</strong><br/>
          ${s.specialty ? `<span style="color:#666">${escapeHtml(s.specialty)}</span><br/>` : ""}
          ${s.pricePerDay ? `<span style="color:#0ea5e9;font-weight:600">R$ ${s.pricePerDay}/dia</span>` : ""}
        </div>`,
      });
      marker.addListener("click", () => info.open({ anchor: marker, map }));
      markersRef.current.push(marker);
      bounds.extend(marker.getPosition()!);
    });

    if (specialists.length === 1) {
      map.setCenter({ lat: specialists[0].latitude, lng: specialists[0].longitude });
      map.setZoom(13);
    } else {
      map.fitBounds(bounds, 60);
    }
  }, [specialists]);

  return (
    <div className={className} style={{ position: "relative", minHeight: 280 }}>
      <div ref={ref} style={{ width: "100%", height: "100%", borderRadius: "inherit" }} />
      {loading && (
        <div className="absolute inset-0 grid place-items-center rounded-[inherit] bg-muted/50 text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Carregando mapa…</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 grid place-items-center rounded-[inherit] bg-muted/80 p-4 text-center text-sm text-muted-foreground">
          <span className="flex flex-col items-center gap-2"><MapPin className="h-5 w-5" /> {error}</span>
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
