import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { Search, ShoppingCart, Heart, Bell, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import ProductCard from '../components/product/ProductCard';
import CategoryCard from '../components/category/CategoryCard';
import FlashSaleCard from '../components/flash-sale/FlashSaleCard';
import LiveStreamCard from '../components/live-stream/LiveStreamCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SearchBar from '../components/search/SearchBar';

// Hooks
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useFlashSales } from '../hooks/useFlashSales';
import { useLiveStreams } from '../hooks/useLiveStreams';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useNotifications } from '../hooks/useNotifications';

export default function HomeScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  
  const { featuredProducts, isLoading: productsLoading } = useProducts({ featured: true, limit: 8 });
  const { categories, isLoading: categoriesLoading } = useCategories({ limit: 8 });
  const { flashSales, isLoading: flashSalesLoading } = useFlashSales({ active: true, limit: 3 });
  const { streams, isLoading: streamsLoading } = useLiveStreams({ active: true, limit: 3 });
  const { cartItemsCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { unreadCount } = useNotifications();

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh all data
    await Promise.all([
      featuredProducts.refetch(),
      categories.refetch(),
      flashSales.refetch(),
      streams.refetch(),
    ]);
    setRefreshing(false);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={24} color="#374151" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <SearchBar placeholder="Search products..." />
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{cartItemsCount}</Text>
          <Text style={styles.statLabel}>Cart</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{wishlistCount}</Text>
          <Text style={styles.statLabel}>Wishlist</Text>
        </View>
      </View>
    </View>
  );

  const renderFlashSaleSection = () => {
    if (flashSalesLoading || flashSales.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Flash Sales</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {flashSales.map((sale) => (
            <FlashSaleCard
              key={sale.id}
              flashSale={sale}
              onPress={() => navigation.navigate('FlashSaleDetail', { id: sale.id })}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCategoriesSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onPress={() => navigation.navigate('CategoryProducts', { categoryId: category.id })}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderLiveStreamsSection = () => {
    if (streamsLoading || streams.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Live Shopping</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {streams.map((stream) => (
            <LiveStreamCard
              key={stream.id}
              stream={stream}
              onPress={() => navigation.navigate('LiveStream', { id: stream.id })}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderFeaturedProducts = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Products</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={featuredProducts}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { id: item.id })}
          />
        )}
        contentContainerStyle={styles.productList}
        columnWrapperStyle={styles.productRow}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  if (productsLoading || categoriesLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[
          { type: 'flashSales' },
          { type: 'categories' },
          { type: 'liveStreams' },
          { type: 'featuredProducts' },
        ]}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => {
          switch (item.type) {
            case 'flashSales':
              return renderFlashSaleSection();
            case 'categories':
              return renderCategoriesSection();
            case 'liveStreams':
              return renderLiveStreamsSection();
            case 'featuredProducts':
              return renderFeaturedProducts();
            default:
              return null;
          }
        }}
        ListHeaderComponent={renderHeader()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    color: '#f43f5e',
    fontWeight: '600',
  },
  horizontalScroll: {
    paddingRight: 16,
  },
  productList: {
    paddingBottom: 16,
  },
  productRow: {
    justifyContent: 'space-between',
  },
});