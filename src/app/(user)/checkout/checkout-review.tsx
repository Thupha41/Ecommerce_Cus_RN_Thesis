import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  SafeAreaView,
  Platform,
  BackHandler,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { APP_COLOR } from "@/utils/constants";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  AntDesign,
} from "@expo/vector-icons";
import {
  checkoutOrderAPI,
  getDeliveryDefaultByUserAPI,
  getShopByIDAPI,
  getAllDeliveriesAPI,
  placeOrderAPI,
} from "@/utils/api";
import { useCurrentApp } from "@/context/app.context";
import Toast from "react-native-root-toast";

const CheckoutScreen = () => {
  const { appState } = useCurrentApp();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [checkoutData, setCheckoutData] = useState<ICheckoutOrder | null>(null);
  const [address, setAddress] = useState<IDeliveryAddress | null>(null);
  const [addresses, setAddresses] = useState<IDeliveryAddress[]>([]);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [shopData, setShopData] = useState<Record<string, IShop>>({});
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (appState?.user?._id) {
      fetchDefaultAddress();
      if (params.items) {
        try {
          const items = JSON.parse(decodeURIComponent(params.items as string));
          fetchCheckoutData(items);
        } catch (error) {
          console.error("Error parsing items:", error);
          Toast.show("Lỗi khi tải thông tin đơn hàng", {
            duration: Toast.durations.LONG,
            textColor: "white",
            backgroundColor: APP_COLOR.ORANGE,
          });
        }
      }
    }
  }, [appState?.user?._id, params.items]);

  // Handle back button when order is successful
  useEffect(() => {
    if (orderSuccess) {
      const handleBackPress = () => {
        router.push("/(tabs)");
        return true;
      };

      // Add back press listener
      const backHandler =
        Platform.OS === "android"
          ? BackHandler.addEventListener("hardwareBackPress", handleBackPress)
          : null;

      // Clean up function
      return () => {
        if (backHandler) {
          backHandler.remove();
        }
      };
    }
  }, [orderSuccess]);

  const fetchDefaultAddress = async () => {
    try {
      const response = await getDeliveryDefaultByUserAPI();
      if (response.result) {
        setAddress(response.result);
      }
    } catch (error) {
      console.error("Error fetching default address:", error);
    }
  };

  const fetchCheckoutData = async (items: any) => {
    try {
      setLoading(true);
      const response = await checkoutOrderAPI(items);
      if (response.result) {
        setCheckoutData(response.result);

        // Fetch shop data for each shop
        if (response.result.shop_order_ids_new) {
          const shopPromises = response.result.shop_order_ids_new.map((shop) =>
            getShopByIDAPI(shop.shopId)
          );

          const shopResults = await Promise.all(shopPromises);
          const shopDataMap: Record<string, IShop> = {};

          shopResults.forEach((shopResult) => {
            if (shopResult.result) {
              shopDataMap[shopResult.result._id] = shopResult.result;
            }
          });

          setShopData(shopDataMap);
        }
      } else {
        Toast.show("Không thể tải thông tin đơn hàng", {
          duration: Toast.durations.LONG,
          textColor: "white",
          backgroundColor: APP_COLOR.ORANGE,
        });
      }
    } catch (error) {
      console.error("Error fetching checkout data:", error);
      Toast.show("Lỗi khi tải thông tin đơn hàng", {
        duration: Toast.durations.LONG,
        textColor: "white",
        backgroundColor: APP_COLOR.ORANGE,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all delivery addresses
  const fetchAllAddresses = async () => {
    if (!appState?.user?._id) return;

    try {
      setLoadingAddresses(true);
      const response = await getAllDeliveriesAPI();
      if (response.result) {
        setAddresses(response.result);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      Toast.show("Không thể tải danh sách địa chỉ", {
        duration: Toast.durations.SHORT,
        textColor: "white",
        backgroundColor: APP_COLOR.ORANGE,
      });
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Handle opening address modal
  const handleOpenAddressModal = () => {
    fetchAllAddresses();
    setAddressModalVisible(true);
  };

  // Handle selecting an address
  const handleSelectAddress = (selectedAddress: IDeliveryAddress) => {
    setAddress(selectedAddress);
    setAddressModalVisible(false);
  };

  // Format complete address
  const getFormattedAddress = (): string => {
    if (!address) return "Chưa có địa chỉ giao hàng";

    const { shipping_address, personal_detail } = address;
    return `${personal_detail.name} (${personal_detail.phone.replace(
      /(\d{4})(\d{3})(\d{3})/,
      "(+84)$1***$3"
    )})\n${shipping_address.street}, ${shipping_address.ward}, ${
      shipping_address.district
    }, ${shipping_address.province_city}`;
  };

  const formatPrice = (price: number): string => {
    return `${price.toLocaleString("vi-VN")}đ`;
  };

  // Handle placing an order
  const handlePlaceOrder = async () => {
    if (!checkoutData || !address) {
      Toast.show("Vui lòng chọn địa chỉ giao hàng", {
        duration: Toast.durations.LONG,
        textColor: "white",
        backgroundColor: APP_COLOR.ORANGE,
      });
      return;
    }

    try {
      setPlacingOrder(true);

      // Prepare the order request according to IOrderRequest interface
      const orderRequest: any = {
        cartId: appState?.cart?._id,
        shop_order_ids: [],
        delivery_info: {
          personal_detail: {
            name: address.personal_detail.name,
            phone: address.personal_detail.phone,
          },
          shipping_address: {
            province_city: address.shipping_address.province_city,
            district: address.shipping_address.district,
            ward: address.shipping_address.ward,
            street: address.shipping_address.street,
          },
          is_default: address.is_default,
        },
        user_payment: "Cash",
      };

      // Extract order items from checkout data
      if (checkoutData.shop_order_ids_new) {
        checkoutData.shop_order_ids_new.forEach((shop) => {
          const shopOrderItem = {
            shopId: shop.shopId,
            shop_discounts: shop.shop_discounts || [],
            item_products: shop.item_products.map((item) => ({
              productId: item.productId,
              price: item.price,
              quantity: item.quantity,
              sku_id: item.sku_id || undefined,
            })),
          };
          orderRequest.shop_order_ids.push(shopOrderItem);
        });
      }

      const response = await placeOrderAPI(orderRequest);
      console.log(">>> check response", response);
      if (response.result) {
        setOrderSuccess(true);
        setOrderId(response.result._id);
      } else {
        Toast.show("Đặt hàng không thành công. Vui lòng thử lại", {
          duration: Toast.durations.LONG,
          textColor: "white",
          backgroundColor: APP_COLOR.ORANGE,
        });
      }
    } catch (error) {
      console.error("Error placing order:", error);
      Toast.show("Lỗi khi đặt hàng. Vui lòng thử lại", {
        duration: Toast.durations.LONG,
        textColor: "white",
        backgroundColor: APP_COLOR.ORANGE,
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  // Render an address item in the modal
  const renderAddressItem = (item: IDeliveryAddress) => {
    const isSelected = address?._id === item._id;
    const formattedAddress = `${item.shipping_address.street}, ${item.shipping_address.ward}, ${item.shipping_address.district}, ${item.shipping_address.province_city}`;
    const phoneNumber = item.personal_detail.phone.replace(
      /(\d{4})(\d{3})(\d{3})/,
      "(+84)$1***$3"
    );

    return (
      <TouchableOpacity
        style={[styles.addressItem, isSelected && styles.selectedAddressItem]}
        onPress={() => handleSelectAddress(item)}
      >
        <View
          style={[
            styles.addressRadio,
            isSelected
              ? styles.selectedRadioBorder
              : styles.unselectedRadioBorder,
          ]}
        >
          {isSelected ? <View style={styles.radioSelected} /> : null}
        </View>
        <View style={styles.modalAddressContent}>
          <Text style={styles.addressName}>{item.personal_detail.name}</Text>
          <Text style={styles.addressPhone}>{phoneNumber}</Text>
          <Text style={styles.addressText} numberOfLines={2}>
            {formattedAddress}
          </Text>
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Mặc định</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderShopItem = (shop: any, index: number) => {
    // Get shop name from shopData state if available
    const shopId = shop.shopId;
    const shopInfo = shopData[shopId];
    const shopName = shopInfo?.shop_name || `Shop ${index + 1}`;

    return (
      <View key={index} style={styles.shopContainer}>
        <View style={styles.shopHeader}>
          <View style={styles.shopNameContainer}>
            <Text style={styles.shopName}>{shopName}</Text>
          </View>
        </View>

        {shop.item_products.map((product: any, productIndex: number) => (
          <View key={productIndex} style={styles.productContainer}>
            <Image
              source={{ uri: product.product_thumb }}
              style={styles.productImage}
            />
            <View style={styles.productDetails}>
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>

              {product.variants && product.variants.length > 0 && (
                <View style={styles.optionContainer}>
                  <Text style={styles.optionText}>
                    {product.variants
                      .map((v: any) => `${v.name}: ${v.value}`)
                      .join(", ")}
                  </Text>
                </View>
              )}

              <View style={styles.priceQuantityContainer}>
                <Text style={styles.productPrice}>
                  {formatPrice(product.price)}
                </Text>
                <Text style={styles.quantityText}>x{product.quantity}</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.shopFooter}>
          <Text style={styles.shopTotalLabel}>
            Tổng số tiền (
            {shop.item_products.reduce(
              (acc: number, product: any) => acc + product.quantity,
              0
            )}{" "}
            sản phẩm):
          </Text>
          <Text style={styles.shopTotalPrice}>
            {formatPrice(shop.priceApplyDiscount)}
          </Text>
        </View>
      </View>
    );
  };

  // Calculate total number of items
  const getTotalItems = (): number => {
    if (!checkoutData?.shop_order_ids_new) return 0;

    return checkoutData.shop_order_ids_new.reduce((total, shop) => {
      return (
        total +
        shop.item_products.reduce((shopTotal, product) => {
          return shopTotal + product.quantity;
        }, 0)
      );
    }, 0);
  };

  // Render success screen
  const renderOrderSuccess = () => {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <AntDesign name="checkcircle" size={64} color="#00c851" />
          </View>
          <Text style={styles.successTitle}>Cảm ơn bạn đã đặt hàng!</Text>
          <Text style={styles.successMessage}>
            Bạn sẽ nhận được thông tin cập nhật trong hộp thư đến thông báo.
          </Text>

          <View style={styles.successButtonsContainer}>
            <TouchableOpacity
              style={styles.viewOrderButton}
              onPress={() => {
                if (orderId) {
                  router.push({
                    pathname: "/(user)/(order)/[id]",
                    params: { id: orderId },
                  });
                }
              }}
            >
              <Text style={styles.viewOrderButtonText}>Xem đơn hàng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => router.push("/(tabs)")}
            >
              <Text style={styles.homeButtonText}>Quay về trang chủ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={APP_COLOR.ORANGE} />
        <Text style={styles.loadingText}>Đang tải thông tin đơn hàng...</Text>
      </View>
    );
  }

  // Show order success screen if order was placed successfully
  if (orderSuccess) {
    return renderOrderSuccess();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.addressContainer}
            onPress={handleOpenAddressModal}
          >
            <View style={styles.addressHeader}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.addressTitle}>Địa chỉ nhận hàng</Text>
            </View>
            <View style={styles.addressContent}>
              <Text style={styles.addressText}>{getFormattedAddress()}</Text>
              <MaterialIcons
                name="keyboard-arrow-right"
                size={24}
                color="#888"
              />
            </View>
          </TouchableOpacity>

          {checkoutData?.shop_order_ids_new.map((shop, index) =>
            renderShopItem(shop, index)
          )}

          <View style={styles.paymentMethodContainer}>
            <View style={styles.paymentHeader}>
              <FontAwesome name="money" size={20} color="#666" />
              <Text style={styles.paymentTitle}>Phương thức thanh toán</Text>
            </View>
            <View style={styles.paymentOption}>
              <View style={styles.paymentRadio}>
                <View style={styles.radioSelected} />
              </View>
              <View style={styles.codIcon}>
                <Text style={styles.codIconText}>COD</Text>
              </View>
              <Text style={styles.paymentOptionText}>Thanh toán khi giao</Text>
            </View>
          </View>

          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Tóm tắt đơn hàng</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tổng tiền hàng</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(checkoutData?.checkout_order.totalPrice || 0)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm giá</Text>
              <Text style={styles.summaryValue}>
                -{formatPrice(checkoutData?.checkout_order.totalDiscount || 0)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(checkoutData?.checkout_order.feeShip || 0)}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Tổng thanh toán</Text>
              <Text style={styles.totalValue}>
                {formatPrice(checkoutData?.checkout_order.totalCheckout || 0)}
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Fixed Footer */}
        <SafeAreaView style={styles.footerSafeArea}>
          <View style={styles.footer}>
            <View style={styles.footerTotalContainer}>
              <Text style={styles.footerTotalLabel}>
                Tổng thanh toán ({getTotalItems()} sản phẩm)
              </Text>
              <Text style={styles.footerTotalPrice}>
                {formatPrice(checkoutData?.checkout_order.totalCheckout || 0)}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.placeOrderButton,
                placingOrder && styles.placeOrderButtonDisabled,
              ]}
              onPress={handlePlaceOrder}
              disabled={placingOrder || !address}
            >
              {placingOrder ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.placeOrderText}>Đặt hàng</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Address Selection Modal */}
        <Modal
          visible={addressModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAddressModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setAddressModalVisible(false)}
                  style={styles.closeButtonContainer}
                >
                  <AntDesign name="close" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Chọn địa chỉ</Text>
              </View>

              {loadingAddresses ? (
                <View style={styles.loadingAddresses}>
                  <ActivityIndicator size="large" color={APP_COLOR.ORANGE} />
                  <Text style={styles.loadingText}>Đang tải địa chỉ...</Text>
                </View>
              ) : (
                <FlatList
                  data={addresses}
                  renderItem={({ item }) => renderAddressItem(item)}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={styles.addressList}
                  showsVerticalScrollIndicator={false}
                />
              )}

              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={() => {
                  setAddressModalVisible(false);
                  router.push("/");
                }}
              >
                <AntDesign name="plus" size={20} color={APP_COLOR.ORANGE} />
                <Text style={styles.addAddressText}>Thêm địa chỉ mới</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    position: "relative",
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: 0,
    marginBottom: Platform.OS === "ios" ? 90 : 80, // Adjust for iOS safe area
  },
  scrollContentContainer: {
    paddingBottom: 20,
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
  addressContainer: {
    backgroundColor: "white",
    marginBottom: 10,
    padding: 15,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  addressContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  shopContainer: {
    backgroundColor: "white",
    marginBottom: 10,
  },
  shopHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  shopNameContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  shopName: {
    fontSize: 16,
    fontWeight: "500",
  },
  productContainer: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  productImage: {
    width: 80,
    height: 100,
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
  },
  priceQuantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: APP_COLOR.ORANGE,
  },
  quantityText: {
    fontSize: 14,
    color: "#666",
  },
  shopFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  shopTotalLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 10,
  },
  shopTotalPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: APP_COLOR.ORANGE,
  },
  paymentMethodContainer: {
    backgroundColor: "white",
    marginBottom: 10,
    padding: 15,
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  paymentRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: APP_COLOR.ORANGE,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  codIcon: {
    backgroundColor: "#27ae60",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  codIconText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  paymentOptionText: {
    fontSize: 14,
    color: "#333",
  },
  summaryContainer: {
    backgroundColor: "white",
    marginBottom: 10,
    padding: 15,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    color: "#333",
  },
  totalRow: {
    marginTop: 5,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: APP_COLOR.ORANGE,
  },
  bottomSpacing: {
    height: 80,
  },
  footerSafeArea: {
    backgroundColor: "white",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
    height: 150,
  },
  footer: {
    backgroundColor: "white",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  footerTotalContainer: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 14,
    color: "#666",
  },
  footerTotalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: APP_COLOR.ORANGE,
  },
  placeOrderButton: {
    backgroundColor: APP_COLOR.ORANGE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  placeOrderButtonDisabled: {
    backgroundColor: "#ffb0b8",
  },
  placeOrderText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingBottom: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    position: "relative",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  closeButtonContainer: {
    position: "absolute",
    right: 15,
    zIndex: 10,
    padding: 5,
  },
  closeButtonPlaceholder: { width: 24 },
  addressList: {
    paddingHorizontal: 15,
    paddingTop: 5,
  },
  addressItem: {
    flexDirection: "row",
    padding: 15,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedAddressItem: {
    backgroundColor: "#fff9f6",
  },
  addressRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    marginRight: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  selectedRadioBorder: {
    borderColor: APP_COLOR.ORANGE,
  },
  unselectedRadioBorder: {
    borderColor: "#d9d9d9",
  },
  radioSelected: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: APP_COLOR.ORANGE,
  },
  modalAddressContent: {
    flex: 1,
    paddingRight: 5,
  },
  addressName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  defaultBadge: {
    backgroundColor: "#fff0e6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: APP_COLOR.ORANGE,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  defaultText: {
    color: APP_COLOR.ORANGE,
    fontSize: 12,
  },
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 10,
  },
  addAddressText: {
    color: APP_COLOR.ORANGE,
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
  loadingAddresses: {
    padding: 30,
    alignItems: "center",
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
  },
  successButtonsContainer: {
    width: "100%",
  },
  viewOrderButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 15,
  },
  viewOrderButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  homeButton: {
    backgroundColor: APP_COLOR.ORANGE,
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "white",
  },
});

export default CheckoutScreen;
