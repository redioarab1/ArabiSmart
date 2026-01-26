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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useArticlesStore, Article } from '../stores/articlesStore';
import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function FavoritesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { favorites, fetchFavorites, removeFromFavorites } = useArticlesStore();
  const { token, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = React.useState(true);

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
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    loadFavorites();
  }, [isAuthenticated, token]);

  const loadFavorites = async () => {
    if (token) {
      setLoading(true);
      await fetchFavorites(token);
      setLoading(false);
    }
  };

  const handleRemove = (articleId: string) => {
    Alert.alert(
      'إزالة من المفضلة',
      'هل تريد إزالة هذا الخبر من المفضلة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إزالة',
          style: 'destructive',
          onPress: async () => {
            if (token) {
              await removeFromFavorites(articleId, token);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd MMM yyyy', { locale: ar });
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
      <View style={styles.articleRow}>
        {item.image && (
          <Image
            source={{ uri: item.image }}
            style={styles.articleImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.articleContent}>
          <Text
            style={[styles.articleTitle, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
              {item.source}
            </Text>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {formatDate(item.published_date)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemove(item.id)}
        >
          <Ionicons name="heart" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Info */}
      <View style={[styles.headerInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerIcon}>
          <Ionicons name="heart" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            الأخبار المفضلة
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {favorites.length} خبر محفوظ
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderArticleItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                لا توجد أخبار محفوظة
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                اضغط على أيقونة القلب لحفظ الأخبار
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
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
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
  },
  listContent: {
    padding: 16,
  },
  articleCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    padding: 12,
  },
  articleRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  articleImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  articleContent: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 20,
    textAlign: 'right',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 11,
  },
  dateText: {
    fontSize: 10,
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 13,
  },
});
