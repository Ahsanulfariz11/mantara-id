import { db, ref, set, get, child, onValue } from './firebase';

// Helper to handle real-time subscriptions
export const subscribeToNode = (nodeName, callback) => {
  const nodeRef = ref(db, nodeName);
  return onValue(nodeRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
};

// Generic CRUD operations
export const api = {
  // Read once
  get: async (nodeName) => {
    try {
      const snapshot = await get(child(ref(db), nodeName));
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error(`Error fetching ${nodeName}:`, error);
      throw error;
    }
  },

  // Set (Overwrite completely)
  set: async (nodeName, data) => {
    try {
      await set(ref(db, nodeName), data);
      return true;
    } catch (error) {
      console.error(`Error saving ${nodeName}:`, error);
      throw error;
    }
  },

  // Fetch as Array
  getArray: async (nodeName) => {
    const data = await api.get(nodeName);
    if (!data) return [];
    return Object.keys(data).map(key => ({
      ...data[key],
      id: key
    }));
  },

  // Save specific item in array (by ID)
  saveItem: async (nodeName, id, data) => {
    try {
      await set(ref(db, `${nodeName}/${id}`), data);
      return true;
    } catch (error) {
      console.error(`Error saving item ${id} to ${nodeName}:`, error);
      throw error;
    }
  },

  // Delete specific item
  deleteItem: async (nodeName, id) => {
    try {
      await set(ref(db, `${nodeName}/${id}`), null);
      return true;
    } catch (error) {
      console.error(`Error deleting item ${id} from ${nodeName}:`, error);
      throw error;
    }
  }
};
