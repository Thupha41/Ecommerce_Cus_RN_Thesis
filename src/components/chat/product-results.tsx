import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import ProductCard from "@/components/card/card.product";
import { router } from "expo-router";

interface ProductResultsProps {
  products: Array<{
    database_id?: string;
    name: string;
    product_thumb?: string;
    price?: number;
    [key: string]: any; // Để có thể nhận bất kỳ thuộc tính nào khác
  }>;
}

const ProductResults: React.FC<ProductResultsProps> = ({ products }) => {
  useEffect(() => {
    // Chỉ log khi products thay đổi
    console.log("Products changed, valid count:", products?.length || 0);
    console.log("Products sample:", products?.slice(0, 2) || []);
  }, [products]);

  if (!products || products.length === 0) {
    return null;
  }

  // Lọc bỏ các item null/undefined trước khi render
  const validProducts = products.filter(
    (item) => item !== null && item !== undefined
  );

  // Trường hợp không có sản phẩm hợp lệ
  if (validProducts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Không có sản phẩm phù hợp</Text>
      </View>
    );
  }

  const renderProductItem = ({ item }: { item: any }) => {
    // Kiểm tra nếu item là null/undefined
    if (!item) {
      return null;
    }

    // Đảm bảo name tồn tại
    if (!item.name) {
      return null;
    }

    // Create a formatted product object compatible with ProductCard
    const productData = {
      _id: item.database_id,
      product_name: item.name,
      product_thumb: item.product_thumb,
      product_price: item.price || 0,
    };

    if (!item.product_thumb) {
      // Nếu không có thumbnail, sử dụng placeholder
      const handlePress = () => {
        router.push({
          pathname: "/(user)/product/[id]",
          params: { id: item.database_id },
        });
      };

      return (
        <TouchableOpacity
          style={styles.container}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <View style={styles.placeholderImage} />
          <View style={styles.content}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.name}>
              {item.name}
            </Text>
            {item.price && (
              <Text style={styles.price}>
                {item.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}đ
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    return <ProductCard product={productData} showFlashSale={false} />;
  };

  return (
    <View style={styles.resultsContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={validProducts}
        renderItem={renderProductItem}
        keyExtractor={(item, index) => `product-${index}`}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  resultsContainer: {
    marginVertical: 10,
  },
  listContainer: {
    paddingHorizontal: 10,
    gap: 8,
  },
  container: {
    backgroundColor: "#efefef",
    borderRadius: 8,
    overflow: "hidden",
    width: 130,
    marginRight: 10,
    marginBottom: 10,
  },
  placeholderImage: {
    height: 120,
    width: "100%",
    backgroundColor: "#f5f5f5",
    marginBottom: 5,
  },
  content: {
    padding: 5,
  },
  name: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f4511e",
    marginBottom: 2,
  },
  emptyContainer: {
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
});

// Sử dụng React.memo để ngăn re-render khi props không thay đổi
export default React.memo(ProductResults);
