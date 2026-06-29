import {
  Award, Banknote, Briefcase, Building2, Compass, Cpu, Eye, Globe2, GraduationCap,
  HandCoins, HeartPulse, LayoutDashboard, Lightbulb, LineChart, MapPin, Megaphone,
  MessageCircle, Network, Newspaper, Phone, Shield, ShieldCheck, Sparkles, Users,
  type LucideIcon,
} from "lucide-react";

export type FieldKind = "auto" | "url" | "video" | "rating" | "list" | "paragraph";

export interface SectionField {
  key: string;
  label: string;
  kind?: FieldKind;
}

export interface IntelligenceSection {
  id: string;
  title: string;
  icon: LucideIcon;
  fields: SectionField[];
}

export type Profile = Record<string, unknown>;

const f = (key: string, label: string, kind: FieldKind = "auto"): SectionField => ({ key, label, kind });

export function buildIntelligenceSections(_profile?: Profile): IntelligenceSection[] {
  return [
    { id: "identity", title: "Company Identity", icon: Building2, fields: [
      f("name", "Legal Name"), f("short_name", "Short Name"), f("category", "Category"),
      f("incorporation_year", "Incorporation Year"), f("nature_of_company", "Nature"),
    ]},
    { id: "overview", title: "Overview & Vision", icon: Eye, fields: [
      f("overview_text", "Overview", "paragraph"), f("vision_statement", "Vision", "paragraph"),
      f("mission_statement", "Mission", "paragraph"), f("core_values", "Core Values", "list"),
      f("history_timeline", "History & Timeline", "list"),
    ]},
    { id: "leadership", title: "Leadership", icon: Users, fields: [
      f("ceo_name", "CEO"), f("ceo_linkedin_url", "CEO LinkedIn", "url"),
      f("key_leaders", "Key Leaders", "list"), f("board_members", "Board", "list"),
      f("warm_intro_pathways", "Warm Intro Pathways", "list"),
      f("decision_maker_access", "Decision Maker Access"),
    ]},
    { id: "funding", title: "Funding & Financials", icon: Banknote, fields: [
      f("annual_revenue", "Annual Revenue"), f("annual_profit", "Annual Profit"),
      f("revenue_mix", "Revenue Mix", "list"), f("valuation", "Valuation"),
      f("yoy_growth_rate", "YoY Growth"), f("profitability_status", "Profitability"),
      f("key_investors", "Key Investors", "list"), f("recent_funding_rounds", "Recent Funding"),
      f("total_capital_raised", "Total Capital Raised"),
    ]},
    { id: "presence", title: "Global Presence", icon: Globe2, fields: [
      f("headquarters_address", "Headquarters"), f("operating_countries", "Operating Countries", "list"),
      f("office_count", "Office Count"), f("office_locations", "Office Locations", "list"),
      f("employee_size", "Employees"),
    ]},
    { id: "products", title: "Products & Services", icon: Briefcase, fields: [
      f("offerings_description", "Offerings", "list"), f("focus_sectors", "Focus Sectors", "list"),
      f("pain_points_addressed", "Pain Points Addressed", "list"),
      f("top_customers", "Top Customers", "list"),
      f("case_studies", "Case Studies", "list"),
      f("product_pipeline", "Product Pipeline", "list"),
    ]},
    { id: "tech", title: "Technology Stack", icon: Cpu, fields: [
      f("tech_stack", "Tech Stack", "list"), f("ai_ml_adoption_level", "AI/ML Adoption"),
      f("r_and_d_investment", "R&D Investment"), f("intellectual_property", "IP", "list"),
      f("tech_adoption_rating", "Tech Adoption Rating"),
      f("cybersecurity_posture", "Cybersecurity Posture"),
    ]},
    { id: "partnerships", title: "Partnerships & Ecosystem", icon: Network, fields: [
      f("technology_partners", "Technology Partners", "list"),
      f("partnership_ecosystem", "Partnership Ecosystem", "list"),
      f("industry_associations", "Industry Associations", "list"),
    ]},
    { id: "competitors", title: "Competitive Landscape", icon: LineChart, fields: [
      f("key_competitors", "Key Competitors", "list"),
      f("market_share_percentage", "Market Share"),
      f("benchmark_vs_peers", "Benchmark vs Peers", "list"),
      f("competitive_advantages", "Competitive Advantages", "list"),
      f("weaknesses_gaps", "Weaknesses / Gaps", "list"),
    ]},
    { id: "market", title: "Market Opportunity", icon: LayoutDashboard, fields: [
      f("tam", "TAM"), f("sam", "SAM"), f("som", "SOM"),
      f("future_projections", "Future Projections"),
      f("strategic_priorities", "Strategic Priorities", "list"),
      f("go_to_market_strategy", "Go-To-Market", "list"),
    ]},
    { id: "valueprop", title: "Core Value Proposition & ESG", icon: Sparkles, fields: [
      f("core_value_proposition", "Core Value Proposition", "list"),
      f("unique_differentiators", "Unique Differentiators", "list"),
      f("esg_ratings", "ESG", "list"), f("carbon_footprint", "Carbon Footprint"),
      f("ethical_sourcing", "Ethical Sourcing", "list"),
      f("sustainability_csr", "Sustainability & CSR", "list"),
    ]},
    { id: "culture", title: "Culture & Work Life", icon: HeartPulse, fields: [
      f("work_culture_summary", "Work Culture"), f("manager_quality", "Manager Quality"),
      f("psychological_safety", "Psychological Safety"), f("feedback_culture", "Feedback Culture"),
      f("diversity_inclusion_score", "Diversity & Inclusion"),
      f("ethical_standards", "Ethical Standards"), f("burnout_risk", "Burnout Risk"),
      f("layoff_history", "Layoff History"), f("mission_clarity", "Mission Clarity"),
      f("crisis_behavior", "Crisis Behavior"),
    ]},
    { id: "news", title: "Recent News & Milestones", icon: Newspaper, fields: [
      f("recent_news", "Recent News", "list"),
      f("event_participation", "Event Participation", "list"),
      f("awards_recognitions", "Awards & Recognitions", "list"),
      f("innovation_roadmap", "Innovation Roadmap", "list"),
    ]},
    { id: "sales", title: "Sales & Customer Metrics", icon: HandCoins, fields: [
      f("sales_motion", "Sales Motion"),
      f("customer_acquisition_cost", "CAC"),
      f("customer_lifetime_value", "LTV"),
      f("churn_rate", "Churn Rate"), f("net_promoter_score", "NPS"),
      f("customer_concentration_risk", "Customer Concentration Risk"),
      f("customer_testimonials", "Testimonials", "list"),
    ]},
    { id: "risk", title: "Risk & Compliance", icon: ShieldCheck, fields: [
      f("regulatory_status", "Regulatory Status", "list"),
      f("legal_issues", "Legal Issues"),
      f("supply_chain_dependencies", "Supply Chain Dependencies", "list"),
      f("geopolitical_risks", "Geopolitical Risks", "list"),
      f("macro_risks", "Macro Risks", "list"),
    ]},
    { id: "location", title: "Work Location & Commute", icon: MapPin, fields: [
      f("remote_policy_details", "Remote Policy"), f("typical_hours", "Typical Hours"),
      f("overtime_expectations", "Overtime"), f("weekend_work", "Weekend Work"),
      f("flexibility_level", "Flexibility", "list"),
      f("location_centrality", "Location Centrality"),
      f("public_transport_access", "Public Transport", "list"),
      f("cab_policy", "Cab Policy", "list"),
      f("airport_commute_time", "Airport Commute"),
      f("office_zone_type", "Office Zone"),
    ]},
    { id: "safety", title: "Safety & Wellbeing", icon: Shield, fields: [
      f("area_safety", "Area Safety"), f("safety_policies", "Safety Policies", "list"),
      f("infrastructure_safety", "Infrastructure Safety"),
      f("emergency_preparedness", "Emergency Preparedness"),
    ]},
    { id: "growth", title: "Career Growth & Learning", icon: GraduationCap, fields: [
      f("training_spend", "Training Spend"), f("onboarding_quality", "Onboarding"),
      f("learning_culture", "Learning Culture", "list"), f("exposure_quality", "Exposure"),
      f("mentorship_availability", "Mentorship", "list"),
      f("internal_mobility", "Internal Mobility"),
      f("promotion_clarity", "Promotion Clarity"),
      f("tools_access", "Tools Access", "list"),
      f("role_clarity", "Role Clarity"), f("early_ownership", "Early Ownership"),
      f("work_impact", "Work Impact"), f("execution_thinking_balance", "Execution / Thinking"),
      f("automation_level", "Automation Level"),
      f("cross_functional_exposure", "Cross-functional Exposure", "list"),
      f("company_maturity", "Company Maturity"),
      f("brand_value", "Brand Value"), f("client_quality", "Client Quality"),
      f("exit_opportunities", "Exit Opportunities", "list"),
      f("skill_relevance", "Skill Relevance"),
      f("external_recognition", "External Recognition"),
      f("network_strength", "Network Strength"),
      f("global_exposure", "Global Exposure"),
    ]},
    { id: "brand", title: "Brand & Reputation", icon: Award, fields: [
      f("brand_sentiment_score", "Brand Sentiment"),
      f("marketing_video_url", "Marketing Video", "video"),
      f("website_quality", "Website Quality"),
      f("website_traffic_rank", "Website Traffic Rank"),
      f("social_media_followers", "Social Media Followers"),
    ]},
    { id: "comp", title: "Compensation & Benefits", icon: Lightbulb, fields: [
      f("leave_policy", "Leave Policy", "list"),
      f("health_support", "Health Support", "list"),
      f("family_health_insurance", "Family Health Insurance", "list"),
      f("relocation_support", "Relocation Support", "list"),
      f("lifestyle_benefits", "Lifestyle Benefits", "list"),
      f("hiring_velocity", "Hiring Velocity", "list"),
      f("employee_turnover", "Employee Turnover"),
      f("avg_retention_tenure", "Avg Retention"),
      f("diversity_metrics", "Diversity Metrics", "list"),
    ]},
    { id: "digital", title: "Digital Presence & Ratings", icon: Megaphone, fields: [
      f("website_url", "Website", "url"), f("linkedin_url", "LinkedIn", "url"),
      f("twitter_handle", "Twitter"), f("facebook_url", "Facebook", "url"),
      f("instagram_url", "Instagram", "url"),
      f("glassdoor_rating", "Glassdoor", "rating"),
      f("indeed_rating", "Indeed", "rating"),
      f("google_rating", "Google", "rating"),
    ]},
    { id: "contact", title: "Contact Information", icon: Phone, fields: [
      f("primary_contact_email", "Primary Email"),
      f("primary_phone_number", "Primary Phone"),
      f("contact_person_name", "Contact Person"),
      f("contact_person_title", "Contact Title"),
      f("contact_person_email", "Contact Email"),
      f("contact_person_phone", "Contact Phone"),
    ]},
  ];
}

export const COMPASS = Compass;
export const MSG = MessageCircle;
