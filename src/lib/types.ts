export type PostType = "task" | "market" | "ride";
export type VerificationStatus = "unsubmitted" | "pending" | "verified" | "rejected";

export type Campus = { id: string; slug: string; name: string; city: string };

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  campus_id: string | null;
  department: string | null;
  year: number | null;
  bio: string | null;
  skills: string[];
  verification_status: VerificationStatus;
  role: "user" | "admin";
  trust_score: number;
  rating_avg: number;
  rating_count: number;
  completed_deals: number;
  invite_code: string;
  nexconn_user_id: string;
  onboarded: boolean;
  created_at: string;
};

export type PublicProfile = Pick<
  Profile,
  | "id"
  | "full_name"
  | "avatar_url"
  | "department"
  | "year"
  | "verification_status"
  | "trust_score"
  | "rating_avg"
  | "rating_count"
  | "completed_deals"
  | "nexconn_user_id"
>;

export const PUBLIC_PROFILE_COLUMNS =
  "id, full_name, avatar_url, department, year, verification_status, trust_score, rating_avg, rating_count, completed_deals, nexconn_user_id";

export type TaskDetails = { mode: "on_campus" | "online"; needed_by?: string | null };
export type MarketDetails = { listing: "sale" | "rent" };
export type RideDetails = {
  ride_kind: "offer" | "need";
  vehicle: string;
  pickup: string;
  destination: string;
  depart_start: string;
  depart_end: string;
  seats_total: number;
  seats_left: number;
  group_id?: string | null;
  ride_status?: "scheduled" | "completed";
};

export type Post = {
  id: string;
  author_id: string;
  campus_id: string;
  type: PostType;
  title: string;
  description: string;
  category: string;
  price: number;
  location: string | null;
  images: string[];
  details: Partial<TaskDetails & MarketDetails & RideDetails>;
  status: "open" | "in_deal" | "closed" | "completed";
  created_at: string;
  author?: PublicProfile;
  campus?: Pick<Campus, "name" | "slug">;
};

export type DealStatus = "offer" | "counter" | "agreed" | "in_progress" | "done" | "reviewed" | "cancelled";

export type Deal = {
  id: string;
  post_id: string;
  buyer_id: string;
  seller_id: string;
  price: number;
  original_price: number;
  status: DealStatus;
  last_actor_id: string | null;
  buyer_done: boolean;
  seller_done: boolean;
  nexconn_conversation_id: string | null;
  nexconn_message_id: string | null;
  history: { at: string; by: string; action: string; price?: number }[];
  handover_verified_at: string | null;
  sealed_at: string | null;
  receipt_hash: string | null;
  created_at: string;
  updated_at: string;
};
