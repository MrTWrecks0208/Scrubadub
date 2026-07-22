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

export function useFirebaseTemplates(user: User | null) {
  const [templates, setTemplates] = useState<UserTemplate[]>(() => getLocalTemplates());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTemplates(getLocalTemplates());
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
        const list: UserTemplate[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
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
        list.sort((a, b) => {
          const timeA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
          const timeB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setTemplates(list);
        setLoading(false);
        setError(null);
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
    if (!user) {
      // Local storage save for guest users
      const newTemplate: UserTemplate = {
        id: 'local_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        userId: 'guest',
        name,
        description,
        rules,
        sampleText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const current = getLocalTemplates();
      const updated = [newTemplate, ...current];
      saveLocalTemplates(updated);
      setTemplates(updated);
      return newTemplate.id;
    }

    try {
      const docRef = await addDoc(collection(db, 'templates'), {
        userId: user.uid,
        name,
        description,
        rules,
        sampleText,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (err: any) {
      console.warn('Cloud save failed, saving locally:', err);
      // Fallback local save
      const newTemplate: UserTemplate = {
        id: 'local_' + Date.now().toString(36),
        userId: user.uid,
        name,
        description,
        rules,
        sampleText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const current = getLocalTemplates();
      const updated = [newTemplate, ...current];
      saveLocalTemplates(updated);
      setTemplates(updated);
      return newTemplate.id;
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
      setTemplates(updated);
      return;
    }

    try {
      const docRef = doc(db, 'templates', templateId);
      await updateDoc(docRef, {
        name,
        description,
        rules,
        sampleText,
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      console.warn('Cloud update failed, updating locally:', err);
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
      setTemplates(updated);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!user || templateId.startsWith('local_')) {
      const current = getLocalTemplates();
      const updated = current.filter(t => t.id !== templateId);
      saveLocalTemplates(updated);
      setTemplates(updated);
      return;
    }

    try {
      await deleteDoc(doc(db, 'templates', templateId));
    } catch (err: any) {
      console.warn('Cloud delete failed, deleting locally:', err);
      const current = getLocalTemplates();
      const updated = current.filter(t => t.id !== templateId);
      saveLocalTemplates(updated);
      setTemplates(updated);
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
