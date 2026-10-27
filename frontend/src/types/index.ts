export interface Destination {
  destination_id: str;
  name: str;
  category: str;
  state: str;
  region: str;
  latitude: number;
  longitude: number;
  elevation_m: number;
  short_description: str;
  best_season: str;
  avg_visit_duration_days: number;
  estimated_budget_tier: str;
  typical_spend_inr: number;
  family_friendly: boolean;
  rating: number;
  review_count: number;
  popularity_score: number;
  cover_image: str;
}

export interface DestinationDetail extends Destination {
  detailed_description: str;
  highlights: string[];
  tags: string[];
  best_months: string[];
  accessibility_rating: number;
  gallery: string[];
  image_attribution: str;
  image_license: str;
  entry_fee_info: str;
  opening_hours_info: str;
  source_name: str;
  source_url: str;
  last_verified_date: str;
}

export interface DestinationNearby {
  destination_id: str;
  name: str;
  category: str;
  state: str;
  distance_km: number;
  rating: number;
  short_description: str;
  cover_image: str;
  latitude: number;
  longitude: number;
}

export interface DestinationListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: Destination[];
}

export interface RecommendationRequest {
  nature_affinity: number;
  culture_affinity: number;
  adventure_affinity: number;
  relaxation_affinity: number;
  wildlife_affinity: number;
  budget_tier: str;
  duration_days: number;
  target_month?: str;
  preferred_region?: str;
  preferred_category?: str;
  preferred_state?: str;
  exclude_visited_ids?: string[];
  top_k?: number;
}

export interface RecommendedItem {
  destination_id: str;
  name: str;
  category: str;
  state: str;
  region: str;
  latitude: number;
  longitude: number;
  elevation_m: number;
  short_description: str;
  cover_image: str;
  rating: number;
  estimated_budget_tier: str;
  typical_spend_inr: number;
  avg_visit_duration_days: number;
  best_season: str;
  highlights: string[];
  tags: string[];
  recommendation_score: number;
  component_scores: {
    content_similarity: number;
    cluster_affinity: number;
    seasonality_match: number;
    popularity_signal: number;
  };
  matched_interests: string[];
  evidence_rationale: str;
  source_attribution: str;
}

export interface RecommendationResponse {
  predicted_tourist_cluster: number;
  cluster_label: str;
  target_travel_month: str;
  total_candidates_evaluated: number;
  recommendations: RecommendedItem[];
  model_weights: {
    content_similarity_weight: number;
    cluster_affinity_weight: number;
    seasonality_weight: number;
    popularity_signal_weight: number;
  };
}

export interface OverviewKPIs {
  total_destinations: number;
  total_tracked_visits: number;
  total_tourist_profiles: number;
  total_interactions: number;
  avg_tourist_satisfaction: number;
  avg_estimated_spend_inr: number;
  avg_trip_duration_days: number;
  active_clusters_count: number;
  data_source_label: str;
}

export interface SeasonalityDataPoint {
  month_number: number;
  month_name: str;
  season: str;
  total_visits: number;
  avg_spend_inr: number;
  popular_category: str;
}

export interface ClusterAnalyticsItem {
  cluster_id: number;
  cluster_label: str;
  member_count: number;
  member_percentage: number;
  avg_spend_inr: number;
  avg_duration_days: number;
  feature_profile: {
    nature: number;
    culture: number;
    adventure: number;
    relaxation: number;
  };
  preferred_categories: string[];
  description: str;
}

export interface CategoryDistributionItem {
  category: str;
  destination_count: number;
  total_visits: number;
  avg_rating: number;
}

export interface StateDistributionItem {
  state: str;
  region: str;
  destination_count: number;
  total_visits: number;
  capital?: str;
}

export interface AIChatResponse {
  query: str;
  response: str;
  tool_calls: Array<{
    tool: str;
    arguments: Record<string, any>;
    [key: string]: any;
  }>;
  map_focus_points: Array<{
    name: str;
    coordinates: { latitude: number; longitude: number };
    destination_id: str;
  }>;
  recommended_destinations?: RecommendedItem[];
  itinerary?: any;
  citations: Array<{ source: str; url: str; verified_date: str }>;
  has_llm_key: boolean;
}

type str = string;
