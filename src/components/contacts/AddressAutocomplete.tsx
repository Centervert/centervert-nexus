import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "123 Main St, City, State 12345",
  className,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Get Mapbox token from environment
  const mapboxToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3 || !mapboxToken) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${mapboxToken}&country=US&types=address,place&limit=5`
      );
      const data = await response.json();
      setSuggestions(data.features || []);
      setIsOpen(true);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the API call
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: MapboxFeature) => {
    setInputValue(suggestion.place_name);
    onChange(suggestion.place_name);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleBlur = () => {
    // Update parent with current value on blur
    onChange(inputValue);
  };

  if (!mapboxToken) {
    // Fallback to regular input if no token
    return (
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-start gap-2 transition-colors"
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
            >
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <span className="flex-1">{suggestion.place_name}</span>
            </button>
          ))}
        </div>
      )}
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
