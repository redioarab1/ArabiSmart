import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useArticlesStore, Article } from '../stores/articlesStore';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function BreakingNewsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { breakingNews, breakingLoading, fetchBreakingNews } = useArticlesStore();

  const colors = {
    background: isDark ? '#0f0f1a' : '#f5f5f5',
    card: isDark ? '#1a1a2e' : '#ffffff',
    text: isDark ? '#ffffff' : '#1a1a2e',
    textSecondary: isDark ? '#a0a0a0' : '#666666',
    primary: '#e94560',
    accent: '#0f3460',
    border: isDark ? '#2a2a4e' : '#e0e0e0',
    warning: '#ff6b35',
  };

  useEffect(() => {
    fetchBreakingNews();
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd MMM yyyy - HH:mm', { locale: ar });
    } catch {
      return '';
    }
  };

  const renderArticleItem = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={[
        styles.articleCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={() => router.push(`/article/${item.id}`)}
      activeOpacity={0.7}
    >
      {item.image && (
        <Image
          source={{ uri: item.image }}
          style={styles.articleImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.articleContent}>
        {/* Badges */}
        <View style={styles.badgesRow}>
          <View style={[styles.breakingBadge, { backgroundColor: colors.warning }]}>
            <Ionicons name="flash" size={12} color="#fff" />
            <Text style={styles.badgeText}>عاجل</Text>
          </View>
          {item.is_translated && (
            <View style={[styles.translatedBadge, { backgroundColor: colors.accent }]}>
              <Ionicons name="language" size={12} color="#fff" />
              <Text style={styles.badgeText}>مترجم</Text>
            </View>
          )}
          {item.is_summarized && (
            <View style={[styles.aiBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>AI</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={[styles.articleTitle, { color: colors.text }]} numberOfLines={3}>
          {item.translated_title || item.title}
        </Text>

        {/* Summary */}
        {item.summary && (
          <View style={[styles.summaryBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.summaryLabel, { color: colors.primary }]}>
              <Ionicons name="sparkles" size={12} color={colors.primary} /> ملخص ذكي
            </Text>
            <Text style={[styles.summaryText, { color: colors.text }]}>
              {item.summary}
            </Text>
          </View>
        )}

        {/* Meta */}
        <View style={styles.metaRow}>
          <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
            {item.source}
          </Text>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {formatDate(item.published_date)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Info */}
      <View style={[styles.headerInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerIcon}>
          <Ionicons name="flash" size={24} color={colors.warning} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            الأخبار العاجلة
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            مترجمة وملخصة بالذكاء الاصطناعي
          </Text>
        </View>
      </View>

      {breakingLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            جاري تحليل وترجمة الأخبار...
          </Text>
          <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
            قد يستغرق هذا بضع ثوانٍ
          </Text>
        </View>
      ) : (
        <FlatList
          data={breakingNews}
          renderItem={renderArticleItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                لا توجد أخبار عاجلة حالياً
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 13,
  },
  listContent: {
    padding: 16,
  },
  articleCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  articleImage: {
    width: '100%',
    height: 180,
  },
  articleContent: {
    padding: 14,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  breakingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  translatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  aiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 28,
    marginBottom: 10,
    textAlign: 'right',
  },
  summaryBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'right',
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 12,
  },
  dateText: {
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
});
