import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { RegexRule } from '../types';

export interface UserTemplate {
  id: string;
  userId: string;
  name: string;
  description: string;
  rules: RegexRule[];
  sampleText: string;
  createdAt: any;
  updatedAt: any;
}

const LOCAL_TEMPLATES_KEY = 'scrubadub_local_templates';

function getLocalTemplates(): UserTemplate[] {
  try {
    const saved = localStorage.getItem(LOCAL_TEMPLATES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error('Failed to read local templates:', err);
    return [];
  }
}

function saveLocalTemplates(templates: UserTemplate[]) {
  try {
    localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(templates));
  } catch (err) {
    console.error('Failed to save local templates:', err);
  }
}

function withTimeout<T>(promise: Promise<T>, ms = 6000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Database operation timed out'));
    }, ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function useFirebaseTemplates(user: User | null) {
  const [templates, setTemplates] = useState<UserTemplate[]>(() => getLocalTemplates());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialLocals = getLocalTemplates();

    if (!user) {
      setTemplates(initialLocals);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    let isSubscribed = true;

    // Query without orderBy to avoid requiring custom composite indexes in Firestore
    const q = query(
      collection(db, 'templates'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!isSubscribed) return;
        const cloudList: UserTemplate[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          cloudList.push({
            id: doc.id,
            userId: data.userId,
            name: data.name || 'Untitled Template',
            description: data.description || '',
            rules: data.rules || [],
            sampleText: data.sampleText || '',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
        });
        
        // Sort client side safely by updatedAt timestamp
        cloudList.sort((a, b) => {
          const timeA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
          const timeB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        // Merge local templates that are not yet in cloudList (by id or name)
        const currentLocals = getLocalTemplates();
        const localUnsynced = currentLocals.filter(lt => 
          lt.id.startsWith('local_') && 
          !cloudList.some(ct => ct.id === lt.id || ct.name.trim().toLowerCase() === lt.name.trim().toLowerCase())
        );

        const merged = [...cloudList, ...localUnsynced];
        setTemplates(merged);
        setLoading(false);
        setError(null);

        // Auto-sync unsynced local templates to Firestore for logged-in user
        if (localUnsynced.length > 0) {
          localUnsynced.forEach(async (localT) => {
            try {
              await addDoc(collection(db, 'templates'), {
                userId: user.uid,
                name: localT.name,
                description: localT.description,
                rules: localT.rules,
                sampleText: localT.sampleText,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              // Once synced, clean up from local storage so it doesn't duplicate
              const freshLocals = getLocalTemplates().filter(t => t.id !== localT.id);
              saveLocalTemplates(freshLocals);
            } catch (e) {
              console.warn('Failed auto-syncing local template to cloud:', e);
            }
          });
        }
      },
      (err) => {
        console.warn('Firestore subscription fallback to local storage:', err);
        // Fallback gracefully to local templates if Firestore errors out
        setTemplates(getLocalTemplates());
        setError(null);
        setLoading(false);
      }
    );

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [user]);

  const saveTemplate = async (name: string, description: string, rules: RegexRule[], sampleText: string) => {
    // 1. Immediately create local template & save to localStorage so UI updates instantly
    const localId = 'local_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const newTemplate: UserTemplate = {
      id: localId,
      userId: user ? user.uid : 'guest',
      name,
      description,
      rules,
      sampleText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const currentLocals = getLocalTemplates();
    const updatedLocals = [newTemplate, ...currentLocals.filter(t => t.id !== localId)];
    saveLocalTemplates(updatedLocals);

    // Update state immediately so UI updates instantly
    setTemplates(prev => {
      const filtered = prev.filter(t => t.id !== localId && t.name.trim().toLowerCase() !== name.trim().toLowerCase());
      return [newTemplate, ...filtered];
    });

    if (!user) {
      return localId;
    }

    // 2. If logged in, attempt to save to cloud in background
    try {
      const docRef = await withTimeout(
        addDoc(collection(db, 'templates'), {
          userId: user.uid,
          name,
          description,
          rules,
          sampleText,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }),
        6000
      );

      const cloudId = docRef.id;
      // Remove temporary local_ item from localStorage now that it's in cloud
      const freshLocals = getLocalTemplates().filter(t => t.id !== localId);
      saveLocalTemplates(freshLocals);

      const cloudTemplate: UserTemplate = {
        ...newTemplate,
        id: cloudId,
        userId: user.uid
      };

      setTemplates(prev => {
        const filtered = prev.filter(t => t.id !== localId && t.id !== cloudId);
        return [cloudTemplate, ...filtered];
      });

      return cloudId;
    } catch (err: any) {
      console.warn('Cloud save failed or timed out, keeping in local storage:', err);
      return localId;
    }
  };

  const updateTemplate = async (templateId: string, name: string, description: string, rules: RegexRule[], sampleText: string) => {
    if (!user || templateId.startsWith('local_')) {
      const current = getLocalTemplates();
      const updated = current.map(t => t.id === templateId ? {
        ...t,
        name,
        description,
        rules,
        sampleText,
        updatedAt: new Date().toISOString()
      } : t);
      saveLocalTemplates(updated);
      setTemplates(prev => prev.map(t => t.id === templateId ? {
        ...t,
        name,
        description,
        rules,
        sampleText,
        updatedAt: new Date().toISOString()
      } : t));
      return;
    }

    try {
      const docRef = doc(db, 'templates', templateId);
      await withTimeout(
        updateDoc(docRef, {
          name,
          description,
          rules,
          sampleText,
          updatedAt: serverTimestamp()
        }),
        6000
      );
    } catch (err: any) {
      console.warn('Cloud update failed or timed out, updating locally:', err);
      const current = getLocalTemplates();
      const updated = current.map(t => t.id === templateId ? {
        ...t,
        name,
        description,
        rules,
        sampleText,
        updatedAt: new Date().toISOString()
      } : t);
      saveLocalTemplates(updated);
      setTemplates(prev => prev.map(t => t.id === templateId ? {
        ...t,
        name,
        description,
        rules,
        sampleText,
        updatedAt: new Date().toISOString()
      } : t));
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!user || templateId.startsWith('local_')) {
      const current = getLocalTemplates();
      const updated = current.filter(t => t.id !== templateId);
      saveLocalTemplates(updated);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      return;
    }

    try {
      await withTimeout(deleteDoc(doc(db, 'templates', templateId)), 6000);
    } catch (err: any) {
      console.warn('Cloud delete failed or timed out, deleting locally:', err);
      const current = getLocalTemplates();
      const updated = current.filter(t => t.id !== templateId);
      saveLocalTemplates(updated);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    }
  };

  return {
    templates,
    loading,
    error,
    saveTemplate,
    updateTemplate,
    deleteTemplate
  };
}
