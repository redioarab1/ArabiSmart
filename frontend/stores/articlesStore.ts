import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export interface Article {
  id: string;
  title: string;
  description: string;
  link: string;
  source: string;
  source_language: string;
  category: string;
  image: string | null;
  published_date: string | null;
  guid: string;
  is_translated: boolean;
  is_summarized: boolean;
  summary?: string;
  translated_title?: string;
  translated_description?: string;
  is_breaking?: boolean;
}

interface ArticlesState {
  articles: Article[];
  breakingNews: Article[];
  favorites: Article[];
  loading: boolean;
  breakingLoading: boolean;
  error: string | null;
  selectedCategory: string;
  fetchArticles: (category?: string) => Promise<void>;
  fetchBreakingNews: () => Promise<void>;
  fetchFavorites: (token: string) => Promise<void>;
  searchArticles: (query: string) => Promise<Article[]>;
  setCategory: (category: string) => void;
  addToFavorites: (articleId: string, token: string) => Promise<void>;
  removeFromFavorites: (articleId: string, token: string) => Promise<void>;
}

export const useArticlesStore = create<ArticlesState>((set, get) => ({
  articles: [],
  breakingNews: [],
  favorites: [],
  loading: false,
  breakingLoading: false,
  error: null,
  selectedCategory: 'الكل',

  fetchArticles: async (category?: string) => {
    set({ loading: true, error: null });
    try {
      const cat = category || get().selectedCategory;
      const params = cat !== 'الكل' ? `?category=${encodeURIComponent(cat)}` : '';
      const response = await axios.get(`${API_URL}/api/news${params}`);
      set({ articles: response.data.articles, loading: false });
    } catch (error: any) {
      set({ error: 'فشل تحميل الأخبار', loading: false });
    }
  },

  fetchBreakingNews: async () => {
    set({ breakingLoading: true });
    try {
      const response = await axios.get(`${API_URL}/api/breaking-news?limit=10`);
      set({ breakingNews: response.data.articles, breakingLoading: false });
    } catch (error: any) {
      set({ breakingLoading: false });
    }
  },

  fetchFavorites: async (token: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ favorites: response.data.articles });
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  },

  searchArticles: async (query: string) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/news/search/${encodeURIComponent(query)}`
      );
      return response.data.articles;
    } catch {
      return [];
    }
  },

  setCategory: (category: string) => {
    set({ selectedCategory: category });
    get().fetchArticles(category);
  },

  addToFavorites: async (articleId: string, token: string) => {
    try {
      await axios.post(
        `${API_URL}/api/favorites/add`,
        { article_id: articleId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  },

  removeFromFavorites: async (articleId: string, token: string) => {
    try {
      await axios.post(
        `${API_URL}/api/favorites/remove`,
        { article_id: articleId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      set({ favorites: get().favorites.filter((a) => a.id !== articleId) });
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  },
}));
