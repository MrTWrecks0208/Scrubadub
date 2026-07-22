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

export function useFirebaseTemplates(user: User | null) {
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTemplates([]);
      return;
    }

    setLoading(true);
    // Query without orderBy to avoid requiring custom composite indexes in Firestore
    const q = query(
      collection(db, 'templates'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
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
        console.error('Error fetching templates:', err);
        setError(err.message || 'Unable to connect to Cloud Database.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const saveTemplate = async (name: string, description: string, rules: RegexRule[], sampleText: string) => {
    if (!user) {
      throw new Error('You must be signed in to save a template.');
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
      console.error('Error saving template:', err);
      throw new Error(err.message || 'Failed to save template.');
    }
  };

  const updateTemplate = async (templateId: string, name: string, description: string, rules: RegexRule[], sampleText: string) => {
    if (!user) {
      throw new Error('You must be signed in to update a template.');
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
      console.error('Error updating template:', err);
      throw new Error(err.message || 'Failed to update template.');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!user) {
      throw new Error('You must be signed in to delete a template.');
    }

    try {
      await deleteDoc(doc(db, 'templates', templateId));
    } catch (err: any) {
      console.error('Error deleting template:', err);
      throw new Error(err.message || 'Failed to delete template.');
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
