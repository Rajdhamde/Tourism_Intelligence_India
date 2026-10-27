import type {
  DestinationListResponse,
  DestinationDetail,
  DestinationNearby,
  RecommendationRequest,
  RecommendationResponse,
  OverviewKPIs,
  SeasonalityDataPoint,
  ClusterAnalyticsItem,
  CategoryDistributionItem,
  StateDistributionItem,
  AIChatResponse
} from "../types";

const BASE_URL = "/api/v1";

export async function fetchDestinations(params?: {
  query?: string;
  state?: string;
  region?: string;
  category?: string;
  budget_tier?: string;
  page?: number;
  page_size?: number;
}): Promise<DestinationListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.query) searchParams.set("query", params.query);
  if (params?.state) searchParams.set("state", params.state);
  if (params?.region) searchParams.set("region", params.region);
  if (params?.category) searchParams.set("category", params.category);
  if (params?.budget_tier) searchParams.set("budget_tier", params.budget_tier);
  if (params?.page) searchParams.set("page", params.page.toString());
  if (params?.page_size) searchParams.set("page_size", params.page_size.toString());

  const res = await fetch(`${BASE_URL}/destinations?${searchParams.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch destinations: ${res.statusText}`);
  return res.json();
}

export async function fetchDestinationDetail(id: string): Promise<DestinationDetail> {
  const res = await fetch(`${BASE_URL}/destinations/${id}`);
  if (!res.ok) throw new Error(`Destination ${id} not found.`);
  return res.json();
}

export async function fetchNearbyDestinations(id: string, radiusKm = 450): Promise<DestinationNearby[]> {
  const res = await fetch(`${BASE_URL}/destinations/${id}/nearby?radius_km=${radiusKm}`);
  if (!res.ok) throw new Error("Failed to fetch nearby destinations");
  return res.json();
}

export async function fetchCategories(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/destinations/categories`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchRegions(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/destinations/regions`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchStates(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/destinations/states`);
  if (!res.ok) return [];
  return res.json();
}

export async function getRecommendations(payload: RecommendationRequest): Promise<RecommendationResponse> {
  const res = await fetch(`${BASE_URL}/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to fetch recommendations");
  return res.json();
}

export async function fetchOverviewKPIs(): Promise<OverviewKPIs> {
  const res = await fetch(`${BASE_URL}/analytics/overview`);
  if (!res.ok) throw new Error("Failed to fetch overview analytics");
  return res.json();
}

export async function fetchSeasonality(year?: number): Promise<SeasonalityDataPoint[]> {
  const url = year ? `${BASE_URL}/analytics/seasonality?year=${year}` : `${BASE_URL}/analytics/seasonality`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch seasonality");
  return res.json();
}

export async function fetchClusterAnalytics(): Promise<ClusterAnalyticsItem[]> {
  const res = await fetch(`${BASE_URL}/analytics/clusters`);
  if (!res.ok) throw new Error("Failed to fetch cluster analytics");
  return res.json();
}

export async function fetchCategoryAnalytics(): Promise<CategoryDistributionItem[]> {
  const res = await fetch(`${BASE_URL}/analytics/destinations`);
  if (!res.ok) throw new Error("Failed to fetch category analytics");
  return res.json();
}

export async function fetchStateAnalytics(): Promise<StateDistributionItem[]> {
  const res = await fetch(`${BASE_URL}/analytics/states`);
  if (!res.ok) throw new Error("Failed to fetch state analytics");
  return res.json();
}

export async function sendAssistantChat(message: string): Promise<AIChatResponse> {
  const res = await fetch(`${BASE_URL}/assistant/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });
  if (!res.ok) throw new Error("Assistant response failed");
  return res.json();
}

export async function recordInteraction(destinationId: string, interactionType = "view"): Promise<void> {
  try {
    await fetch(`${BASE_URL}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destination_id: destinationId,
        interaction_type: interactionType,
        source_channel: "web_frontend"
      })
    });
  } catch (err) {
    console.debug("Telemetry log non-blocking notice:", err);
  }
}
