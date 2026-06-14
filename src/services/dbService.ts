import { Product, Address, Order, SupportTicket, ContactMessage } from "../types";
import { isMockFirebase as isMockFirebaseReal, db, handleFirestoreError, OperationType } from "../firebase";
const isMockFirebase = isMockFirebaseReal || localStorage.getItem("skb_use_simulated_db") === "true";
import { SEED_PRODUCTS } from "../data/seedProducts";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy
} from "firebase/firestore";

const STORAGE_PRODUCTS_KEY = "skb_products_db";
const STORAGE_ADDRESSES_KEY = "skb_addresses_db_";
const STORAGE_ORDERS_KEY = "skb_orders_db";
const STORAGE_TICKETS_KEY = "skb_support_tickets_db";
const STORAGE_CONTACTS_KEY = "skb_contacts_db";
const STORAGE_SETTINGS_KEY = "skb_global_settings";

export const dbService = {
  // =================== PRODUCTS CRUD ===================
  getProducts: async (): Promise<Product[]> => {
    if (isMockFirebase) {
      const stored = localStorage.getItem(STORAGE_PRODUCTS_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(SEED_PRODUCTS));
        return SEED_PRODUCTS;
      }
      return JSON.parse(stored);
    }

    const path = "products";
    try {
      const q = query(collection(db, path));
      const snap = await getDocs(q);
      const list: Product[] = [];
      snap.forEach((docRef) => {
        list.push({ id: docRef.id, ...docRef.data() } as Product);
      });

      // Self-healing: if Firestore is empty on start, seed it automatic!
      if (list.length === 0) {
        console.log("Firestore is empty. Auto-seeding catalog...");
        for (const seed of SEED_PRODUCTS) {
          const cleanSeed = { ...seed };
          delete cleanSeed.id; // Let firestore generate UUID
          await addDoc(collection(db, path), {
            ...cleanSeed,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        // Query again
        const snap2 = await getDocs(q);
        const list2: Product[] = [];
        snap2.forEach((docRef) => {
          list2.push({ id: docRef.id, ...docRef.data() } as Product);
        });
        localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(list2));
        return list2;
      }

      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(list));
      return list;
    } catch (err) {
      console.warn("Firestore products fetch failed. Falling back to cache.", err);
      const cached = localStorage.getItem(STORAGE_PRODUCTS_KEY);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (sc) {
          return SEED_PRODUCTS;
        }
      }
      return SEED_PRODUCTS;
    }
  },

  saveProduct: async (product: Partial<Product>): Promise<Product> => {
    const fallbackWrite = async (prod: Partial<Product>): Promise<Product> => {
      const products = await dbService.getProducts();
      let saved: Product;
      if (prod.id) {
        const index = products.findIndex(p => p.id === prod.id);
        const existingProd = index > -1 ? products[index] : {};
        saved = { ...existingProd, ...prod, updatedAt: new Date().toISOString() } as Product;
        if (index > -1) products[index] = saved;
      } else {
        const newId = "prod-" + Math.random().toString(36).substr(2, 9);
        saved = {
          ...prod,
          id: newId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Product;
        products.push(saved);
      }
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
      return saved;
    };

    if (isMockFirebase) {
      return fallbackWrite(product);
    }

    const path = "products";
    try {
      let result: Product;
      if (product.id) {
        const prodId = product.id;
        const docRef = doc(db, path, prodId);
        const cleanProduct = { ...product, updatedAt: new Date().toISOString() };
        delete cleanProduct.id;
        await setDoc(docRef, cleanProduct, { merge: true });
        result = { ...product } as Product;
      } else {
        const cleanProduct = {
          ...product,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, path), cleanProduct);
        result = { id: docRef.id, ...cleanProduct } as Product;
      }
      
      // Keep cache in sync
      try {
        const products = await dbService.getProducts();
        const idx = products.findIndex(p => p.id === result.id);
        if (idx > -1) products[idx] = result;
        else products.push(result);
        localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
      } catch (ce) {}

      return result;
    } catch (err) {
      console.warn("Firestore saveProduct failed. Saving to local storage fallback instead.", err);
      return fallbackWrite(product);
    }
  },

  deleteProduct: async (productId: string): Promise<void> => {
    const fallbackDelete = async () => {
      const products = await dbService.getProducts();
      const nextProducts = products.filter(p => p.id !== productId);
      localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(nextProducts));
    };

    if (isMockFirebase) {
      await fallbackDelete();
      return;
    }

    const path = `products/${productId}`;
    try {
      await deleteDoc(doc(db, "products", productId));
      await fallbackDelete();
    } catch (err) {
      console.warn("Firestore deleteProduct failed. Deleting from local fallback.", err);
      await fallbackDelete();
    }
  },

  // =================== ADDRESS SYSTEM ===================
  getAddresses: async (userId: string): Promise<Address[]> => {
    const key = STORAGE_ADDRESSES_KEY + userId;
    if (isMockFirebase) {
      const stored = localStorage.getItem(key);
      if (!stored) {
        const initial: Address[] = [
          {
            id: "addr-1",
            fullName: "Amit Kumar",
            phone: "9876543210",
            street: "Flat 405, Block B, Nangloi Ext",
            city: "New Delhi",
            state: "Delhi",
            pinCode: "110041",
            isDefault: true,
          }
        ];
        localStorage.setItem(key, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(stored);
    }

    const path = `users/${userId}/addresses`;
    try {
      const snap = await getDocs(collection(db, "users", userId, "addresses"));
      const list: Address[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Address);
      });
      localStorage.setItem(key, JSON.stringify(list));
      return list;
    } catch (err) {
      console.warn("Firestore addresses fetch failed. Falling back to cache.", err);
      const cached = localStorage.getItem(key);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          return [];
        }
      }
      return [];
    }
  },

  saveAddress: async (userId: string, address: Partial<Address>): Promise<Address> => {
    const key = STORAGE_ADDRESSES_KEY + userId;
    if (isMockFirebase) {
      const addresses = await dbService.getAddresses(userId);
      let saved: Address;
      
      if (address.id) {
        saved = { ...address, userId } as Address;
        const index = addresses.findIndex(a => a.id === address.id);
        if (index > -1) addresses[index] = saved;
      } else {
        const newId = "addr-" + Math.random().toString(36).substr(2, 9);
        const shouldBeDefault = address.isDefault === true || addresses.length === 0;
        saved = { ...address, id: newId, userId, isDefault: shouldBeDefault } as Address;
        addresses.push(saved);
      }

      // If set as default, clear other defaults
      if (saved.isDefault) {
        addresses.forEach(a => { if (a.id !== saved.id) a.isDefault = false; });
      }

      localStorage.setItem(key, JSON.stringify(addresses));
      return saved;
    }

    const path = `users/${userId}/addresses`;
    try {
      const addressesRef = collection(db, "users", userId, "addresses");
      if (address.id) {
        const addrId = address.id;
        const docRef = doc(db, "users", userId, "addresses", addrId);
        const cleanAddress = { ...address, userId };
        delete cleanAddress.id;
        await setDoc(docRef, cleanAddress, { merge: true });

        if (address.isDefault) {
          // Unset others
          const list = await dbService.getAddresses(userId);
          for (const other of list) {
            if (other.id !== address.id && other.isDefault) {
              await updateDoc(doc(db, "users", userId, "addresses", other.id), { isDefault: false });
            }
          }
        }
        return { ...address, userId } as Address;
      } else {
        const list = await dbService.getAddresses(userId);
        const shouldBeDefault = address.isDefault === true || list.length === 0;
        const cleanAddress = { ...address, userId, isDefault: shouldBeDefault };
        const docRef = await addDoc(addressesRef, cleanAddress);

        if (shouldBeDefault) {
          // Unset others
          for (const other of list) {
            if (other.isDefault) {
              await updateDoc(doc(db, "users", userId, "addresses", other.id), { isDefault: false });
            }
          }
        }

        return { id: docRef.id, ...cleanAddress } as Address;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      throw err;
    }
  },

  deleteAddress: async (userId: string, addressId: string): Promise<void> => {
    const key = STORAGE_ADDRESSES_KEY + userId;
    if (isMockFirebase) {
      const addresses = await dbService.getAddresses(userId);
      const next = addresses.filter(a => a.id !== addressId);
      // Ensure at least one default remains if we deleted the default one
      if (addresses.find(a => a.id === addressId)?.isDefault && next.length > 0) {
        next[0].isDefault = true;
      }
      localStorage.setItem(key, JSON.stringify(next));
      return;
    }

    const path = `users/${userId}/addresses/${addressId}`;
    try {
      await deleteDoc(doc(db, "users", userId, "addresses", addressId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  setDefaultAddress: async (userId: string, addressId: string): Promise<void> => {
    const key = STORAGE_ADDRESSES_KEY + userId;
    if (isMockFirebase) {
      const addresses = await dbService.getAddresses(userId);
      addresses.forEach(a => {
        a.isDefault = a.id === addressId;
      });
      localStorage.setItem(key, JSON.stringify(addresses));
      return;
    }

    const path = `users/${userId}/addresses`;
    try {
      const list = await dbService.getAddresses(userId);
      for (const addr of list) {
        const isTarget = addr.id === addressId;
        await updateDoc(doc(db, "users", userId, "addresses", addr.id), { isDefault: isTarget });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // =================== ORDERS SYSTEM ===================
  placeOrder: async (order: Omit<Order, "id">): Promise<Order> => {
    if (isMockFirebase) {
      const orders = dbService.getMockOrders();
      const newId = "order-" + Math.floor(100000 + Math.random() * 900000);
      const finalOrder: Order = { ...order, id: newId };
      orders.push(finalOrder);
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
      return finalOrder;
    }

    const path = "orders";
    try {
      const docRef = await addDoc(collection(db, path), {
        ...order,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: docRef.id, ...order } as Order;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      throw err;
    }
  },

  getMockOrders: (): Order[] => {
    const stored = localStorage.getItem(STORAGE_ORDERS_KEY);
    if (!stored) {
      const sampleOrders: Order[] = [
        {
          id: "order-431892",
          userId: "sample-user-uid",
          userEmail: "customer@gmail.com",
          items: [
            {
              productId: "prod-7",
              name: "Crucial 8GB DDR4 RAM",
              category: "accessory",
              price: 1899,
              quantity: 1,
              stock: 25,
            }
          ],
          billingAddress: {
            id: "addr-1",
            fullName: "Amit Kumar",
            phone: "9876543210",
            street: "Flat 405, Block B, Nangloi Ext",
            city: "New Delhi",
            state: "Delhi",
            pinCode: "110041",
            isDefault: true,
          },
          totalAmount: 1899,
          paymentMethod: "UPI",
          paymentStatus: "pending",
          orderStatus: "placed",
          transactionId: "TXN9843219432",
          upiRefNumber: "UPI432189432100",
          screenshotUrl: "",
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        }
      ];
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(sampleOrders));
      return sampleOrders;
    }
    return JSON.parse(stored);
  },

  getOrders: async (userId?: string): Promise<Order[]> => {
    if (isMockFirebase) {
      const orders = dbService.getMockOrders();
      if (userId) {
        return orders.filter(o => o.userId === userId).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
      }
      return orders.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    }

    const path = "orders";
    try {
      let q = query(collection(db, path));
      if (userId) {
        q = query(collection(db, path), where("userId", "==", userId));
      }
      const snap = await getDocs(q);
      const list: Order[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Order);
      });
      const sorted = list.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
      
      if (userId) {
        localStorage.setItem(`${STORAGE_ORDERS_KEY}_${userId}`, JSON.stringify(sorted));
      } else {
        localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(sorted));
      }
      return sorted;
    } catch (err) {
      console.warn("Firestore orders fetch failed. Falling back to cache.", err);
      const cachedKey = userId ? `${STORAGE_ORDERS_KEY}_${userId}` : STORAGE_ORDERS_KEY;
      const cached = localStorage.getItem(cachedKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
      const overall = localStorage.getItem(STORAGE_ORDERS_KEY);
      if (overall) {
        try {
          const parsed = JSON.parse(overall) as Order[];
          if (userId) {
            return parsed.filter(o => o.userId === userId);
          }
          return parsed;
        } catch (e) {}
      }
      return userId ? [] : dbService.getMockOrders();
    }
  },

  updateOrder: async (orderId: string, updates: Partial<Order>): Promise<void> => {
    if (isMockFirebase) {
      const orders = dbService.getMockOrders();
      const updated = orders.map(o => o.id === orderId ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o);
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(updated));
      return;
    }

    const path = `orders/${orderId}`;
    try {
      await updateDoc(doc(db, "orders", orderId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // =================== SUPPORT TICKETS ===================
  getMockTickets: (): SupportTicket[] => {
    const stored = localStorage.getItem(STORAGE_TICKETS_KEY);
    if (!stored) {
      const sampleTickets: SupportTicket[] = [
        {
          id: "ticket-109",
          userId: "sample-user-uid",
          userEmail: "customer@gmail.com",
          subject: "Inquiry about Screen Repair Warranty",
          message: "Hi, I got my HP Laptop screen replaced yesterday. What is the exact warranty period for this service?",
          status: "open",
          messages: [
            {
              sender: "user",
              senderEmail: "customer@gmail.com",
              message: "Hi, I got my HP Laptop screen replaced yesterday. What is the exact warranty period for this service?",
              timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
            },
            {
              sender: "admin",
              senderEmail: "skbitservice@gmail.com",
              message: "Hello Amit! Screen replacements carry a full 3-month chip-level and panel warranty. This covers accidental blackouts or line issues, but not physical drops.",
              timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
            }
          ],
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        }
      ];
      localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(sampleTickets));
      return sampleTickets;
    }
    return JSON.parse(stored);
  },

  getTickets: async (userId?: string): Promise<SupportTicket[]> => {
    if (isMockFirebase) {
      const list = dbService.getMockTickets();
      if (userId) {
        return list.filter(t => t.userId === userId).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
      }
      return list.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    }

    const path = "tickets";
    try {
      let q = query(collection(db, path));
      if (userId) {
        q = query(collection(db, path), where("userId", "==", userId));
      }
      const snap = await getDocs(q);
      const list: SupportTicket[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as SupportTicket);
      });
      const sorted = list.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
      
      if (userId) {
        localStorage.setItem(`${STORAGE_TICKETS_KEY}_${userId}`, JSON.stringify(sorted));
      } else {
        localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(sorted));
      }
      return sorted;
    } catch (err) {
      console.warn("Firestore tickets fetch failed. Falling back to cache.", err);
      const cachedKey = userId ? `${STORAGE_TICKETS_KEY}_${userId}` : STORAGE_TICKETS_KEY;
      const cached = localStorage.getItem(cachedKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
      const overall = localStorage.getItem(STORAGE_TICKETS_KEY);
      if (overall) {
        try {
          const parsed = JSON.parse(overall) as SupportTicket[];
          if (userId) {
            return parsed.filter(t => t.userId === userId);
          }
          return parsed;
        } catch (e) {}
      }
      return userId ? [] : dbService.getMockTickets();
    }
  },

  submitTicket: async (ticket: Omit<SupportTicket, "id">): Promise<SupportTicket> => {
    if (isMockFirebase) {
      const list = dbService.getMockTickets();
      const newId = "ticket-" + Math.floor(100 + Math.random() * 900);
      const finalTicket: SupportTicket = { ...ticket, id: newId };
      list.push(finalTicket);
      localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(list));
      return finalTicket;
    }

    const path = "tickets";
    try {
      const docRef = await addDoc(collection(db, "tickets"), {
        ...ticket,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: docRef.id, ...ticket } as SupportTicket;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      throw err;
    }
  },

  updateTicket: async (ticketId: string, updates: Partial<SupportTicket>): Promise<void> => {
    if (isMockFirebase) {
      const list = dbService.getMockTickets();
      const updated = list.map(t => t.id === ticketId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t);
      localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(updated));
      return;
    }

    const path = `tickets/${ticketId}`;
    try {
      await updateDoc(doc(db, "tickets", ticketId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // =================== CONTACT LANDINGS ===================
  submitContact: async (contact: Omit<ContactMessage, "id">): Promise<ContactMessage> => {
    if (isMockFirebase) {
      const stored = localStorage.getItem(STORAGE_CONTACTS_KEY);
      const list: ContactMessage[] = stored ? JSON.parse(stored) : [
        {
          id: "contact-1",
          name: "Sanjay Singhal",
          phone: "9123456789",
          issue: "Dead Macbook Pro not starting after rain exposure.",
          createdAt: new Date().toISOString(),
        }
      ];
      const newId = "contact-" + Math.random().toString(36).substr(2, 9);
      const finalContact: ContactMessage = { ...contact, id: newId };
      list.push(finalContact);
      localStorage.setItem(STORAGE_CONTACTS_KEY, JSON.stringify(list));
      return finalContact;
    }

    const path = "contacts";
    try {
      const docRef = await addDoc(collection(db, path), {
        ...contact,
        createdAt: new Date().toISOString()
      });
      return { id: docRef.id, ...contact } as ContactMessage;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      throw err;
    }
  },

  getContacts: async (): Promise<ContactMessage[]> => {
    if (isMockFirebase) {
      const stored = localStorage.getItem(STORAGE_CONTACTS_KEY);
      if (!stored) {
        const initial = [
          {
            id: "contact-1",
            name: "Sanjay Singhal",
            phone: "9123456789",
            issue: "Dead Macbook Pro not starting after rain exposure.",
            createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
          }
        ];
        localStorage.setItem(STORAGE_CONTACTS_KEY, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(stored).sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
    }

    const path = "contacts";
    try {
      const snap = await getDocs(collection(db, path));
      const list: ContactMessage[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as ContactMessage);
      });
      const sorted = list.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
      localStorage.setItem(STORAGE_CONTACTS_KEY, JSON.stringify(sorted));
      return sorted;
    } catch (err) {
      console.warn("Firestore contacts fetch failed. Falling back to cache.", err);
      const cached = localStorage.getItem(STORAGE_CONTACTS_KEY);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
      return [];
    }
  },

  // =================== GLOBAL SETTINGS ===================
  getGlobalSettings: async (): Promise<{ upiId: string; upiQrUrl?: string }> => {
    const defaultSettings = { upiId: "skbcomputer86@kotak", upiQrUrl: "" };
    if (isMockFirebase) {
      const stored = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(defaultSettings));
        return defaultSettings;
      }
      return JSON.parse(stored);
    }

    const path = "settings/global";
    try {
      const docSnap = await getDoc(doc(db, "settings", "global"));
      if (docSnap.exists()) {
        const data = docSnap.data() as { upiId: string; upiQrUrl?: string };
        localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(data));
        return data;
      } else {
        await setDoc(doc(db, "settings", "global"), defaultSettings);
        localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(defaultSettings));
        return defaultSettings;
      }
    } catch (err) {
      console.warn("Failed retrieving settings, using local cached settings or default.", err);
      const cached = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
      return defaultSettings;
    }
  },

  updateGlobalSettings: async (upiId: string, upiQrUrl?: string): Promise<void> => {
    const data = { upiId, upiQrUrl: upiQrUrl || "", updatedAt: new Date().toISOString() };
    if (isMockFirebase) {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify({ upiId, upiQrUrl: upiQrUrl || "" }));
      return;
    }

    const path = "settings/global";
    try {
      await setDoc(doc(db, "settings", "global"), data);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
};
