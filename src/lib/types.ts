// WordPress customer imported from CSV
export interface WordPressCustomer {
  $id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  city: string;
  value: number;
  $createdAt: string;
}

// Existing customer from current website
export interface ExistingCustomer {
  $id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email?: string;
  $createdAt: string;
}

// Unified customer for display
export interface UnifiedCustomer {
  phone: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  city: string;
  lifetimeValue: number;
  source: 'wordpress' | 'website' | 'both';
  wordpressData?: WordPressCustomer;
  websiteData?: ExistingCustomer;
  lastOrderDate?: string;
  orderCount: number;
}

// Existing order from website
export interface ExistingOrder {
  $id: string;
  customer_id: string;
  address_id: string;
  total_price: number;
  status: 'pending' | 'accepted' | 'out_for_delivery' | 'delivered' | 'returned';
  $createdAt: string;
}

export interface ExistingOrderItem {
  $id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity_kg: number;
  price_per_kg_at_order: number;
  total_after_discount: number;
  $createdAt: string;
}

export interface ExistingAddress {
  $id: string;
  customer_id: string;
  order_id: string;
  address_line: string;
  city: string;
  latitude?: number;
  longitude?: number;
  maps_url?: string;
}

// Call log
export type CallResponseType =
  | 'answered_ordered'
  | 'answered_interested'
  | 'answered_not_interested'
  | 'callback_later'
  | 'no_answer'
  | 'wrong_number'
  | 'dnd'
  | 'not_reachable';

export interface CallLog {
  $id: string;
  customer_phone: string;
  customer_name: string;
  agent_name: string;
  response_type: CallResponseType;
  notes: string;
  follow_up_date?: string;
  order_placed: boolean;
  order_id?: string;
  $createdAt: string;
}

// Agent order (order placed by call center agent)
export interface AgentOrder {
  $id: string;
  customer_phone: string;
  customer_name: string;
  address: string;
  city: string;
  items: AgentOrderItem[];
  total_price: number;
  status: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  agent_name: string;
  notes?: string;
  $createdAt: string;
}

export interface AgentOrderItem {
  product_name: string;
  quantity_kg: number;
  price_per_kg: number;
  total: number;
}

// Campaign
export interface RetargetingCampaign {
  $id: string;
  name: string;
  description?: string;
  target_city?: string;
  min_value?: number;
  max_value?: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_by: string;
  $createdAt: string;
}

// Stats
export interface DashboardStats {
  totalWordPressCustomers: number;
  totalWebsiteCustomers: number;
  totalUniqueCustomers: number;
  totalCallsToday: number;
  totalOrdersToday: number;
  pendingFollowUps: number;
  totalRevenue: number;
}
