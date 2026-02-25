import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Heart, ShoppingCart, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface ProductCardProps {
  product: any;
  onPress: () => void;
  variant?: 'grid' | 'list';
}

export default function ProductCard({ product, onPress, variant = 'grid' }: ProductCardProps) {
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const renderRating = () => {
    if (!product.rating) return null;
    
    return (
      <View style={styles.ratingContainer}>
        <Star size={12} color="#fbbf24" fill="#fbbf24" />
        <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
        <Text style={styles.reviewCount}>({product.reviewCount})</Text>
      </View>
    );
  };

  const renderPrice = () => (
    <View style={styles.priceContainer}>
      {discount > 0 && (
        <Text style={styles.originalPrice}>
          ${product.originalPrice?.toFixed(2)}
        </Text>
      )}
      <Text style={styles.currentPrice}>
        ${product.price.toFixed(2)}
      </Text>
      {discount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{discount}%</Text>
        </View>
      )}
    </View>
  );

  const cardWidth = variant === 'grid' ? (width - 48) / 2 : width - 32;

  return (
    <TouchableOpacity
      style={[styles.container, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.images[0]?.url }}
          style={styles.image}
          resizeMode="cover"
        />
        {product.isFeatured && (
          <LinearGradient
            colors={['#ef4444', '#dc2626']}
            style={styles.featuredBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.featuredText}>Featured</Text>
          </LinearGradient>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        
        {renderRating()}
        
        {renderPrice()}
        
        <View style={styles.actions}>
          <TouchableOpacity style={styles.wishlistButton}>
            <Heart size={16} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartButton}>
            <ShoppingCart size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  reviewCount: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f43f5e',
  },
  discountBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wishlistButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  cartButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f43f5e',
  },
});