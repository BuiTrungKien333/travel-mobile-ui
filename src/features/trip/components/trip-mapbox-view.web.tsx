import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { Map as MapboxMap } from "mapbox-gl-web";
import "mapbox-gl-web/mapbox-gl.css";
import { useReducedMotion } from "react-native-reanimated";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  TRIP_MAP_STYLE,
  TRIP_MAP_DEFAULT_CENTER,
  TRIP_MAP_DEFAULT_ZOOM,
  tripMapBounds,
  type TripMapViewProps,
} from "../utils/trip-mapbox";

export function TripMapboxView({
  token,
  pins,
  path,
  focusedId,
  onSelect,
  onUnavailable,
}: TripMapViewProps) {
  const theme = useAppTheme();
  const reducedMotion = useReducedMotion();
  const container = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapboxMap>();
  const module = useRef<typeof import("mapbox-gl-web").default>(null);
  const firstPin = useEffectEvent(() => pins[0]);
  const select = useEffectEvent(onSelect);
  const controlInset = useEffectEvent(() => ({
    right: theme.spacing.sm,
    bottom: theme.layout.compactTouchTarget + theme.spacing.sm * 2,
    width: theme.layout.compactTouchTarget,
    gap: theme.spacing.xs,
  }));

  useEffect(() => {
    let current: MapboxMap | undefined;
    let observer: ResizeObserver | undefined;
    let controls: HTMLDivElement | undefined;
    let cancelled = false;
    const fail = () => {
      if (!cancelled) onUnavailable();
    };
    void import("mapbox-gl-web")
      .then(({ default: mapbox }) => {
        if (cancelled || !container.current) return;
        if (!mapbox.supported()) {
          fail();
          return;
        }
        const first = firstPin();
        const view = new mapbox.Map({
          accessToken: token,
          container: container.current,
          style: TRIP_MAP_STYLE,
          center: first
            ? [first.longitude, first.latitude]
            : TRIP_MAP_DEFAULT_CENTER,
          zoom: first ? 14 : TRIP_MAP_DEFAULT_ZOOM,
          dragRotate: false,
          pitchWithRotate: false,
          scrollZoom: false,
          attributionControl: false,
        });
        current = view;
        module.current = mapbox;
        view.addControl(
          new mapbox.AttributionControl({ compact: true }),
          "bottom-left",
        );
        const inset = controlInset();
        controls = document.createElement("div");
        Object.assign(controls.style, {
          position: "absolute",
          right: `${inset.right}px`,
          bottom: `${inset.bottom}px`,
          width: `${inset.width}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: `${inset.gap}px`,
        });
        container.current.appendChild(controls);
        const mapControls = [
          new mapbox.NavigationControl({ showCompass: false }),
          new mapbox.GeolocateControl(),
        ];
        for (const control of mapControls) {
          view.addControl(control, "bottom-right");
          const element = container.current.querySelector<HTMLDivElement>(
            ".mapboxgl-ctrl-bottom-right > .mapboxgl-ctrl-group",
          );
          if (element) {
            element.style.margin = "0";
            controls.appendChild(element);
          }
        }
        view.once("load", () => {
          if (!cancelled) setMap(view);
        });
        view.on("error", () => {
          if (!view.isStyleLoaded()) fail();
        });
        observer = new ResizeObserver(() => view.resize());
        observer.observe(container.current);
      })
      .catch(fail);
    return () => {
      cancelled = true;
      observer?.disconnect();
      current?.remove();
      controls?.remove();
      module.current = null;
    };
  }, [token, onUnavailable]);

  useEffect(() => {
    const mapbox = module.current;
    if (!map || !mapbox) return;
    const markers = pins.map((pin) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(pin.number);
      button.setAttribute("aria-label", `${pin.number}. ${pin.name}`);
      button.setAttribute("aria-pressed", String(pin.id === focusedId));
      Object.assign(button.style, {
        width: `${theme.layout.touchTarget}px`,
        height: `${theme.layout.touchTarget}px`,
        borderRadius: "50%",
        border: `2px solid ${theme.colors.onHero}`,
        color: theme.colors.onHero,
        background:
          pin.id === focusedId
            ? theme.colors.primaryText
            : theme.colors.heroSurface,
        cursor: "pointer",
        fontFamily: theme.typography.fontFamily.semibold,
      });
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        select(pin.id);
      });
      return new mapbox.Marker({ element: button })
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(map);
    });
    if (path.length > 1) {
      map.addSource("trip-route", {
        type: "geojson",
        data: { type: "LineString", coordinates: path },
      });
      map.addLayer({
        id: "trip-route-line",
        type: "line",
        source: "trip-route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": theme.colors.primaryText, "line-width": 5 },
      });
    }
    const bounds = tripMapBounds(pins, path);
    const focus = pins.find((p) => p.id === focusedId);
    const duration = reducedMotion ? 0 : theme.motion.tabTransitionDuration;
    if (focus)
      map.easeTo({
        center: [focus.longitude, focus.latitude],
        zoom: 15,
        duration,
      });
    else if (bounds)
      map.fitBounds(bounds, {
        padding: theme.spacing.section,
        maxZoom: 15,
        duration,
      });
    else
      map.easeTo({
        center: TRIP_MAP_DEFAULT_CENTER,
        zoom: TRIP_MAP_DEFAULT_ZOOM,
        duration,
      });
    return () => {
      markers.forEach((marker) => marker.remove());
      // The mount effect can remove the map before this cleanup runs.
      if (module.current && map.getLayer("trip-route-line"))
        map.removeLayer("trip-route-line");
      if (module.current && map.getSource("trip-route"))
        map.removeSource("trip-route");
    };
  }, [map, pins, path, focusedId, reducedMotion, theme]);

  return <div ref={container} style={{ width: "100%", height: "100%" }} />;
}
