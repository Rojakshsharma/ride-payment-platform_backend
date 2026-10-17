
import { GOOGLE_MAPS_API_KEY } from "../config/googleMaps.js";

export async function getRouteDetails(pickup, destination) {
  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask":
          "routes.distanceMeters,routes.duration",
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: {
              latitude: pickup.latitude,
              longitude: pickup.longitude,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.latitude,
              longitude: destination.longitude,
            },
          },
        },
        travelMode: "DRIVE",
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Routes API failed: ${error}`);
  }

  const data = await response.json();
  const route = data.routes?.[0];

  if (!route) {
    throw new Error("No route found between these locations");
  }

  return {
    distanceMeters: route.distanceMeters,
    durationSeconds: Number.parseInt(route.duration, 10),
  };
}
