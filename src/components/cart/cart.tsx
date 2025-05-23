import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Animated,
  PanResponder,
} from "react-native";
import { useCurrentApp } from "@/context/app.context";
import {
  getCartItemsAPI,
  updateCartAPI,
  getShopByIDAPI,
  getProductByIdAPI,
  deleteCartItemBySkuIdAPI,
} from "@/utils/api";
import { APP_COLOR } from "@/utils/constants";
import {
  Feather,
  Ionicons,
  MaterialIcons,
  FontAwesome,
} from "@expo/vector-icons";
import { router } from "expo-router";
import Toast from "react-native-root-toast";
import { EventRegister } from "react-native-event-listeners";
import ProductVariationsModal from "@/components/product/product-variations-modal";

interface CartProduct {
  product_id: string;
  shopId: string;
  product_quantity: number;
  name: string;
  product_price: number;
  product_thumb?: string;
  product_options?: string;
  sku_id?: string;
  variants?: Array<{
    name: string;
    value: string;
  }>;
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
  shopData?: IShop | null;
  selectedProducts?: Record<string, boolean>;
}

const CartScreen = () => {
  const { appState, productDetail, setProductDetail } = useCurrentApp();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [processingItems, setProcessingItems] = useState<string[]>([]);
  const [allSelected, setAllSelected] = useState(true);
  const [loadingShops, setLoadingShops] = useState<Record<string, boolean>>({});
  const [variationsModalVisible, setVariationsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CartProduct | null>(
    null
  );

  // New state for edit mode
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [deletingItems, setDeletingItems] = useState<string[]>([]);

  // Store swipe animations in a ref to persist between renders
  const swipeAnimations = useRef<Record<string, Animated.Value>>({});

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

          // Make sure product_options is included from the API response
          const productWithOptions: CartProduct = {
            ...product,
            product_options:
              product.product_options ||
              (product.variants && product.variants.length > 0
                ? product.variants
                    .map((v) => `${v.name}: ${v.value}`)
                    .join(", ")
                : undefined),
          };

          shopMap.get(product.shopId)?.push(productWithOptions);
        });

        // Convert map to array of shop objects with additional properties
        const shopArray: Shop[] = [];
        let index = 0;
        shopMap.forEach((products, shopId) => {
          const shopType = index % 3;
          // Initialize selectedProducts object with all products selected
          const selectedProducts: Record<string, boolean> = {};
          products.forEach((product) => {
            const productKey = product.sku_id
              ? `${product.product_id}-${product.sku_id}`
              : product.product_id;
            selectedProducts[productKey] = true;
          });

          shopArray.push({
            shopId,
            shopName: getShopName(shopId),
            products,
            isSelected: true,
            isMall: shopType === 0 || shopType === 1,
            isStarShop: shopType === 2,
            freeShipping: true,
            selectedProducts,
          });
          index++;
        });

        setShops(shopArray);
        calculateTotals(shopArray);

        // Fetch shop details for each shop
        shopArray.forEach((shop) => {
          fetchShopDetails(shop.shopId);
        });
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

  // Handle quantity updates with the new API
  const handleUpdateQuantity = async (
    product: CartProduct,
    newQuantity: number
  ) => {
    if (processingItems.includes(product.product_id)) return;
    if (newQuantity < 1) return;

    try {
      setProcessingItems((prev) => [...prev, product.product_id]);

      const updateParams: IUpdateCart = {
        product_id: product.product_id,
        shopId: product.shopId,
        product_quantity: newQuantity,
        old_quantity: product.product_quantity,
        name: product.name,
        product_price: product.product_price,
        sku_id: product.sku_id,
      };

      const response = await updateCartAPI(updateParams);

      if (response.result) {
        // Update local state
        const updatedShops = shops.map((shop) => {
          if (shop.shopId === product.shopId) {
            const updatedProducts = shop.products.map((p) => {
              // Match by both product_id and sku_id if available
              const isMatch = product.sku_id
                ? p.product_id === product.product_id &&
                  p.sku_id === product.sku_id
                : p.product_id === product.product_id;

              return isMatch ? { ...p, product_quantity: newQuantity } : p;
            });

            // If quantity is 0, remove the product
            const filteredProducts =
              newQuantity > 0
                ? updatedProducts
                : updatedProducts.filter(
                    (p) =>
                      !(
                        p.product_id === product.product_id &&
                        (product.sku_id ? p.sku_id === product.sku_id : true)
                      )
                  );

            return { ...shop, products: filteredProducts };
          }
          return shop;
        });

        // Remove shops with no products
        const filteredShops = updatedShops.filter(
          (shop) => shop.products.length > 0
        );

        setShops(filteredShops);
        calculateTotals(filteredShops);

        // Notify sticky header to update cart count
        EventRegister.emit("updateCartCount");
      } else {
        // Show error message
        Toast.show("Không thể cập nhật số lượng", {
          duration: Toast.durations.SHORT,
          textColor: "white",
          backgroundColor: APP_COLOR.ORANGE,
        });
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      Toast.show("Có lỗi xảy ra khi cập nhật số lượng", {
        duration: Toast.durations.SHORT,
        textColor: "white",
        backgroundColor: APP_COLOR.ORANGE,
      });
    } finally {
      setProcessingItems((prev) =>
        prev.filter((id) => id !== product.product_id)
      );
    }
  };

  // Handle changing product variation
  const handleChangeVariation = async (
    originalProduct: CartProduct,
    sku: any,
    quantity: number
  ) => {
    try {
      setProcessingItems((prev) => [...prev, originalProduct.product_id]);

      // Generate new options text based on the selected SKU
      const newOptionsText = getVariationOptionsText(sku.sku_tier_idx);

      const updateParams: IUpdateCart = {
        product_id: originalProduct.product_id,
        shopId: originalProduct.shopId,
        product_quantity: quantity,
        old_quantity: originalProduct.product_quantity,
        name: originalProduct.name,
        product_price: sku.sku_price,
        sku_id: originalProduct.sku_id,
        new_sku_id: sku._id,
        product_options: newOptionsText, // Add the product_options to the API call
      };

      console.log("Updating cart with options:", newOptionsText);

      const response = await updateCartAPI(updateParams);

      if (response.result) {
        // Refresh cart to get updated data
        if (appState?.user?._id) {
          fetchCartItems(appState.user._id);
        }

        Toast.show("Đã cập nhật sản phẩm", {
          duration: Toast.durations.SHORT,
          textColor: "white",
          backgroundColor: APP_COLOR.ORANGE,
        });
      }
    } catch (error) {
      console.error("Error updating product variation:", error);
      Toast.show("Có lỗi xảy ra khi cập nhật sản phẩm", {
        duration: Toast.durations.SHORT,
        textColor: "white",
        backgroundColor: APP_COLOR.ORANGE,
      });
    } finally {
      setProcessingItems((prev) =>
        prev.filter((id) => id !== originalProduct.product_id)
      );
      setVariationsModalVisible(false);
      setSelectedProduct(null);
    }
  };

  // Helper function to convert tier indices to readable options text
  const getVariationOptionsText = (tierIndices: number[]): string => {
    if (!productDetail?.product_variations || !tierIndices) return "";

    return productDetail.product_variations
      .map((variation, index) => {
        if (index >= tierIndices.length) return "";
        const optionIndex = tierIndices[index];
        if (optionIndex >= 0 && optionIndex < variation.options.length) {
          const optionValue = variation.options[optionIndex];
          return `${variation.name}: ${optionValue}`;
        }
        return "";
      })
      .filter((text) => text !== "") // Remove empty strings
      .join(", ");
  };

  const fetchShopDetails = async (shopId: string) => {
    try {
      setLoadingShops((prev) => ({ ...prev, [shopId]: true }));
      const response = await getShopByIDAPI(shopId);

      if (response.result) {
        const shopData = response.result;
        // Update the shops state with the fetched shop data
        setShops((prevShops) =>
          prevShops.map((shop) =>
            shop.shopId === shopId
              ? {
                  ...shop,
                  shopName: shopData.shop_name,
                  shopData: shopData,
                }
              : shop
          )
        );
      }
    } catch (error) {
      console.error(`Error fetching shop details for ${shopId}:`, error);
    } finally {
      setLoadingShops((prev) => ({ ...prev, [shopId]: false }));
    }
  };

  // Helper function to get shop name from products
  const getShopName = (shopId: string): string => {
    // This is a fallback until we get the actual shop name from the API
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
      shop.products.forEach((product) => {
        const productKey = product.sku_id
          ? `${product.product_id}-${product.sku_id}`
          : product.product_id;

        if (shop.selectedProducts && shop.selectedProducts[productKey]) {
          price += product.product_price * product.product_quantity;
          items += product.product_quantity;
        }
      });
    });

    setTotalPrice(price);
    setTotalItems(items);

    // Check if all products in all shops are selected
    const allProductsSelected = shopList.every((shop) =>
      shop.products.every((product) => {
        const productKey = product.sku_id
          ? `${product.product_id}-${product.sku_id}`
          : product.product_id;
        return shop.selectedProducts?.[productKey];
      })
    );

    setAllSelected(allProductsSelected);

    // Update shop selection status based on its products
    const updatedShops = shopList.map((shop) => {
      const allShopProductsSelected = shop.products.every((product) => {
        const productKey = product.sku_id
          ? `${product.product_id}-${product.sku_id}`
          : product.product_id;
        return shop.selectedProducts?.[productKey];
      });

      return {
        ...shop,
        isSelected: allShopProductsSelected,
      };
    });

    if (JSON.stringify(updatedShops) !== JSON.stringify(shopList)) {
      setShops(updatedShops);
    }
  };

  const toggleShopSelection = (shopId: string) => {
    const updatedShops = shops.map((shop) => {
      if (shop.shopId === shopId) {
        const newSelectedState = !shop.isSelected;
        const updatedSelectedProducts = { ...shop.selectedProducts };

        // Update all products in the shop to match the shop's selection state
        shop.products.forEach((product) => {
          const productKey = product.sku_id
            ? `${product.product_id}-${product.sku_id}`
            : product.product_id;
          updatedSelectedProducts[productKey] = newSelectedState;
        });

        return {
          ...shop,
          isSelected: newSelectedState,
          selectedProducts: updatedSelectedProducts,
        };
      }
      return shop;
    });

    setShops(updatedShops);
    calculateTotals(updatedShops);
  };

  const toggleProductSelection = (
    shopId: string,
    productId: string,
    skuId?: string
  ) => {
    const productKey = skuId ? `${productId}-${skuId}` : productId;

    const updatedShops = shops.map((shop) => {
      if (shop.shopId === shopId) {
        const updatedSelectedProducts = { ...shop.selectedProducts };
        // Toggle this specific product's selection
        updatedSelectedProducts[productKey] =
          !updatedSelectedProducts[productKey];

        return {
          ...shop,
          selectedProducts: updatedSelectedProducts,
        };
      }
      return shop;
    });

    setShops(updatedShops);
    calculateTotals(updatedShops);
  };

  const toggleAllSelection = () => {
    const newAllSelected = !allSelected;
    const updatedShops = shops.map((shop) => {
      const updatedSelectedProducts = { ...shop.selectedProducts };

      // Update all products to the new selection state
      shop.products.forEach((product) => {
        const productKey = product.sku_id
          ? `${product.product_id}-${product.sku_id}`
          : product.product_id;
        updatedSelectedProducts[productKey] = newAllSelected;
      });

      return {
        ...shop,
        isSelected: newAllSelected,
        selectedProducts: updatedSelectedProducts,
      };
    });

    setShops(updatedShops);
    calculateTotals(updatedShops);
    setAllSelected(newAllSelected);
  };

  const formatPrice = (price: number): string => {
    return `${price.toLocaleString("vi-VN")}đ`;
  };

  const navigateToShop = (shopId: string) => {
    router.push({
      pathname: `/(user)/shop/[id]`,
      params: { id: shopId },
    });
  };

  // Handle checkout
  const handleCheckout = () => {
    // Collect selected products for checkout
    if (totalItems === 0) return;

    try {
      // Prepare data structure for the checkout API
      const cartId = appState?.cart?._id || "";
      const shopOrderIds: any[] = [];

      shops.forEach((shop) => {
        // Skip shops with no selected products
        const selectedProducts = shop.products.filter((product) => {
          const productKey = product.sku_id
            ? `${product.product_id}-${product.sku_id}`
            : product.product_id;
          return shop.selectedProducts?.[productKey];
        });

        if (selectedProducts.length > 0) {
          const shopOrder = {
            shopId: shop.shopId,
            shop_discounts: [],
            item_products: selectedProducts.map((product) => ({
              productId: product.product_id,
              price: product.product_price,
              quantity: product.product_quantity,
              sku_id: product.sku_id || undefined,
            })),
          };

          shopOrderIds.push(shopOrder);
        }
      });

      // Create the checkout request object
      const checkoutRequest = {
        cartId,
        shop_order_ids: shopOrderIds,
      };

      // Navigate to checkout screen with the items data
      router.push({
        pathname: "/(user)/checkout/checkout-review",
        params: { items: encodeURIComponent(JSON.stringify(checkoutRequest)) },
      });
    } catch (error) {
      console.error("Error preparing checkout data:", error);
      Toast.show("Có lỗi xảy ra khi chuẩn bị thanh toán", {
        duration: Toast.durations.SHORT,
        textColor: "white",
        backgroundColor: APP_COLOR.ORANGE,
      });
    }
  };

  // Open product variations modal when user clicks on options
  const handleOpenOptionsModal = async (product: CartProduct) => {
    setSelectedProduct(product);

    // Check if we already have product details for this product
    if (!productDetail || productDetail._id !== product.product_id) {
      try {
        // Fetch product details if needed
        const response = await getProductByIdAPI(product.product_id);
        if (response.result) {
          // Update the product detail in context
          setProductDetail(response.result);
        } else {
          Toast.show("Không thể tải thông tin sản phẩm", {
            duration: Toast.durations.SHORT,
            textColor: "white",
            backgroundColor: APP_COLOR.ORANGE,
          });
          return;
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
        Toast.show("Có lỗi xảy ra khi tải thông tin sản phẩm", {
          duration: Toast.durations.SHORT,
          textColor: "white",
          backgroundColor: APP_COLOR.ORANGE,
        });
        return;
      }
    }

    // Show the variations modal
    setVariationsModalVisible(true);
  };

  // Create pan responder factory function
  const createPanResponder = (productKey: string) => {
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal movements
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 3);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow left swipe (negative dx)
        if (gestureState.dx < 0) {
          // Limit the swipe to -80 (width of delete button)
          swipeAnimations.current[productKey].setValue(
            Math.max(gestureState.dx, -80)
          );
        } else {
          // For right swipe, smoothly return to 0
          swipeAnimations.current[productKey].setValue(gestureState.dx / 3);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If swiped left enough, snap to show delete button
        if (gestureState.dx < -40) {
          Animated.spring(swipeAnimations.current[productKey], {
            toValue: -80,
            useNativeDriver: true,
            friction: 8,
          }).start();
        } else {
          // Otherwise snap back to original position
          Animated.spring(swipeAnimations.current[productKey], {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    });
  };

  // Store pan responders in a ref
  const panResponders = useRef<Record<string, any>>({});

  // Handle delete cart item
  const handleDeleteCartItem = async (product: CartProduct) => {
    try {
      const productId = product.product_id;
      const skuId = product.sku_id;

      if (!productId) return;

      setDeletingItems((prev) => [...prev, productId]);

      // Call the appropriate API based on whether we have a SKU ID
      if (skuId) {
        await deleteCartItemBySkuIdAPI(productId, skuId);
      } else {
        // Use the regular delete API for products without variations
        await deleteCartItemBySkuIdAPI(productId, "");
      }

      // Update the local state to remove the deleted product
      const updatedShops = shops
        .map((shop) => {
          if (shop.shopId === product.shopId) {
            const updatedProducts = shop.products.filter((p) => {
              if (skuId) {
                return !(p.product_id === productId && p.sku_id === skuId);
              }
              return p.product_id !== productId;
            });

            return {
              ...shop,
              products: updatedProducts,
            };
          }
          return shop;
        })
        .filter((shop) => shop.products.length > 0); // Remove empty shops

      setShops(updatedShops);
      calculateTotals(updatedShops);

      // Update cart count in the header
      EventRegister.emit("updateCartCount");

      Toast.show("Đã xóa sản phẩm khỏi giỏ hàng", {
        duration: Toast.durations.SHORT,
        textColor: "white",
        backgroundColor: APP_COLOR.ORANGE,
      });
    } catch (error) {
      console.error("Error deleting cart item:", error);
      Toast.show("Không thể xóa sản phẩm", {
        duration: Toast.durations.SHORT,
        textColor: "white",
        backgroundColor: APP_COLOR.ORANGE,
      });
    } finally {
      setDeletingItems((prev) =>
        prev.filter((id) => id !== product.product_id)
      );
    }
  };

  // Toggle edit mode for a specific shop
  const toggleEditMode = (shopId: string) => {
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      const isCurrentlyInEditMode = prev[shopId];

      // Toggle the edit mode for this shop
      newEditMode[shopId] = !isCurrentlyInEditMode;

      // If we're entering edit mode, reset all animations for this shop's products
      // If we're exiting edit mode, animate all items back to their original position
      shops.forEach((shop) => {
        if (shop.shopId === shopId) {
          shop.products.forEach((product) => {
            const itemKey = product.sku_id
              ? `${product.product_id}-${product.sku_id}`
              : product.product_id;

            if (swipeAnimations.current[itemKey]) {
              if (isCurrentlyInEditMode) {
                // Exiting edit mode, animate back
                Animated.spring(swipeAnimations.current[itemKey], {
                  toValue: 0,
                  useNativeDriver: true,
                  friction: 8,
                }).start();
              } else {
                // Entering edit mode, animate to show delete
                Animated.spring(swipeAnimations.current[itemKey], {
                  toValue: -80,
                  useNativeDriver: true,
                  friction: 8,
                }).start();
              }
            }
          });
        }
      });

      return newEditMode;
    });
  };

  // Modified renderProductItem to include swipe-to-delete and edit mode delete button
  const renderProductItem = (
    product: CartProduct,
    shopId: string,
    shop: Shop
  ) => {
    // Generate a unique key using both product_id and sku_id if available
    const itemKey = product.sku_id
      ? `${product.product_id}-${product.sku_id}`
      : product.product_id;

    // Check if this specific product is selected
    const isProductSelected = shop.selectedProducts?.[itemKey] ?? false;

    // Check if this shop is in edit mode
    const isInEditMode = editMode[shopId] || false;

    // Initialize animation value for this product if it doesn't exist
    if (!swipeAnimations.current[itemKey]) {
      swipeAnimations.current[itemKey] = new Animated.Value(0);
    }

    // Initialize pan responder for this product if it doesn't exist
    if (!panResponders.current[itemKey]) {
      panResponders.current[itemKey] = createPanResponder(itemKey);
    }

    const translateX = swipeAnimations.current[itemKey];
    const panHandlers = panResponders.current[itemKey].panHandlers;

    const isDeleting = deletingItems.includes(product.product_id);

    return (
      <View style={styles.productItemContainer} key={itemKey}>
        {/* Swipeable container */}
        <Animated.View
          style={[
            styles.productSwipeableContainer,
            { transform: [{ translateX }] },
          ]}
          {...(!isInEditMode ? panHandlers : {})}
        >
          <View style={styles.productContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() =>
                toggleProductSelection(
                  shopId,
                  product.product_id,
                  product.sku_id
                )
              }
            >
              <View
                style={[
                  styles.checkbox,
                  isProductSelected && styles.checkboxSelected,
                ]}
              >
                {isProductSelected && (
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
                <TouchableOpacity
                  style={styles.optionContainer}
                  onPress={() => handleOpenOptionsModal(product)}
                >
                  <Text style={styles.optionText}>
                    {product.product_options}
                  </Text>
                  <MaterialIcons
                    name="keyboard-arrow-down"
                    size={16}
                    color="#888"
                  />
                </TouchableOpacity>
              )}

              <View style={styles.priceContainer}>
                <Text style={styles.productPrice}>
                  {formatPrice(product.product_price)}
                </Text>
              </View>

              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() =>
                    handleUpdateQuantity(product, product.product_quantity - 1)
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
                  onPress={() =>
                    handleUpdateQuantity(product, product.product_quantity + 1)
                  }
                  disabled={processingItems.includes(product.product_id)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Delete button that shows when swiped or in edit mode */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCartItem(product)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <FontAwesome name="trash" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderShopItem = (shop: Shop) => {
    // Check if this shop is in edit mode
    const isInEditMode = editMode[shop.shopId] || false;

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

          <TouchableOpacity
            style={styles.shopNameContainer}
            onPress={() => navigateToShop(shop.shopId)}
          >
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
          </TouchableOpacity>

          <TouchableOpacity onPress={() => toggleEditMode(shop.shopId)}>
            <Text style={styles.editText}>
              {isInEditMode ? "Xong" : "Chỉnh sửa"}
            </Text>
          </TouchableOpacity>
        </View>

        {shop.products.map((product) =>
          renderProductItem(product, shop.shopId, shop)
        )}

        {shop.popularityText && (
          <Text style={styles.popularityText}>{shop.popularityText}</Text>
        )}
      </View>
    );
  };

  // Check if all shops are in edit mode to determine header button text
  const isAnyShopInEditMode = () => {
    return Object.values(editMode).some((value) => value);
  };

  // Toggle edit mode for all shops
  const toggleAllEditMode = () => {
    setEditMode((prev) => {
      const isAnyShopCurrentlyInEditMode = Object.values(prev).some(
        (value) => value
      );
      const newEditMode: Record<string, boolean> = {};

      // Set all shops to the new edit mode state
      shops.forEach((shop) => {
        newEditMode[shop.shopId] = !isAnyShopCurrentlyInEditMode;

        // Animate all items based on the new edit mode
        shop.products.forEach((product) => {
          const itemKey = product.sku_id
            ? `${product.product_id}-${product.sku_id}`
            : product.product_id;

          if (swipeAnimations.current[itemKey]) {
            if (isAnyShopCurrentlyInEditMode) {
              // Exiting edit mode, animate back
              Animated.spring(swipeAnimations.current[itemKey], {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
              }).start();
            } else {
              // Entering edit mode, animate to show delete
              Animated.spring(swipeAnimations.current[itemKey], {
                toValue: -80,
                useNativeDriver: true,
                friction: 8,
              }).start();
            }
          }
        });
      });

      return newEditMode;
    });
  };

  // Render ProductVariationsModal if a product is selected
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng ({totalItems})</Text>
        <View style={styles.headerRightPlaceholder} />
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
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutText}>Thanh toán ({totalItems})</Text>
        </TouchableOpacity>
      </View>

      {/* Variations Modal */}
      {selectedProduct &&
        productDetail?.product_variations &&
        productDetail.product_skus && (
          <ProductVariationsModal
            visible={variationsModalVisible}
            onClose={() => {
              setVariationsModalVisible(false);
              setSelectedProduct(null);
            }}
            productName={selectedProduct.name}
            productThumb={selectedProduct.product_thumb || ""}
            variations={productDetail.product_variations}
            skus={productDetail.product_skus}
            onAddToCart={(sku, quantity) =>
              handleChangeVariation(selectedProduct, sku, quantity)
            }
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "white",
  },
  backButton: {
    width: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  headerRightPlaceholder: {
    width: 24,
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

  productItemContainer: {
    position: "relative",
    flexDirection: "row",
    overflow: "hidden",
  },
  productSwipeableContainer: {
    width: "100%",
    backgroundColor: "white",
    zIndex: 1,
  },
  deleteButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "#ff4d4f",
    justifyContent: "center",
    alignItems: "center",
  },
  editModeDeleteButton: {
    backgroundColor: "#ff4d4f",
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default CartScreen;
