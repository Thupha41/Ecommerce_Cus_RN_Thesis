import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { APP_COLOR } from "@/utils/constants";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { currencyFormatter } from "@/utils/api";

interface StickyBottomProps {
  price: number;
  discountPrice?: number;
  onChat?: () => void;
  onAddToCart?: () => void;
  onBuyWithVoucher?: () => void;
}

const { width: sWidth } = Dimensions.get("window");

const StickyBottom = ({
  price = 318500,
  discountPrice,
  onChat = () => {},
  onAddToCart = () => {},
  onBuyWithVoucher = () => {},
}: StickyBottomProps) => {
  return (
    <View style={styles.container}>
      {/* Chat button */}
      <TouchableOpacity style={styles.chatButton} onPress={onChat}>
        <Ionicons name="chatbubble-ellipses-outline" size={24} color="white" />
        <Text style={styles.chatText}>Chat ngay</Text>
      </TouchableOpacity>

      {/* Add to cart button */}
      <TouchableOpacity style={styles.cartButton} onPress={onAddToCart}>
        <MaterialIcons name="shopping-cart" size={24} color="white" />
        <Text style={styles.cartText}>Thêm vào Giỏ hàng</Text>
      </TouchableOpacity>

      {/* Buy with voucher button */}
      <TouchableOpacity style={styles.buyButton} onPress={onBuyWithVoucher}>
        <Text style={styles.buyText}>
          Mua với voucher{"\n"}
          <Text style={styles.priceText}>{currencyFormatter(price)}</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    height: 60,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  chatButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2e8b57",
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
  },
  chatText: {
    color: "white",
    fontSize: 12,
    marginTop: 2,
  },
  cartButton: {
    flex: 1.5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4682b4",
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
  },
  cartText: {
    color: "white",
    fontSize: 12,
    marginTop: 2,
  },
  buyButton: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: APP_COLOR.ORANGE,
  },
  buyText: {
    color: "white",
    fontSize: 12,
    textAlign: "center",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default StickyBottom;
