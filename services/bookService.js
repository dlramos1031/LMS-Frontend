import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

// Fetch all books or filtered by a specific field
export const fetchBooks = async (filter, value) => {
  let q = collection(db, 'books');

  if (filter && value) {
    q = query(q, where(filter, '==', value));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Search across title, author, or genre
export const searchBooks = async (queryText) => {
  const snapshot = await getDocs(collection(db, 'books'));
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((book) =>
      ['title', 'author', 'genre'].some((field) =>
        book[field]?.toLowerCase().includes(queryText.toLowerCase())
      )
    );
};
