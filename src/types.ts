export type ProductCategory = "service" | "accessory";

export interface Product {
  id?: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: number;
  stock: number;
  image_url?: string;
  active: boolean; // boolean visibility
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRoleProfile {
  uid: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
  phone: string;
  createdAt?: string;
}

export interface Address {
  id: string;
  userId?: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
}

export interface CartItem {
  productId: string;
  name: string;
  category: ProductCategory;
  price: number;
  quantity: number;
  stock: number;
  image_url?: string;
}

export type OrderPaymentStatus = "pending" | "verified" | "rejected";
export type OrderStatus = "placed" | "processing" | "shipped" | "completed" | "cancelled";

export interface Order {
  id?: string;
  userId: string;
  userEmail: string;
  items: CartItem[];
  billingAddress: Address;
  totalAmount: number;
  paymentMethod: "UPI";
  paymentStatus: OrderPaymentStatus;
  orderStatus: OrderStatus;
  transactionId?: string;
  upiRefNumber?: string;
  screenshotUrl?: string; // payment screenshot url (or base64/placeholder for preview)
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  sender: "user" | "admin";
  senderEmail: string;
  message: string;
  timestamp: string;
}

export interface SupportTicket {
  id?: string;
  userId: string;
  userEmail: string;
  subject: string;
  message: string;
  status: "open" | "closed";
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessage {
  id?: string;
  name: string;
  phone: string;
  issue: string;
  createdAt: string;
}
