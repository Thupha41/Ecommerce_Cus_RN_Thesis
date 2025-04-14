import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from "react-native";
import { useCurrentApp } from "@/context/app.context";
import {
  getCartItemsAPI,
  deleteCartItemAPI,
  increaseCartItemQuantityAPI,
  decreaseCartItemQuantityAPI,
  getURLBaseBackend,
} from "@/utils/api";
import { APP_COLOR } from "@/utils/constants";
import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import Toast from "react-native-root-toast";
import { EventRegister } from "react-native-event-listeners";

interface CartProduct {
  product_id: string;
  shopId: string;
  product_quantity: number;
  name: string;
  product_price: number;
  product_thumb?: string;
  product_options?: string;
}

interface Shop {
  shopId: string;
  shopName: string;
  products: CartProduct[];
  isSelected: boolean;
  isMall?: boolean;
  isStarShop?: boolean;
  freeShipping?: boolean;
  popularityText?: string;
}

const CartScreen = () => {
  const { appState } = useCurrentApp();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [processingItems, setProcessingItems] = useState<string[]>([]);
  const [allSelected, setAllSelected] = useState(true);

  useEffect(() => {
    if (appState?.user?._id) {
      fetchCartItems(appState.user._id);
    }
  }, [appState?.user?._id]);

  const fetchCartItems = async (userId: string) => {
    try {
      setLoading(true);
      const response = await getCartItemsAPI(userId);

      if (response.result && response.result.cart_products) {
        // Group products by shop
        const shopMap = new Map<string, CartProduct[]>();

        response.result.cart_products.forEach((product) => {
          if (!shopMap.has(product.shopId)) {
            shopMap.set(product.shopId, []);
          }
          shopMap.get(product.shopId)?.push(product);
        });

        // Convert map to array of shop objects with additional properties
        const shopArray: Shop[] = [];
        let index = 0;
        shopMap.forEach((products, shopId) => {
          const shopType = index % 3;
          shopArray.push({
            shopId,
            shopName: getShopName(shopId),
            products,
            isSelected: true,
            isMall: shopType === 0 || shopType === 1,
            isStarShop: shopType === 2,
            freeShipping: true,
          });
          index++;
        });

        setShops(shopArray);
        calculateTotals(shopArray);
      }
    } catch (error) {
      console.error("Error fetching cart items:", error);
      Toast.show("Không thể tải giỏ hàng", {
        duration: Toast.durations.LONG,
        textColor: "white",
        backgroundColor: APP_COLOR.ORANGE,
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get shop name from products
  const getShopName = (shopId: string): string => {
    const shopNames: { [key: string]: string } = {
      "67c13d710a8c0b6ee3abb032": "Trâm Đức",
      "67c13d710a8c0b6ee3abb033": "Hồ_Thảo_Shop",
      "67c13d710a8c0b6ee3abb034": "bluehamos",
    };

    return shopNames[shopId] || "Shop";
  };

  const calculateTotals = (shopList: Shop[]) => {
    let price = 0;
    let items = 0;

    shopList.forEach((shop) => {
      if (shop.isSelected) {
        shop.products.forEach((product) => {
          price += product.product_price * product.product_quantity;
          items += product.product_quantity;
        });
      }
    });

    setTotalPrice(price);
    setTotalItems(items);
    setAllSelected(shopList.every((shop) => shop.isSelected));
  };

  const toggleShopSelection = (shopId: string) => {
    const updatedShops = shops.map((shop) =>
      shop.shopId === shopId ? { ...shop, isSelected: !shop.isSelected } : shop
    );
    setShops(updatedShops);
    calculateTotals(updatedShops);
  };

  const toggleProductSelection = (shopId: string, productId: string) => {
    // In this UI, we select/deselect the entire shop
    toggleShopSelection(shopId);
  };

  const toggleAllSelection = () => {
    const newAllSelected = !allSelected;
    const updatedShops = shops.map((shop) => ({
      ...shop,
      isSelected: newAllSelected,
    }));
    setShops(updatedShops);
    calculateTotals(updatedShops);
    setAllSelected(newAllSelected);
  };

  const handleIncreaseQuantity = async (productId: string, shopId: string) => {
    if (processingItems.includes(productId)) return;

    try {
      setProcessingItems((prev) => [...prev, productId]);
      const response = await increaseCartItemQuantityAPI(productId);

      if (response.result) {
        // Update local state
        const updatedShops = shops.map((shop) => {
          if (shop.shopId === shopId) {
            const updatedProducts = shop.products.map((product) =>
              product.product_id === productId
                ? { ...product, product_quantity: product.product_quantity + 1 }
                : product
            );
            return { ...shop, products: updatedProducts };
          }
          return shop;
        });

        setShops(updatedShops);
        calculateTotals(updatedShops);

        // Notify sticky header to update cart count
        EventRegister.emit("updateCartCount");
      }
    } catch (error) {
      console.error("Error increasing quantity:", error);
      Toast.show("Không thể tăng số lượng", {
        duration: Toast.durations.SHORT,
        textColor: "white",
        backgroundColor: APP_COLOR.ORANGE,
      });
    } finally {
      setProcessingItems((prev) => prev.filter((id) => id !== productId));
    }
  };

  const handleDecreaseQuantity = async (
    productId: string,
    shopId: string,
    currentQuantity: number
  ) => {
    if (processingItems.includes(productId)) return;

    try {
      setProcessingItems((prev) => [...prev, productId]);
      const response = await decreaseCartItemQuantityAPI(productId);

      if (response.result) {
        if (currentQuantity <= 1) {
          // If quantity was 1, the item has been removed from the cart
          const updatedShops = shops.map((shop) => {
            if (shop.shopId === shopId) {
              // Filter out the removed product
              const updatedProducts = shop.products.filter(
                (product) => product.product_id !== productId
              );
              return { ...shop, products: updatedProducts };
            }
            return shop;
          });

          // Remove any shops that now have no products
          const filteredShops = updatedShops.filter(
            (shop) => shop.products.length > 0
          );

          setShops(filteredShops);
          calculateTotals(filteredShops);

          // Notify sticky header to update cart count
          EventRegister.emit("updateCartCount");
        } else {
          // Normal decrease
          const updatedShops = shops.map((shop) => {
            if (shop.shopId === shopId) {
              const updatedProducts = shop.products.map((product) =>
                product.product_id === productId
                  ? {
                      ...product,
                      product_quantity: product.product_quantity - 1,
                    }
                  : product
              );
              return { ...shop, products: updatedProducts };
            }
            return shop;
          });

          setShops(updatedShops);
          calculateTotals(updatedShops);

          // Notify sticky header to update cart count
          EventRegister.emit("updateCartCount");
        }
      }
    } catch (error) {
      console.error("Error decreasing quantity:", error);
      Toast.show("Không thể giảm số lượng", {
        duration: Toast.durations.SHORT,
        textColor: "white",
        backgroundColor: APP_COLOR.ORANGE,
      });
    } finally {
      setProcessingItems((prev) => prev.filter((id) => id !== productId));
    }
  };

  const formatPrice = (price: number): string => {
    return `${price.toLocaleString("vi-VN")}đ`;
  };

  const renderShopItem = (shop: Shop) => {
    return (
      <View style={styles.shopContainer} key={shop.shopId}>
        <View style={styles.shopHeader}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => toggleShopSelection(shop.shopId)}
          >
            <View
              style={[
                styles.checkbox,
                shop.isSelected && styles.checkboxSelected,
              ]}
            >
              {shop.isSelected && (
                <Ionicons name="checkmark" size={18} color="white" />
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.shopNameContainer}>
            {shop.isMall && (
              <View style={styles.mallBadge}>
                <Text style={styles.mallText}>Mall</Text>
              </View>
            )}
            {shop.isStarShop && (
              <View style={styles.starShopBadge}>
                <Text style={styles.starShopText}>Star Shop</Text>
              </View>
            )}
            <Text style={styles.shopName}>{shop.shopName}</Text>
            <MaterialIcons name="keyboard-arrow-right" size={20} color="#888" />
          </View>

          <TouchableOpacity>
            <Text style={styles.editText}>Chỉnh sửa</Text>
          </TouchableOpacity>
        </View>

        {shop.products.map((product) =>
          renderProductItem(product, shop.shopId, shop.isSelected)
        )}

        {shop.popularityText && (
          <Text style={styles.popularityText}>{shop.popularityText}</Text>
        )}
      </View>
    );
  };

  const renderProductItem = (
    product: CartProduct,
    shopId: string,
    isShopSelected: boolean
  ) => {
    // Calculate discount percentage if needed
    const hasDiscount = product.product_id.includes("5");
    const originalPrice = hasDiscount
      ? Math.round(product.product_price * (1 + (Math.random() * 0.3 + 0.1)))
      : 0;
    const discountPercentage = hasDiscount
      ? Math.round((1 - product.product_price / originalPrice) * 100)
      : 0;

    return (
      <View style={styles.productContainer} key={product.product_id}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => toggleProductSelection(shopId, product.product_id)}
        >
          <View
            style={[styles.checkbox, isShopSelected && styles.checkboxSelected]}
          >
            {isShopSelected && (
              <Ionicons name="checkmark" size={18} color="white" />
            )}
          </View>
        </TouchableOpacity>
        <Pressable
          onPress={() =>
            router.navigate({
              pathname: "/product/[id]",
              params: { id: product.product_id },
            })
          }
        >
          <Image
            source={{
              uri: `${product.product_thumb}`,
            }}
            style={styles.productImage}
          />
        </Pressable>

        <View style={styles.productDetails}>
          <Pressable
            onPress={() =>
              router.navigate({
                pathname: "/product/[id]",
                params: { id: product.product_id },
              })
            }
          >
            <Text style={styles.productName} numberOfLines={2}>
              {product.name}
            </Text>
          </Pressable>

          {product.product_options && (
            <View style={styles.optionContainer}>
              <Text style={styles.optionText}>{product.product_options}</Text>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={16}
                color="#888"
              />
            </View>
          )}

          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>
              {formatPrice(product.product_price)}
            </Text>

            {hasDiscount && (
              <>
                <Text style={styles.originalPrice}>
                  {formatPrice(originalPrice)}
                </Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    -{discountPercentage}%
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() =>
                handleDecreaseQuantity(
                  product.product_id,
                  shopId,
                  product.product_quantity
                )
              }
              disabled={processingItems.includes(product.product_id)}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>

            <View style={styles.quantityTextContainer}>
              <Text style={styles.quantityText}>
                {product.product_quantity}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleIncreaseQuantity(product.product_id, shopId)}
              disabled={processingItems.includes(product.product_id)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={APP_COLOR.ORANGE} />
        <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
      </View>
    );
  }

  if (shops.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="shopping-cart" size={60} color="#ccc" />
        <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống</Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => router.push("/")}
        >
          <Text style={styles.shopButtonText}>Mua sắm ngay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng ({totalItems})</Text>
        <TouchableOpacity>
          <Text style={styles.editText}>Chỉnh sửa</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.locationBar}>
        <Ionicons name="location-outline" size={18} color="#666" />
        <Text style={styles.locationText} numberOfLines={1}>
          Đồng Hòa, Dĩ An, Bình Dương, Việt Nam
        </Text>
        <MaterialIcons name="keyboard-arrow-right" size={20} color="#888" />
      </View>

      <View style={styles.voucherNotice}>
        <Ionicons name="car-outline" size={18} color="#00bfa5" />
        <Text style={styles.voucherNoticeText}>
          Tôi đã 3 voucher vận chuyển cho mỗi lần thanh toán
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {shops.map(renderShopItem)}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.selectAllContainer}
          onPress={toggleAllSelection}
        >
          <View
            style={[styles.checkbox, allSelected && styles.checkboxSelected]}
          >
            {allSelected && (
              <Ionicons name="checkmark" size={18} color="white" />
            )}
          </View>
          <Text style={styles.selectAllText}>Tất cả</Text>
        </TouchableOpacity>

        <View style={styles.totalContainer}>
          {totalPrice >= 1000000 ? (
            // Nếu giá trị lớn hơn 1 triệu, hiển thị theo chiều dọc
            <View>
              <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
              <Text style={[styles.totalPrice, styles.largeTotalPrice]}>
                {formatPrice(totalPrice)}
              </Text>
            </View>
          ) : (
            // Nếu giá trị nhỏ hơn 1 triệu, hiển thị theo chiều ngang
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
              <Text style={styles.totalPrice}>{formatPrice(totalPrice)}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.checkoutButton,
            totalItems === 0 && styles.disabledButton,
          ]}
          disabled={totalItems === 0}
        >
          <Text style={styles.checkoutText}>Thanh toán ({totalItems})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: "white",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  locationBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  locationText: {
    flex: 1,
    marginLeft: 5,
    fontSize: 14,
    color: "#333",
  },
  voucherNotice: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#e6f7f5",
  },
  voucherNoticeText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#00bfa5",
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#999",
    marginTop: 10,
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: APP_COLOR.ORANGE,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  shopButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  shopContainer: {
    backgroundColor: "white",
    marginBottom: 10,
    borderRadius: 3,
    overflow: "hidden",
  },
  shopHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  checkboxContainer: {
    marginRight: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: APP_COLOR.ORANGE,
    borderColor: APP_COLOR.ORANGE,
  },
  shopNameContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  shopName: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 5,
  },
  editText: {
    color: APP_COLOR.ORANGE,
    fontSize: 14,
  },
  mallBadge: {
    backgroundColor: "#ee4d2d",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
  },
  mallText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  starShopBadge: {
    backgroundColor: "#ffd700",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
  },
  starShopText: {
    color: "#333",
    fontSize: 12,
    fontWeight: "bold",
  },
  freeShippingNotice: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#f0fffd",
  },
  freeShippingText: {
    marginLeft: 8,
    color: "#00bfa5",
    fontSize: 14,
  },
  productContainer: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 3,
    marginRight: 10,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    marginBottom: 5,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  optionText: {
    fontSize: 12,
    color: "#666",
    marginRight: 5,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: APP_COLOR.ORANGE,
  },
  originalPrice: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
    marginLeft: 5,
  },
  discountBadge: {
    backgroundColor: "#FFF0F1",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    marginLeft: 5,
  },
  discountText: {
    color: APP_COLOR.ORANGE,
    fontSize: 10,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    fontSize: 16,
    color: "#333",
  },
  quantityTextContainer: {
    width: 40,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  quantityText: {
    fontSize: 14,
  },
  popularityText: {
    fontSize: 12,
    color: "#999",
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  voucherSection: {
    backgroundColor: "white",
    marginBottom: 10,
  },
  voucherRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  voucherText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
  },
  flexSpacer: {
    flex: 1,
  },
  bottomSpacing: {
    height: 80,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  selectAllContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  selectAllText: {
    marginLeft: 8,
    fontSize: 14,
  },
  totalContainer: {
    flex: 1,
    justifyContent: "center",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    color: "#333",
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: APP_COLOR.ORANGE,
  },
  largeTotalPrice: {
    fontSize: 18,
    marginTop: 2,
  },
  shippingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  shippingLabel: {
    fontSize: 12,
    color: "#666",
  },
  shippingDiscount: {
    fontSize: 12,
    color: APP_COLOR.ORANGE,
    marginLeft: 5,
  },
  checkoutButton: {
    backgroundColor: APP_COLOR.ORANGE,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 4,
    marginLeft: 10,
  },
  checkoutText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
});

export default CartScreen;
