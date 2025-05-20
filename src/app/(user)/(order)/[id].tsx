import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { getOrderDetailAPI, getShopByIDAPI } from "@/utils/api";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { statusBarHeight } from "@/utils/device";
import { APP_COLOR } from "@/utils/constants";

const OrderDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<IOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shopData, setShopData] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await getOrderDetailAPI(id as string);
      if (response.result) {
        setOrder(response.result as IOrder);

        // Fetch shop data for each shop in order_products
        if (
          response.result.order_products &&
          response.result.order_products.length > 0
        ) {
          fetchShopsData(response.result.order_products);
        }
      } else {
        setError("Không thể tải thông tin đơn hàng");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError("Đã có lỗi xảy ra khi tải đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // Fetch shop data for all shops in order
  const fetchShopsData = async (orderProducts: any[]) => {
    try {
      const shopPromises = [];
      const shopIdsMap: string[] = [];

      // Extract shop IDs from order products
      for (const shop of orderProducts) {
        // Use shopId property since that's what's in the API response
        if (shop && shop.shopId) {
          shopPromises.push(getShopByIDAPI(shop.shopId));
          shopIdsMap.push(shop.shopId);
        }
      }

      if (shopPromises.length === 0) return;

      const results = await Promise.all(shopPromises);
      const shopsMap: Record<string, any> = {};

      results.forEach((result, index) => {
        if (result.result) {
          shopsMap[shopIdsMap[index]] = result.result;
        }
      });

      setShopData(shopsMap);
    } catch (error) {
      console.error("Error fetching shop data:", error);
    }
  };

  const formatPrice = (price: number): string => {
    return `${price.toLocaleString("vi-VN")}đ`;
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "shipping":
        return "Chờ chuyển phát";
      case "shipped":
        return "Đang trung chuyển";
      case "delivered":
        return "Đã giao đơn hàng";
      case "cancelled":
        return "Đã hủy";
      case "completed":
        return "Hoàn thành";
      default:
        return "Chờ xác nhận";
    }
  };

  const getStatusStep = (status: string): number => {
    switch (status) {
      case "pending":
        return 0;
      case "confirmed":
      case "shipping":
        return 1;
      case "shipped":
        return 2;
      case "delivered":
      case "completed":
        return 3;
      default:
        return 0;
    }
  };

  // Format date from ISO string to dd/mm/yyyy
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDeliveryDate = (dateString: string): string => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 3); // Estimate delivery date as 3 days from order date
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${day}-${month} tháng ${month}`;
  };

  const renderOrderStatus = () => {
    if (!order) return null;

    const step = getStatusStep(order.order_status);

    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Chờ chuyển phát</Text>
        <Text style={styles.deliveryEstimate}>
          Đang đến {formatDeliveryDate(order.order_createdAt)}
        </Text>

        <View style={styles.statusTracker}>
          {/* Status dots and lines */}
          <View style={styles.statusLine}>
            <View style={[styles.statusDot, { backgroundColor: "#10b981" }]} />
            <View
              style={[
                styles.statusProgress,
                {
                  backgroundColor: step >= 1 ? "#10b981" : "#e5e7eb",
                  flex: 1,
                },
              ]}
            />
            <View
              style={[
                styles.statusDot,
                { backgroundColor: step >= 1 ? "#10b981" : "#e5e7eb" },
              ]}
            />
            <View
              style={[
                styles.statusProgress,
                {
                  backgroundColor: step >= 2 ? "#10b981" : "#e5e7eb",
                  flex: 1,
                },
              ]}
            />
            <View
              style={[
                styles.statusDot,
                { backgroundColor: step >= 2 ? "#10b981" : "#e5e7eb" },
              ]}
            />
            <View
              style={[
                styles.statusProgress,
                {
                  backgroundColor: step >= 3 ? "#10b981" : "#e5e7eb",
                  flex: 1,
                },
              ]}
            />
            <View
              style={[
                styles.statusDot,
                { backgroundColor: step >= 3 ? "#10b981" : "#e5e7eb" },
              ]}
            />
          </View>

          {/* Status labels */}
          <View style={styles.statusLabels}>
            <View style={styles.statusLabelItem}>
              <Text style={[styles.statusLabel, { color: "#10b981" }]}>
                Đã đặt hàng
              </Text>
            </View>

            <View style={styles.statusLabelItem}>
              <Text
                style={[
                  styles.statusLabel,
                  { color: step >= 1 ? "#10b981" : "#9ca3af" },
                ]}
              >
                Chờ chuyển phát
              </Text>
              {step === 1 && (
                <View style={styles.currentStatusIndicator}>
                  <MaterialIcons
                    name="local-shipping"
                    size={24}
                    color="#10b981"
                  />
                </View>
              )}
            </View>

            <View style={styles.statusLabelItem}>
              <Text
                style={[
                  styles.statusLabel,
                  { color: step >= 2 ? "#10b981" : "#9ca3af" },
                ]}
              >
                Đang trung chuyển
              </Text>
              {step === 2 && (
                <View style={styles.currentStatusIndicator}>
                  <MaterialIcons
                    name="local-shipping"
                    size={24}
                    color="#10b981"
                  />
                </View>
              )}
            </View>

            <View style={styles.statusLabelItem}>
              <Text
                style={[
                  styles.statusLabel,
                  { color: step >= 3 ? "#10b981" : "#9ca3af" },
                ]}
              >
                Đã giao đơn hàng
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderDeliveryInfo = () => {
    if (!order || !order.order_shipping) return null;

    const { personal_detail, shipping_address } = order.order_shipping;
    const formattedPhone = personal_detail.phone.replace(
      /(\d{4})(\d{3})(\d{3})/,
      "(+84)$1***$3"
    );

    return (
      <View style={styles.deliveryInfoContainer}>
        <Ionicons name="location-outline" size={22} color="#6b7280" />
        <View style={styles.deliveryInfoContent}>
          <Text style={styles.deliveryName}>
            {personal_detail.name} ({formattedPhone})
          </Text>
          <Text style={styles.deliveryAddress}>
            {shipping_address.street}, {shipping_address.ward},{" "}
            {shipping_address.district}, {shipping_address.province_city}, Việt
            Nam
          </Text>
        </View>
      </View>
    );
  };

  const renderProductItems = () => {
    if (!order || !order.order_products) return null;

    return (
      <View style={styles.productSection}>
        {order.order_products.map((shop: any, shopIndex) => {
          // Using any type for shop
          // Default shop name
          let shopName = "Cửa hàng";

          // Try to get shop name from shop data if we have the shop ID
          const shopId = shop?.shopId; // Optional chaining for safety
          if (shopId && shopData[shopId]) {
            shopName = shopData[shopId].shop_name || shopName;
          }

          return (
            <View key={shopIndex} style={styles.shopContainer}>
              <View style={styles.shopHeader}>
                <View style={styles.shopBadge}>
                  <Text style={styles.shopBadgeText}>Mall</Text>
                </View>
                <Text style={styles.shopName}>{shopName}</Text>
                {shop.shop_discounts?.length > 0 && (
                  <Text style={styles.shopDiscount}>Giảm 300K đ</Text>
                )}
                <TouchableOpacity style={styles.shopActionButton}>
                  <MaterialIcons
                    name="keyboard-arrow-right"
                    size={24}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>

              {shop.item_products.map((product: any, productIndex: number) => (
                <View key={productIndex} style={styles.productItem}>
                  <Image
                    source={{ uri: product.product_thumb }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  <View style={styles.productDetails}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text style={styles.productVariant}>
                      {product.variants
                        ? product.variants
                            .map((v: any) => `${v.name}: ${v.value}`)
                            .join(", ")
                        : "Mặc định"}
                    </Text>
                    <View style={styles.badgeRow}>
                      <View style={styles.authenticBadge}>
                        <MaterialIcons
                          name="verified"
                          size={14}
                          color="#f59e0b"
                        />
                        <Text style={styles.authenticText}>
                          Chính hãng 100%
                        </Text>
                      </View>

                      <View style={styles.authenticBadge}>
                        <MaterialIcons
                          name="local-shipping"
                          size={14}
                          color="#f59e0b"
                        />
                        <Text style={styles.authenticText}>
                          Trả hàng miễn phí
                        </Text>
                      </View>
                    </View>
                    <View style={styles.priceQuantityRow}>
                      <Text style={styles.productPrice}>
                        {formatPrice(product.price)}
                      </Text>
                      <Text style={styles.productQuantity}>
                        x{product.quantity}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    );
  };

  const renderOrderSummary = () => {
    if (!order) return null;

    // Calculate total price from products
    const subtotal = order.order_products.reduce((acc: number, shop: any) => {
      return (
        acc +
        shop.item_products.reduce((shopAcc: number, product: any) => {
          return shopAcc + product.price * product.quantity;
        }, 0)
      );
    }, 0);

    const totalDiscount = order.order_checkout.totalDiscount || 0;
    const sellerDiscount = 0;
    const shippingDiscount = 0;
    const shippingFee = order.order_checkout.feeShip || 0;
    const total = order.order_checkout.totalCheckout;

    return (
      <View style={styles.orderSummaryContainer}>
        <Text style={styles.summaryTitle}>Tổng quan đơn hàng</Text>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Tổng phụ</Text>
          <Text style={styles.summaryValue}>
            {formatPrice(order.order_checkout.totalPrice)}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Vận chuyển</Text>
          <Text style={styles.summaryValue}>{formatPrice(shippingFee)}</Text>
        </View>

        {totalDiscount > 0 && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Phiếu giảm giá</Text>
            <Text style={[styles.summaryValue, styles.discountText]}>
              - {formatPrice(totalDiscount)}
            </Text>
          </View>
        )}

        {sellerDiscount > 0 && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>
              Phiếu giảm giá của người bán
            </Text>
            <Text style={[styles.summaryValue, styles.discountText]}>
              - {formatPrice(sellerDiscount)}
            </Text>
          </View>
        )}

        {shippingDiscount > 0 && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Phiếu giảm giá vận chuyển</Text>
            <Text style={[styles.summaryValue, styles.discountText]}>
              - {formatPrice(shippingDiscount)}
            </Text>
          </View>
        )}

        <View style={styles.summaryItem}>
          <Text style={styles.totalLabel}>Tổng</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>
      </View>
    );
  };

  const renderOrderDetails = () => {
    if (!order) return null;

    return (
      <View style={styles.orderDetailsContainer}>
        <Text style={styles.detailsTitle}>Chi tiết đơn hàng</Text>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Số đơn hàng</Text>
          <View style={styles.orderNumberContainer}>
            <Text style={styles.detailValue}>{order.order_trackingNumber}</Text>
            <TouchableOpacity style={styles.copyButton}>
              <Feather name="copy" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff424f" />
        <Text style={styles.loadingText}>Đang tải thông tin đơn hàng...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#ff424f" />
        <Text style={styles.errorText}>
          {error || "Không tìm thấy đơn hàng"}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)")}
        >
          <Text style={styles.backButtonText}>Quay lại trang chủ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Chờ chuyển phát",
          headerBackTitle: "",
          headerShown: true,
        }}
      />
      <ScrollView style={styles.scrollContainer}>
        {renderOrderStatus()}
        {renderDeliveryInfo()}

        <View style={styles.shippingRow}>
          <Ionicons name="cube-outline" size={20} color="#ff424f" />
          <Text style={styles.shippingText}>Trả hàng miễn phí</Text>
          <MaterialIcons
            name="keyboard-arrow-right"
            size={20}
            color="#9ca3af"
          />
        </View>

        {renderProductItems()}
        {renderOrderSummary()}
        {renderOrderDetails()}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 24,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#ff424f",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  statusContainer: {
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  deliveryEstimate: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 20,
  },
  statusTracker: {
    marginVertical: 10,
  },
  statusLine: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusProgress: {
    height: 3,
  },
  statusLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusLabelItem: {
    alignItems: "center",
    width: 80,
  },
  statusLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  currentStatusIndicator: {
    marginTop: 4,
  },
  deliveryInfoContainer: {
    backgroundColor: "white",
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  deliveryInfoContent: {
    marginLeft: 10,
    flex: 1,
  },
  deliveryName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  deliveryAddress: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  shippingRow: {
    backgroundColor: "white",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  shippingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#ff424f",
    flex: 1,
  },
  productSection: {
    marginBottom: 8,
  },
  shopContainer: {
    backgroundColor: "white",
    marginBottom: 1,
  },
  shopHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  shopBadge: {
    backgroundColor: APP_COLOR.ORANGE,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  shopBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  shopName: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  shopDiscount: {
    fontSize: 14,
    color: "#ff424f",
    marginLeft: 8,
  },
  shopActionButton: {
    padding: 4,
  },
  productItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    marginBottom: 4,
  },
  productVariant: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  authenticBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff8e1",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 8,
    marginBottom: 4,
  },
  authenticText: {
    fontSize: 12,
    color: "#f59e0b",
    marginLeft: 2,
  },
  priceQuantityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  productQuantity: {
    fontSize: 14,
    color: "#6b7280",
  },
  orderSummaryContainer: {
    backgroundColor: "white",
    padding: 16,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 14,
    color: "#000",
  },
  discountText: {
    color: "#ff424f",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ff424f",
  },
  orderDetailsContainer: {
    backgroundColor: "white",
    padding: 16,
    marginBottom: 8,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  detailValue: {
    fontSize: 14,
    color: "#000",
  },
  orderNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    color: "#6b7280",
  },
  recommendedContainer: {
    backgroundColor: "white",
    padding: 16,
    marginBottom: 80,
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  bottomPadding: {
    height: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 130,
    backgroundColor: "white",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
});

export default OrderDetailScreen;
