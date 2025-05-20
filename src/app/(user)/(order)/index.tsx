import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { APP_COLOR } from "@/utils/constants";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { getOrderHistoryAPI } from "@/utils/api";

const OrderHistory = () => {
  const insets = useSafeAreaInsets();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState<string>(tab || "delivered");
  const [orders, setOrders] = useState<IOrderHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<{
    [key: string]: boolean;
  }>({});

  // Define tabs and their corresponding status values
  const tabs = [
    { label: "Chờ xác nhận", status: "pending", icon: "file-invoice" },
    { label: "Chờ lấy hàng", status: "confirmed", icon: "box" },
    { label: "Chờ giao hàng", status: "shipped", icon: "shipping-fast" },
    { label: "Đã giao", status: "delivered", icon: "check-circle" },
    { label: "Đã hủy", status: "cancelled", icon: "times-circle" },
  ];

  // Toggle expanded state for an order
  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Fetch orders based on the active tab
  const fetchOrders = async (
    status: string,
    setOrders: React.Dispatch<React.SetStateAction<IOrderHistory[]>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOrderHistoryAPI(status);

      // Based on existing code in src/app/(user)/account/order.tsx, the API returns {result: IOrderHistory[]}
      if (response && response.result) {
        // No need to filter orders as the API already returns filtered data
        setOrders(response.result);
      } else {
        // Handle empty response
        setOrders([]);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Không thể tải đơn hàng. Vui lòng thử lại sau.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab, setOrders, setLoading, setError);
  }, [activeTab]);

  // Set header title
  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Lịch sử đơn hàng",
    });
  }, [navigation]);

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
  };

  const renderOrderItem = ({ item }: { item: IOrderHistory }) => {
    // Calculate total products in the order
    const totalProducts = item.order_products.reduce((acc, shop) => {
      return (
        acc +
        shop.item_products.reduce(
          (count, product) => count + product.quantity,
          0
        )
      );
    }, 0);

    // Count unique products (for determining whether to show "Xem thêm")
    const uniqueProductCount = item.order_products.reduce((acc, shop) => {
      return acc + shop.item_products.length;
    }, 0);

    // Calculate total price of the order
    const totalPrice = item.order_products.reduce((acc, shop) => {
      return acc + shop.priceApplyDiscount;
    }, 0);

    // Get the first product to display as the main product
    const firstShop = item.order_products[0];
    const firstProduct = firstShop?.item_products[0];

    if (!firstProduct) return null;

    // Check if this order is expanded
    const isExpanded = expandedOrders[item._id] || false;

    // Get all remaining products for expanded view
    const allProducts = isExpanded
      ? item.order_products.flatMap((shop) =>
          shop.item_products.map((product) => ({
            ...product,
            shopId: shop.shopId,
          }))
        )
      : [];

    return (
      <View style={styles.orderCard}>
        {/* Order header with ID and status */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>
            Đơn hàng {item.order_trackingNumber}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.order_status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusText(item.order_status)}
            </Text>
          </View>
        </View>

        {/* Main product info */}
        <View style={styles.productContainer}>
          <Image
            source={{
              uri: firstProduct.product_thumb,
            }}
            style={styles.productImage}
            resizeMode="cover"
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {firstProduct.name ||
                `Sản phẩm #${firstProduct.productId.slice(-6)}`}
            </Text>

            {/* Show variants if available */}
            {firstProduct.variants &&
              firstProduct.variants.map((variant, idx) => (
                <Text key={idx} style={styles.variantText}>
                  {variant.name}: {variant.value}
                </Text>
              ))}

            <View style={styles.priceQuantityContainer}>
              <Text style={styles.productPrice}>
                {formatPrice(firstProduct.price)}
              </Text>
              <Text style={styles.productQuantity}>
                x{firstProduct.quantity}
              </Text>
            </View>
          </View>
        </View>

        {/* Expanded products view */}
        {isExpanded && allProducts.length > 1 && (
          <View style={styles.expandedProductsContainer}>
            {allProducts.slice(1).map((product, index) => (
              <View key={index} style={styles.expandedProductItem}>
                <Image
                  source={{
                    uri: product.product_thumb,
                  }}
                  style={styles.expandedProductImage}
                  resizeMode="cover"
                />
                <View style={styles.expandedProductInfo}>
                  <Text style={styles.expandedProductName} numberOfLines={2}>
                    {product.name}
                  </Text>

                  {product.variants &&
                    product.variants.map((variant, idx) => (
                      <Text key={idx} style={styles.variantText}>
                        {variant.name}: {variant.value}
                      </Text>
                    ))}

                  <View style={styles.priceQuantityContainer}>
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
        )}

        {/* Show view more button if there are more products */}
        {uniqueProductCount > 1 && (
          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={() => toggleOrderExpand(item._id)}
          >
            <Text style={styles.viewMoreText}>
              {isExpanded ? "Thu gọn" : "Xem thêm"}
            </Text>
            <MaterialIcons
              name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={20}
              color="#777"
            />
          </TouchableOpacity>
        )}

        {/* Order summary */}
        <View style={styles.orderSummary}>
          <Text style={styles.totalLabel}>{totalProducts} sản phẩm</Text>
          <Text style={styles.totalPrice}>{formatPrice(totalPrice)}</Text>
        </View>

        {/* Order actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => router.push(`/(user)/(order)/${item._id}`)}
          >
            <Text style={styles.secondaryButtonText}>Xem chi tiết</Text>
          </TouchableOpacity>

          {item.order_status === "delivered" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
            >
              <Text style={styles.primaryButtonText}>Mua lại</Text>
            </TouchableOpacity>
          )}

          {item.order_status === "pending" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
            >
              <Text style={styles.primaryButtonText}>Hủy đơn</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Helper function to get the display text for a status
  const getStatusText = (status: string): string => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Chờ lấy hàng";
      case "shipped":
        return "Đang giao";
      case "delivered":
        return "Đã giao";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  // Helper function to get color for status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "pending":
        return "#FFA500"; // Orange
      case "confirmed":
        return "#3498db"; // Blue
      case "shipped":
        return "#9b59b6"; // Purple
      case "delivered":
        return "#2ecc71"; // Green
      case "cancelled":
        return "#e74c3c"; // Red
      default:
        return "#95a5a6"; // Gray
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <FlatList
          data={tabs}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === item.status && styles.activeTab,
              ]}
              onPress={() => setActiveTab(item.status)}
            >
              <FontAwesome5
                name={item.icon}
                size={16}
                color={activeTab === item.status ? APP_COLOR.ORANGE : "#777"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === item.status && styles.activeTabText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.status}
          contentContainerStyle={styles.tabList}
        />
      </View>

      {/* Order List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={APP_COLOR.ORANGE} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() =>
              fetchOrders(activeTab, setOrders, setLoading, setError)
            }
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <FontAwesome5 name="box-open" size={50} color="#ccc" />
          <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push("/")}
          >
            <Text style={styles.shopButtonText}>Mua sắm ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={true}
          initialNumToRender={5}
          windowSize={5}
          removeClippedSubviews={false}
          onEndReachedThreshold={0.5}
          bounces={true}
          scrollEventThrottle={16}
          style={styles.scrollContainer}
        />
      )}
    </View>
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
  tabContainer: {
    backgroundColor: "white",
    marginBottom: 8,
  },
  tabList: {
    paddingHorizontal: 10,
  },
  tab: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginRight: 5,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: APP_COLOR.ORANGE,
  },
  tabText: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  activeTabText: {
    color: APP_COLOR.ORANGE,
    fontWeight: "500",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: APP_COLOR.ORANGE,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryText: {
    color: "white",
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 16,
    color: "#777",
    marginTop: 10,
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: APP_COLOR.ORANGE,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 5,
  },
  shopButtonText: {
    color: "white",
    fontWeight: "500",
  },
  ordersList: {
    padding: 10,
    paddingBottom: 60,
  },
  orderCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 10,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  productContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 5,
    marginRight: 10,
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  variantText: {
    fontSize: 12,
    color: "#777",
    marginBottom: 2,
  },
  priceQuantityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "500",
    color: APP_COLOR.ORANGE,
  },
  productQuantity: {
    fontSize: 12,
    color: "#777",
  },
  moreProducts: {
    fontSize: 12,
    color: "#777",
    marginBottom: 10,
  },
  orderSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 13,
    color: "#777",
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: APP_COLOR.ORANGE,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    minWidth: 100,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: APP_COLOR.ORANGE,
  },
  secondaryButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  dangerButton: {
    backgroundColor: "#e74c3c",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "500",
  },
  secondaryButtonText: {
    color: "#555",
    fontWeight: "500",
  },
  expandedProductsContainer: {
    marginBottom: 10,
  },
  expandedProductItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  expandedProductImage: {
    width: 70,
    height: 70,
    borderRadius: 5,
    marginRight: 10,
  },
  expandedProductInfo: {
    flex: 1,
  },
  expandedProductName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
    marginTop: 16,
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    minWidth: 100,
    justifyContent: "center",
  },
  viewMoreText: {
    color: "#777",
    fontWeight: "500",
    marginRight: 5,
  },
});

export default OrderHistory;
