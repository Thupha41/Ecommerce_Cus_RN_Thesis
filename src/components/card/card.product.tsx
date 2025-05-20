import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from "react-native";
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
  onPress?: () => void;
  customStyle?: {
    container?: ViewStyle;
    image?: ImageStyle;
    content?: ViewStyle;
    name?: TextStyle;
    price?: TextStyle;
  };
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showFlashSale = false,
  onPress,
  customStyle,
}) => {
  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "đ";
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
    router.push({
      pathname: "/(user)/product/[id]",
      params: { id: product._id },
    });
  };

  return (
    <Pressable onPress={handlePress}>
      <View style={[styles.container, customStyle?.container]}>
        <Image
          style={[styles.image, customStyle?.image]}
          source={{ uri: `${product.product_thumb}` }}
        />
        <View style={[styles.content, customStyle?.content]}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.name, customStyle?.name]}
          >
            {product.product_name}
          </Text>
          <Text style={[styles.price, customStyle?.price]}>
            {formatPrice(product.product_price)}
          </Text>
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
