import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import ProductCard from "@/components/card/card.product";
import { router } from "expo-router";

interface ProductResultsProps {
  products: Array<{
    product_id: string;
    product_name: string;
    product_thumb?: string;
    product_price?: number;
    return_policies_text?: string;
    specification_text?: string;
  }>;
}

const ProductResults: React.FC<ProductResultsProps> = ({ products }) => {
  if (!products || products.length === 0) {
    console.log("No products or empty array");
    return null;
  }

  // Lọc bỏ các item null/undefined trước khi render
  const validProducts = products.filter(
    (item) => item !== null && item !== undefined
  );

  console.log("Valid products count:", validProducts.length);
  console.log("Products sample:", validProducts.slice(0, 2));

  // Trường hợp không có sản phẩm hợp lệ
  if (validProducts.length === 0) {
    console.log("No valid products after filtering");
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Không có sản phẩm phù hợp</Text>
      </View>
    );
  }

  const renderProductItem = ({ item }: { item: any }) => {
    // Kiểm tra nếu item là null/undefined
    if (!item) {
      console.log("Skipping null/undefined item");
      return null;
    }

    console.log("Rendering item:", item);

    // Đảm bảo product_name tồn tại
    if (!item.product_name) {
      console.log("Item missing product_name:", item);
      return null;
    }

    // Đảm bảo product_id là string
    const productId = item.product_id ? item.product_id.toString() : "";

    // Create a formatted product object compatible with ProductCard
    const productData = {
      _id: productId,
      product_name: item.product_name,
      product_thumb: item.product_thumb,
      product_price: item.product_price || 0,
    };

    // Sử dụng navigationType=byName để chuyển đến trang [name].tsx
    if (!item.product_thumb) {
      // Nếu không có thumbnail, sử dụng placeholder
      const handlePress = () => {
        console.log("Navigating to product:", item.product_name);
        router.push({
          pathname: "/(user)/product/name/[name]",
          params: { name: item.product_name },
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
              {item.product_name}
            </Text>
            {item.product_price && (
              <Text style={styles.price}>
                {item.product_price
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                đ
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    // Sử dụng ProductCard với navigationType=byName
    return (
      <ProductCard
        product={productData}
        showFlashSale={false}
        navigationType="byName"
      />
    );
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

export default ProductResults;
