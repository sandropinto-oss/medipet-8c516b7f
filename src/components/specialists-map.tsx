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
  distanceKm?: number | null;
}

interface Props {
  specialists: MapSpecialist[];
  className?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  /** "discovery" shows all specialists; "stay" pins the single specialist's home with a highlighted marker. */
  mode?: "discovery" | "stay";
  /** Optional tutor location pin (rendered as a small blue dot). */
  userLocation?: { lat: number; lng: number } | null;
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

const HOUSE_ICON_SVG =
  'data:image/svg+xml;utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="68" viewBox="0 0 56 68">
      <defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.35"/></filter></defs>
      <path filter="url(#s)" fill="#0ea5e9" stroke="white" stroke-width="3" d="M28 2c12 0 22 9.4 22 21 0 16-22 41-22 41S6 39 6 23C6 11.4 16 2 28 2z"/>
      <path fill="white" d="M28 14l11 9v13H17V23z"/>
      <path fill="#0ea5e9" d="M25 28h6v8h-6z"/>
    </svg>`,
  );

export function SpecialistsMap({
  specialists,
  className,
  center,
  zoom = 12,
  mode = "discovery",
  userLocation,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
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
          gestureHandling: "greedy",
          styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Erro no mapa.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Specialist markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !(window as any).google) return;
    const g = (window as any).google as typeof google;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }

    if (specialists.length === 0) return;

    if (mode === "stay") {
      const s = specialists[0];
      const pos = { lat: s.latitude, lng: s.longitude };
      const marker = new g.maps.Marker({
        position: pos,
        map,
        title: `${s.name} — seu pet está aqui`,
        icon: {
          url: HOUSE_ICON_SVG,
          scaledSize: new g.maps.Size(56, 68),
          anchor: new g.maps.Point(28, 64),
        },
        zIndex: 999,
      });
      const info = new g.maps.InfoWindow({
        content: `<div style="font-family:system-ui;font-size:13px;min-width:180px">
          <strong>${escapeHtml(s.name)}</strong><br/>
          <span style="color:#0ea5e9;font-weight:600">🐾 Seu pet está hospedado aqui</span><br/>
          <span style="color:#666;font-size:11px">Monitoramento 24h</span>
        </div>`,
      });
      marker.addListener("click", () => info.open({ anchor: marker, map }));
      info.open({ anchor: marker, map });
      markersRef.current.push(marker);

      circleRef.current = new g.maps.Circle({
        map,
        center: pos,
        radius: 180,
        strokeColor: "#0ea5e9",
        strokeOpacity: 0.6,
        strokeWeight: 2,
        fillColor: "#0ea5e9",
        fillOpacity: 0.12,
      });

      map.setCenter(pos);
      map.setZoom(15);
      return;
    }

    const bounds = new g.maps.LatLngBounds();
    specialists.forEach((s) => {
      const marker = new g.maps.Marker({
        position: { lat: s.latitude, lng: s.longitude },
        map,
        title: s.name,
      });
      const distLine = s.distanceKm != null ? `<span style="color:#0ea5e9;font-size:11px">${s.distanceKm.toFixed(1)} km</span><br/>` : "";
      const info = new g.maps.InfoWindow({
        content: `<div style="font-family:system-ui;font-size:13px;min-width:160px">
          <strong>${escapeHtml(s.name)}</strong><br/>
          ${s.specialty ? `<span style="color:#666">${escapeHtml(s.specialty)}</span><br/>` : ""}
          ${distLine}
          ${s.pricePerDay ? `<span style="color:#0ea5e9;font-weight:600">R$ ${s.pricePerDay}/dia</span>` : ""}
        </div>`,
      });
      marker.addListener("click", () => info.open({ anchor: marker, map }));
      markersRef.current.push(marker);
      bounds.extend(marker.getPosition()!);
    });

    if (userLocation) bounds.extend(userLocation);

    if (specialists.length === 1 && !userLocation) {
      map.setCenter({ lat: specialists[0].latitude, lng: specialists[0].longitude });
      map.setZoom(13);
    } else {
      map.fitBounds(bounds, 60);
    }
  }, [specialists, mode, userLocation]);

  // User location dot
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !(window as any).google) return;
    const g = (window as any).google as typeof google;
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
    if (!userLocation || mode === "stay") return;
    userMarkerRef.current = new g.maps.Marker({
      position: userLocation,
      map,
      title: "Sua localização",
      icon: {
        path: g.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#2563eb",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      },
      zIndex: 1000,
    });
  }, [userLocation, mode]);

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
