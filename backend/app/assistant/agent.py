import re
import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.assistant.tools import AssistantTools
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

class TourismAIAgent:
    def __init__(self, db: Session):
        self.db = db
        self.tools = AssistantTools(db)

    def _extract_destination_query(self, text: str) -> str:
        # Strip common stop phrases
        cleaned = re.sub(
            r"(?i)\b(tell me about|details of|information on|what is nearby|what is near|nearby|near|around|places to visit|attractions|visit|in|and|the|about)\b",
            " ",
            text
        )
        return " ".join(cleaned.split()).strip()

    def process_message(self, message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Processes user travel intent, executes backend tools, and generates
        a grounded, factual response with map coordinates, citations, and recommendations.
        """
        msg_clean = message.strip()
        msg_lower = msg_clean.lower()
        tool_calls_executed = []
        map_focus_points = []
        recommended_destinations = []
        itinerary_data = None
        factual_citations = []
        extracted_dest_term = self._extract_destination_query(msg_clean)

        # 1. Intent: Itinerary Request
        if "itinerary" in msg_lower or "plan a trip" in msg_lower or "plan" in msg_lower and ("day" in msg_lower or "tour" in msg_lower):
            # Extract number of days if mentioned
            days_match = re.search(r"(\d+)\s*(-|\s)?day", msg_lower)
            days = int(days_match.group(1)) if days_match else 4
            days = min(14, max(2, days))

            # Identify target state or region
            target_query = "Rajasthan"
            for state in ["rajasthan", "kerala", "uttarakhand", "himalayas", "goa", "ladakh", "meghalaya"]:
                if state in msg_lower:
                    target_query = state.capitalize()
                    break

            dests = self.tools.search_destinations(query=target_query, limit=3)
            tool_calls_executed.append({
                "tool": "search_destinations",
                "arguments": {"query": target_query, "limit": 3},
                "result_count": len(dests)
            })

            if dests:
                dest_ids = [d["destination_id"] for d in dests]
                itinerary_data = self.tools.create_itinerary(dest_ids, total_days=days)
                tool_calls_executed.append({
                    "tool": "create_itinerary",
                    "arguments": {"destination_ids": dest_ids, "total_days": days},
                    "title": itinerary_data.get("title")
                })
                map_focus_points = [
                    {"name": d["name"], "coordinates": d["coordinates"], "destination_id": d["destination_id"]}
                    for d in dests
                ]

            response_text = (
                f"### Curated {days}-Day Itinerary for {target_query}\n\n"
                f"Here is a structured, geographically verified {days}-day plan connecting top heritage and scenic points in **{target_query}**:\n\n"
            )
            if itinerary_data and "daily_itinerary" in itinerary_data:
                for day in itinerary_data["daily_itinerary"]:
                    response_text += f"**Day {day['day']} - {day['destination']}** ({day['focus']}):\n"
                    for act in day["activities"]:
                        response_text += f"- {act}\n"
                    response_text += "\n"
                response_text += f"\n> **Note**: {itinerary_data['disclaimer']}"

        # 2. Intent: Nearby Attractions
        elif "near" in msg_lower or "nearby" in msg_lower or "around" in msg_lower:
            # Find destination mentioned using extracted term
            search_query = extracted_dest_term if extracted_dest_term else msg_clean
            search_res = self.tools.search_destinations(query=search_query, limit=1)
            if not search_res and extracted_dest_term != msg_clean:
                search_res = self.tools.search_destinations(query=msg_clean, limit=1)
            if search_res:
                base_dest = search_res[0]
                nearby = self.tools.get_nearby_places(destination_id=base_dest["destination_id"], radius_km=450.0, limit=4)
                tool_calls_executed.append({
                    "tool": "get_nearby_places",
                    "arguments": {"destination_id": base_dest["destination_id"], "radius_km": 450.0},
                    "result_count": len(nearby)
                })
                map_focus_points = [
                    {"name": base_dest["name"], "coordinates": base_dest["coordinates"], "destination_id": base_dest["destination_id"]}
                ]
                for n in nearby:
                    map_focus_points.append({"name": n["name"], "coordinates": n["coordinates"], "destination_id": n["destination_id"]})

                response_text = (
                    f"### Verified Attractions Near {base_dest['name']} ({base_dest['state']})\n\n"
                    f"Using great-circle spatial calculation, here are the top attractions near **{base_dest['name']}**:\n\n"
                )
                for n in nearby:
                    response_text += f"- **{n['name']}** ({n['state']}) - `{n['distance_km']} km` away. {n['short_description']}\n"
            else:
                response_text = "I couldn't identify the base destination in your request. Please specify a place like 'attractions near Munnar' or 'places near Taj Mahal'."

        # 3. Intent: Specific Destination Information
        elif any(phrase in msg_lower for phrase in ["tell me about", "details of", "information on", "about", "what is"]):
            search_res = self.tools.search_destinations(query=msg_clean, limit=1)
            if search_res:
                details = self.tools.get_destination_details(search_res[0]["destination_id"])
                tool_calls_executed.append({
                    "tool": "get_destination_details",
                    "arguments": {"destination_id": search_res[0]["destination_id"]},
                    "found": bool(details)
                })
                if details:
                    map_focus_points = [{
                        "name": details["name"],
                        "coordinates": details["coordinates"],
                        "destination_id": details["destination_id"]
                    }]
                    factual_citations.append({
                        "source": details["source_name"],
                        "url": details["source_url"],
                        "verified_date": details["last_verified_date"]
                    })
                    response_text = (
                        f"### {details['name']} ({details['state']})\n\n"
                        f"{details['detailed_description']}\n\n"
                        f"- **Category**: {details['category']}\n"
                        f"- **Region**: {details['region']} India (Elevation: {int(details['elevation_m'])}m)\n"
                        f"- **Best Season**: {details['best_season']}\n"
                        f"- **Typical Duration**: {details['avg_visit_duration_days']} days\n"
                        f"- **Entry Information**: {details['entry_fee_info']}\n"
                        f"- **Hours**: {details['opening_hours_info']}\n"
                        f"- **Source**: {details['source_name']} (Verified: {details['last_verified_date']})\n"
                    )
                else:
                    response_text = "Destination record could not be retrieved from the warehouse."
            else:
                response_text = "Could not find a matching destination in the database. Please try another destination name."

        # 4. Intent: Recommendation or Preference Matching
        else:
            # Build profile from query keywords
            profile = {
                "nature_affinity": 0.85 if any(w in msg_lower for w in ["nature", "mountain", "snow", "trek", "himalaya", "valley"]) else 0.5,
                "culture_affinity": 0.85 if any(w in msg_lower for w in ["heritage", "temple", "culture", "palace", "fort", "history"]) else 0.5,
                "adventure_affinity": 0.85 if any(w in msg_lower for w in ["adventure", "trek", "rafting", "wildlife", "safari"]) else 0.5,
                "relaxation_affinity": 0.85 if any(w in msg_lower for w in ["beach", "relax", "peace", "calm", "chill", "island"]) else 0.5,
                "budget_tier": "Luxury" if "luxury" in msg_lower else ("Budget" if "budget" in msg_lower or "cheap" in msg_lower else "Moderate")
            }

            rec_res = self.tools.recommend_destinations(profile=profile, top_k=4)
            tool_calls_executed.append({
                "tool": "recommend_destinations",
                "arguments": profile,
                "cluster_assigned": rec_res.get("cluster_label")
            })

            recommended_destinations = rec_res.get("recommendations", [])
            for r in recommended_destinations:
                map_focus_points.append({
                    "name": r["name"],
                    "coordinates": {"latitude": r["latitude"], "longitude": r["longitude"]},
                    "destination_id": r["destination_id"]
                })

            response_text = (
                f"### Personalized Recommendations: {rec_res.get('cluster_label')}\n\n"
                f"Based on your travel interest signals, our hybrid data mining engine mapped your profile to the **{rec_res.get('cluster_label')}** traveler segment. "
                f"Here are the top ranked destinations matching your criteria:\n\n"
            )
            for r in recommended_destinations:
                response_text += (
                    f"**{r['name']}** ({r['state']}) - `{r['recommendation_score']}% Match`\n"
                    f"- *Highlights*: {r['short_description']}\n"
                    f"- *Why Matched*: {r['evidence_rationale']}\n"
                    f"- *Best Season*: {r['best_season']}\n\n"
                )

        return {
            "query": message,
            "response": response_text,
            "tool_calls": tool_calls_executed,
            "map_focus_points": map_focus_points,
            "recommended_destinations": recommended_destinations,
            "itinerary": itinerary_data,
            "citations": factual_citations,
            "has_llm_key": bool(settings.OPENAI_API_KEY or settings.GEMINI_API_KEY)
        }
