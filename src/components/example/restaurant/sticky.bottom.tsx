import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  Image,
} from "react-native";
import { APP_COLOR } from "@/utils/constants";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { currencyFormatter, getURLBaseBackend } from "@/utils/api";
import { useCurrentApp } from "@/context/app.context";
import { addProductToCartAPI } from "@/utils/api";
import Toast from "react-native-root-toast";
import { useRef, useState } from "react";
import { EventRegister } from "react-native-event-listeners";

interface StickyBottomProps {
  price: number;
  discountPrice?: number;
  onChat?: () => void;
  onAddToCart?: () => void;
  onBuyWithVoucher?: () => void;
}

const { width: sWidth, height: sHeight } = Dimensions.get("window");

const StickyBottom = ({
  price = 318500,
  discountPrice,
  onChat = () => {},
  onAddToCart = () => {},
  onBuyWithVoucher = () => {},
}: StickyBottomProps) => {
  const { productDetail, appState } = useCurrentApp();
  const animatedValue = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const animatedScale = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const [animating, setAnimating] = useState(false);

  const handleAddToCart = async () => {
    try {
      if (!appState?.user._id) {
        Toast.show("Vui lòng đăng nhập để thêm vào giỏ hàng", {
          duration: Toast.durations.LONG,
          textColor: "white",
          backgroundColor: APP_COLOR.ORANGE,
          opacity: 1,
        });
        return;
      }

      if (!productDetail) {
        Toast.show("Không tìm thấy thông tin sản phẩm", {
          duration: Toast.durations.LONG,
          textColor: "white",
          backgroundColor: APP_COLOR.ORANGE,
          opacity: 1,
        });
        return;
      }

      // Start animation before API call
      startCartAnimation();

      const productData = {
        product_id: productDetail._id,
        shopId: productDetail.product_shop,
        product_quantity: 1,
        name: productDetail.product_name,
        product_price: productDetail.product_price,
      };

      const response = await addProductToCartAPI(productData);

      if (response.result) {
        // Notify header to update cart count
        EventRegister.emit("updateCartCount");

        Toast.show("Đã thêm vào giỏ hàng", {
          duration: Toast.durations.SHORT,
          textColor: "white",
          backgroundColor: APP_COLOR.ORANGE,
          opacity: 1,
        });

        onAddToCart();
      } else {
        const message = Array.isArray(response.message)
          ? response.message[0]
          : response.message;

        Toast.show(message, {
          duration: Toast.durations.LONG,
          textColor: "white",
          backgroundColor: APP_COLOR.ORANGE,
          opacity: 1,
        });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      Toast.show("Có lỗi xảy ra khi thêm vào giỏ hàng", {
        duration: Toast.durations.LONG,
        textColor: "white",
        backgroundColor: APP_COLOR.ORANGE,
        opacity: 1,
      });
    }
  };

  const startCartAnimation = () => {
    if (animating) return;
    setAnimating(true);

    // Reset animation values and make visible
    animatedValue.setValue({ x: 0, y: 0 });
    animatedScale.setValue(0);
    animatedOpacity.setValue(0);

    // First make it appear with a pop effect
    Animated.timing(animatedScale, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.elastic(1.2),
    }).start();

    Animated.timing(animatedOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Get cart icon position from event system
    setTimeout(() => {
      EventRegister.emit(
        "getCartPosition",
        (cartPosition: { x: number; y: number }) => {
          if (cartPosition) {
            console.log("Cart position:", cartPosition);

            // Calculate the distance to move
            // We need to calculate from the center of the screen to the cart icon
            const endX = cartPosition.x - sWidth / 2;
            const endY = (-sHeight + cartPosition.y) * 1.47;

            console.log("Animation will move to:", { endX, endY });

            // Create animation sequence for the flight
            Animated.parallel([
              Animated.timing(animatedValue, {
                toValue: { x: endX, y: endY },
                duration: 800,
                useNativeDriver: true,
                easing: Easing.bezier(0.2, 0.8, 0.2, 1),
              }),
              Animated.timing(animatedScale, {
                toValue: 0.3,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(animatedOpacity, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
              }),
            ]).start(() => {
              // Reset after animation completes
              animatedValue.setValue({ x: 0, y: 0 });
              animatedScale.setValue(0);
              animatedOpacity.setValue(0);
              setAnimating(false);
            });
          } else {
            console.log("No cart position received");
            setAnimating(false);
          }
        }
      );
    }, 300); // Small delay to ensure the initial pop animation is visible
  };

  return (
    <View style={styles.container}>
      {/* Chat button */}
      <TouchableOpacity style={styles.chatButton} onPress={onChat}>
        <Ionicons name="chatbubble-ellipses-outline" size={24} color="white" />
        <Text style={styles.chatText}>Chat ngay</Text>
      </TouchableOpacity>

      {/* Add to cart button */}
      <TouchableOpacity
        style={styles.cartButton}
        onPress={handleAddToCart}
        activeOpacity={0.7}
      >
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

      {/* Animated product that flies to cart - positioned fixed on screen */}
      <Animated.View
        style={[
          styles.flyingProduct,
          {
            transform: [
              { translateX: animatedValue.x },
              { translateY: animatedValue.y },
              { scale: animatedScale },
            ],
            opacity: animatedOpacity,
          },
        ]}
        pointerEvents="none"
      >
        {productDetail?.product_thumb ? (
          <Image
            source={{
              uri: `${productDetail.product_thumb}`,
            }}
            style={styles.flyingProductImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.flyingProductInner} />
        )}
      </Animated.View>
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
  flyingProduct: {
    position: "absolute",
    width: 80, // Larger size for better visibility
    height: 80, // Larger size for better visibility
    top: sHeight / 2 - 40, // Position in center of screen
    left: sWidth / 2 - 40, // Position in center of screen
    zIndex: 9999, // Ensure it's above everything
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  flyingProductImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
  },
  flyingProductInner: {
    width: "100%",
    height: "100%",
    backgroundColor: APP_COLOR.ORANGE,
    borderRadius: 40,
  },
});

export default StickyBottom;
