import { useEffect } from "react";
import { Box } from "@mui/system";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import type { LatLng } from "../hooks/useAddressGeocoding";
import { Colors } from "../../../theme";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
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
}

const LocationMap = ({ position, onLocationSelect }: LocationMapProps) => {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
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
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationSelect={onLocationSelect} />
        {position && (
          <>
            <Recenter position={position} />
            <Marker position={position} />
          </>
        )}
      </MapContainer>
    </Box>
  );
};

export default LocationMap;
