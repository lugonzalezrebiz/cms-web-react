import { useEffect } from "react";
import { Box } from "@mui/system";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLng } from "../hooks/useAddressGeocoding";
import { Colors } from "../../../theme";

const pinIcon = L.divIcon({
  className: "",
  html: `
    <svg width="34" height="36" viewBox="0 0 34 46" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="17" cy="43" rx="6" ry="2.2" fill="rgba(0,0,0,0.25)" />
      <path
        d="M17 0C7.6 0 0 7.6 0 17c0 12.4 17 29 17 29s17-16.6 17-29C34 7.6 26.4 0 17 0z"
        fill="#fa5f02"
      />
      <circle cx="17" cy="17" r="6.5" fill="#ffffff" />
    </svg>
  `,
  iconSize: [34, 46],
  iconAnchor: [17, 44],
});

const DEFAULT_CENTER: LatLng = { lat: 0, lng: 0 };
const DEFAULT_ZOOM = 2;
const FOUND_ZOOM = 16;

interface RecenterProps {
  position: LatLng;
}

const Recenter = ({ position }: RecenterProps) => {
  const map = useMap();
  useEffect(() => {
    map.setView(position, Math.max(map.getZoom(), FOUND_ZOOM));
  }, [map, position]);
  return null;
};

interface MapClickHandlerProps {
  onLocationSelect: (position: LatLng) => void;
}

const MapClickHandler = ({ onLocationSelect }: MapClickHandlerProps) => {
  useMapEvents({
    click(event) {
      onLocationSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
};

interface LocationMapProps {
  position: LatLng | null;
  onLocationSelect: (position: LatLng) => void;
  height?: string | number;
}

const LocationMap = ({
  position,
  onLocationSelect,
  height,
}: LocationMapProps) => {
  return (
    <Box
      sx={{
        width: "100%",
        height: height || "100%",
        minHeight: "360px",
        borderRadius: "8px",
        overflow: "hidden",
        border: `1px solid ${Colors.paleGray}`,
      }}
    >
      <MapContainer
        center={position ?? DEFAULT_CENTER}
        zoom={position ? FOUND_ZOOM : DEFAULT_ZOOM}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        <ZoomControl position="bottomright" />
        <MapClickHandler onLocationSelect={onLocationSelect} />
        {position && (
          <>
            <Recenter position={position} />
            <Marker position={position} icon={pinIcon} />
          </>
        )}
      </MapContainer>
    </Box>
  );
};

export default LocationMap;
