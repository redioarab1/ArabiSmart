import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useArticlesStore, Article } from '../../stores/articlesStore';
import { useAuthStore } from '../../stores/authStore';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  const { addToFavorites, removeFromFavorites } = useArticlesStore();
  const { token, isAuthenticated, user } = useAuthStore();

  const colors = {
    background: isDark ? '#0f0f1a' : '#f5f5f5',
    card: isDark ? '#1a1a2e' : '#ffffff',
    text: isDark ? '#ffffff' : '#1a1a2e',
    textSecondary: isDark ? '#a0a0a0' : '#666666',
    primary: '#e94560',
    accent: '#0f3460',
    border: isDark ? '#2a2a4e' : '#e0e0e0',
  };

  useEffect(() => {
    fetchArticle();
  }, [id]);

  useEffect(() => {
    if (article && user) {
      setIsFavorite(user.favorites?.includes(article.id) || false);
    }
  }, [article, user]);

  const fetchArticle = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/news/${id}`);
      setArticle(response.data);
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'EEEE, dd MMMM yyyy - HH:mm', { locale: ar });
    } catch {
      return '';
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated || !token) {
      Alert.alert('تنبيه', 'يرجى تسجيل الدخول أولاً', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تسجيل الدخول', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    if (!article) return;

    if (isFavorite) {
      await removeFromFavorites(article.id, token);
    } else {
      await addToFavorites(article.id, token);
    }
    setIsFavorite(!isFavorite);
  };

  const handleShare = async () => {
    if (!article) return;
    try {
      await Share.share({
        message: `${article.title}\n\n${article.link}`,
        title: article.title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleOpenLink = () => {
    if (article?.link) {
      Linking.openURL(article.link);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            لم يتم العثور على الخبر
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Image */}
        {article.image && (
          <Image
            source={{ uri: article.image }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.contentContainer}>
          {/* Badges */}
          <View style={styles.badgesRow}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{article.category}</Text>
            </View>
            {article.is_translated && (
              <View style={[styles.translatedBadge, { backgroundColor: colors.accent }]}>
                <Ionicons name="language" size={12} color="#fff" />
                <Text style={styles.badgeText}>مترجم</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            {article.translated_title || article.title}
          </Text>

          {/* Meta Info */}
          <View style={[styles.metaContainer, { borderColor: colors.border }]}>
            <View style={styles.metaItem}>
              <Ionicons name="newspaper-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {article.source}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {formatDate(article.published_date)}
              </Text>
            </View>
          </View>

          {/* Summary (if available) */}
          {article.summary && (
            <View style={[styles.summaryBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.summaryHeader}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
                <Text style={[styles.summaryLabel, { color: colors.primary }]}>
                  ملخص ذكي
                </Text>
              </View>
              <Text style={[styles.summaryText, { color: colors.text }]}>
                {article.summary}
              </Text>
            </View>
          )}

          {/* Description */}
          <Text style={[styles.description, { color: colors.text }]}>
            {article.translated_description || article.description}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={handleFavorite}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? colors.primary : colors.text}
              />
              <Text style={[styles.actionText, { color: colors.text }]}>
                {isFavorite ? 'محفوظ' : 'حفظ'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={handleShare}
            >
              <Ionicons name="share-social-outline" size={22} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>مشاركة</Text>
            </TouchableOpacity>
          </View>

          {/* Read Full Article Button */}
          <TouchableOpacity
            style={[styles.readMoreButton, { backgroundColor: colors.primary }]}
            onPress={handleOpenLink}
          >
            <Ionicons name="open-outline" size={20} color="#fff" />
            <Text style={styles.readMoreText}>قراءة المقال الكامل</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  heroImage: {
    width: '100%',
    height: 250,
  },
  contentContainer: {
    padding: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  translatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 36,
    textAlign: 'right',
    marginBottom: 16,
  },
  metaContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
  },
  summaryBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 26,
    textAlign: 'right',
  },
  description: {
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'right',
    marginBottom: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  readMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
