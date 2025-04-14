import React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { APP_COLOR } from "@/utils/constants";

interface ProductCardProps {
  product: {
    _id: string;
    product_name: string;
    product_thumb: string;
    product_price: number;
  };
  showFlashSale?: boolean;
  navigationType?: "byId" | "byName";
  onPress?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showFlashSale = false,
  navigationType = "byId",
  onPress,
}) => {
  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "đ";
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (navigationType === "byName") {
      router.push({
        pathname: "/(user)/product/name/[name]",
        params: { name: product.product_name },
      });
    } else {
      router.push({
        pathname: "/(user)/product/[id]",
        params: { id: product._id },
      });
    }
  };

  return (
    <Pressable onPress={handlePress}>
      <View style={styles.container}>
        <Image
          style={styles.image}
          source={{ uri: `${product.product_thumb}` }}
        />
        <View style={styles.content}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.name}>
            {product.product_name}
          </Text>
          <Text style={styles.price}>{formatPrice(product.product_price)}</Text>
          {showFlashSale && (
            <View style={styles.saleContainer}>
              <View style={styles.sale}>
                <Text style={styles.saleText}>Flash Sale</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#efefef",
    borderRadius: 8,
    overflow: "hidden",
    width: 130,
    marginRight: 10,
    marginBottom: 10,
  },
  image: {
    height: 130,
    width: "100%",
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
    color: APP_COLOR.ORANGE,
    marginBottom: 2,
  },
  saleContainer: {
    marginTop: 4,
  },
  sale: {
    backgroundColor: "rgba(244, 81, 30, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  saleText: {
    color: APP_COLOR.ORANGE,
    fontSize: 12,
  },
});

export default ProductCard;
