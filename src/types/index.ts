export type UserRole = 'customer' | 'driver' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  restaurantId?: string;
}

export interface MenuItemOption {
  id: string;
  name: string;
  priceDelta: number;
}

export interface MenuItemOptions {
  sizes?: MenuItemOption[];
  addOns?: MenuItemOption[];
  extras?: MenuItemOption[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  image: string;
  imageUrl?: string;
  price: number;
  category: string;
  isAvailable: boolean;
  options?: MenuItemOptions;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  menuItem?: MenuItem;
  choice?: {
    sizeId?: string;
    addOnIds?: string[];
    extraIds?: string[];
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  status: string;
  total: number;
  createdAt: string;
  type: 'delivery' | 'pickup';
  deliveryAddress?: {
    street: string;
    city: string;
  };
  items: OrderItem[];
}

export interface DashboardStats {
  totalRevenue: number;
  todayRevenue: number;
  totalOrders: number;
  activeOrders: number;
}

export interface Restaurant {
  id: string;
  name: string;
  rating: number;
  categories: string[];
  imageUrl: string;
  address: string;
  items: MenuItem[];
}
