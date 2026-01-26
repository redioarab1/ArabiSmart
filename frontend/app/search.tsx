import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  SafeAreaView,
  Image,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useArticlesStore, Article } from '../stores/articlesStore';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { debounce } from '../utils/helpers';

export default function SearchScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const { searchArticles } = useArticlesStore();

  const colors = {
    background: isDark ? '#0f0f1a' : '#f5f5f5',
    card: isDark ? '#1a1a2e' : '#ffffff',
    text: isDark ? '#ffffff' : '#1a1a2e',
    textSecondary: isDark ? '#a0a0a0' : '#666666',
    primary: '#e94560',
    accent: '#0f3460',
    border: isDark ? '#2a2a4e' : '#e0e0e0',
    inputBg: isDark ? '#1a1a2e' : '#ffffff',
  };

  const performSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        setSearched(false);
        return;
      }
      setLoading(true);
      const searchResults = await searchArticles(searchQuery);
      setResults(searchResults);
      setSearched(true);
      setLoading(false);
    }, 500),
    [searchArticles]
  );

  const handleSearch = (text: string) => {
    setQuery(text);
    performSearch(text);
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
          <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
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
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputContainer,
            { backgroundColor: colors.inputBg, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="ابحث في الأخبار..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={handleSearch}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setResults([]);
                setSearched(false);
              }}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            جاري البحث...
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderArticleItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            searched ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  لم يتم العثور على نتائج
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  جرب كلمات بحث أخرى
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  ابحث في الأخبار
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  اكتب كلمة بحث للعثور على الأخبار
                </Text>
              </View>
            )
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
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
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
  listContent: {
    padding: 16,
    paddingTop: 0,
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
  },
  articleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  articleContent: {
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 6,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
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
