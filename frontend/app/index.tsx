import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useArticlesStore, Article } from '../stores/articlesStore';
import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'الكل', name: 'الكل', icon: 'newspaper-outline' },
  { id: 'عاجل', name: 'عاجل', icon: 'flash-outline' },
  { id: 'سياسة', name: 'سياسة', icon: 'business-outline' },
  { id: 'اقتصاد', name: 'اقتصاد', icon: 'trending-up-outline' },
  { id: 'رياضة', name: 'رياضة', icon: 'football-outline' },
  { id: 'تكنولوجيا', name: 'تكنولوجيا', icon: 'phone-portrait-outline' },
  { id: 'صحة', name: 'صحة', icon: 'heart-outline' },
  { id: 'ثقافة', name: 'ثقافة', icon: 'color-palette-outline' },
  { id: 'SE', name: 'SE', icon: 'flag-outline' },
  { id: 'دولي', name: 'دولي', icon: 'globe-outline' },
];

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);

  const { articles, loading, selectedCategory, fetchArticles, setCategory } =
    useArticlesStore();
  const { isAuthenticated, user } = useAuthStore();

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
    fetchArticles();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchArticles();
    setRefreshing(false);
  }, [fetchArticles]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd MMM yyyy - HH:mm', { locale: ar });
    } catch {
      return '';
    }
  };

  const renderCategoryItem = ({ item }: { item: (typeof CATEGORIES)[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        {
          backgroundColor:
            selectedCategory === item.id ? colors.primary : colors.card,
          borderColor:
            selectedCategory === item.id ? colors.primary : colors.border,
        },
      ]}
      onPress={() => setCategory(item.id)}
    >
      <Ionicons
        name={item.icon as any}
        size={18}
        color={selectedCategory === item.id ? '#fff' : colors.text}
      />
      <Text
        style={[
          styles.categoryText,
          { color: selectedCategory === item.id ? '#fff' : colors.text },
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderArticleItem = ({ item, index }: { item: Article; index: number }) => (
    <TouchableOpacity
      style={[
        styles.articleCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        index === 0 && styles.featuredCard,
      ]}
      onPress={() => router.push(`/article/${item.id}`)}
      activeOpacity={0.7}
    >
      {item.image && (
        <Image
          source={{ uri: item.image }}
          style={[styles.articleImage, index === 0 && styles.featuredImage]}
          resizeMode="cover"
        />
      )}
      <View style={styles.articleContent}>
        <View style={styles.articleMeta}>
          <View
            style={[styles.categoryBadge, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
          <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
            {item.source}
          </Text>
        </View>
        <Text
          style={[
            styles.articleTitle,
            { color: colors.text },
            index === 0 && styles.featuredTitle,
          ]}
          numberOfLines={index === 0 ? 3 : 2}
        >
          {item.title}
        </Text>
        <Text
          style={[styles.articleDescription, { color: colors.textSecondary }]}
          numberOfLines={index === 0 ? 3 : 2}
        >
          {item.description}
        </Text>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
          {formatDate(item.published_date)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>
            ArabiSmart
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            أخبارك بذكاء
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.background }]}
            onPress={() => router.push('/search')}
          >
            <Ionicons name="search" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.background }]}
            onPress={() => router.push(isAuthenticated ? '/profile' : '/auth/login')}
          >
            <Ionicons
              name={isAuthenticated ? 'person' : 'person-outline'}
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Breaking News Button */}
      <TouchableOpacity
        style={[styles.breakingButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/breaking-news')}
      >
        <Ionicons name="flash" size={20} color="#fff" />
        <Text style={styles.breakingButtonText}>الأخبار العاجلة</Text>
        <View style={styles.breakingBadge}>
          <Text style={styles.breakingBadgeText}>AI</Text>
        </View>
      </TouchableOpacity>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Articles List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            جاري تحميل الأخبار...
          </Text>
        </View>
      ) : (
        <FlatList
          data={articles}
          renderItem={renderArticleItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.articlesList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                لا توجد أخبار حالياً
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom Tab Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home" size={24} color={colors.primary} />
          <Text style={[styles.tabText, { color: colors.primary }]}>الرئيسية</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/search')}>
          <Ionicons name="search-outline" size={24} color={colors.textSecondary} />
          <Text style={[styles.tabText, { color: colors.textSecondary }]}>بحث</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.push(isAuthenticated ? '/favorites' : '/auth/login')}
        >
          <Ionicons name="heart-outline" size={24} color={colors.textSecondary} />
          <Text style={[styles.tabText, { color: colors.textSecondary }]}>المفضلة</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.push(isAuthenticated ? '/profile' : '/auth/login')}
        >
          <Ionicons name="person-outline" size={24} color={colors.textSecondary} />
          <Text style={[styles.tabText, { color: colors.textSecondary }]}>حسابي</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  breakingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  breakingBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  breakingBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    marginTop: 12,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  articlesList: {
    padding: 16,
    paddingBottom: 80,
  },
  articleCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  featuredCard: {
    marginBottom: 20,
  },
  articleImage: {
    width: '100%',
    height: 180,
  },
  featuredImage: {
    height: 220,
  },
  articleContent: {
    padding: 14,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  sourceText: {
    fontSize: 12,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 24,
    marginBottom: 6,
    textAlign: 'right',
  },
  featuredTitle: {
    fontSize: 20,
    lineHeight: 30,
  },
  articleDescription: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
    textAlign: 'right',
  },
  dateText: {
    fontSize: 11,
    textAlign: 'right',
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    borderTopWidth: 1,
  },
  tabItem: {
    alignItems: 'center',
    gap: 4,
  },
  tabText: {
    fontSize: 11,
  },
});
