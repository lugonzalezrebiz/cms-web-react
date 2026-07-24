import { useEffect, useRef, useState } from "react";
import axios from "axios";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const DEBOUNCE_MS = 800;
const SUGGESTION_LIMIT = 5;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface AddressSuggestion {
  id: string;
  label: string;
  position: LatLng;
}

export interface ResolvedLocation {
  address: string;
  city?: string;
  countryCode?: string;
}

interface NominatimAddress {
  road?: string;
  house_number?: string;
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  country_code?: string;
}

interface NominatimSearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

interface NominatimReverseResult {
  display_name: string;
  address?: NominatimAddress;
}

const buildShortAddress = (
  address: NominatimAddress | undefined,
  fallback: string,
): string => {
  if (!address) return fallback;
  const { road, house_number, suburb, neighbourhood, city_district } = address;
  if (road && house_number) return `${road} ${house_number}`;
  if (road) return road;
  return suburb || neighbourhood || city_district || fallback;
};

const pickCity = (address: NominatimAddress | undefined): string | undefined =>
  address?.city || address?.town || address?.village || address?.municipality;

const shortenDisplayName = (displayName: string): string =>
  displayName.split(",").slice(0, 2).join(",").trim();

const useAddressGeocoding = (
  address: string,
  onAddressResolved: (location: ResolvedLocation) => void,
) => {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const trimmed = address.trim();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await axios.get<NominatimSearchResult[]>(
          `${NOMINATIM_BASE_URL}/search`,
          {
            params: { format: "json", q: trimmed, limit: SUGGESTION_LIMIT },
            signal: controller.signal,
          },
        );
        setSuggestions(
          data.map((result) => ({
            id: String(result.place_id),
            label: shortenDisplayName(result.display_name),
            position: {
              lat: parseFloat(result.lat),
              lng: parseFloat(result.lon),
            },
          })),
        );
        const topResult = data[0];
        if (topResult) {
          setPosition({
            lat: parseFloat(topResult.lat),
            lng: parseFloat(topResult.lon),
          });
        }
      } catch {
        // Ignore geocoding errors (e.g. no results, network issue, aborted request).
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [address]);

  const selectSuggestion = (suggestion: AddressSuggestion) => {
    setPosition(suggestion.position);
    setSuggestions([]);
  };

  const handleLocationSelect = async (newPosition: LatLng) => {
    setPosition(newPosition);
    setSuggestions([]);
    try {
      const { data } = await axios.get<NominatimReverseResult>(
        `${NOMINATIM_BASE_URL}/reverse`,
        {
          params: {
            format: "json",
            lat: newPosition.lat,
            lon: newPosition.lng,
            addressdetails: 1,
          },
        },
      );
      const shortAddress = buildShortAddress(data.address, data.display_name);
      if (shortAddress) {
        skipNextSearch.current = true;
        onAddressResolved({
          address: shortAddress,
          city: pickCity(data.address),
          countryCode: data.address?.country_code,
        });
      }
    } catch {
      // Ignore reverse geocoding errors; keep the marker at its dropped position.
    }
  };

  const resetPosition = () => {
    skipNextSearch.current = false;
    setPosition(null);
    setSuggestions([]);
  };

  return {
    position,
    suggestions,
    isSearching,
    selectSuggestion,
    handleLocationSelect,
    resetPosition,
  };
};

export default useAddressGeocoding;
