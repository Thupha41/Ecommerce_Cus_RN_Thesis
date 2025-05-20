import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { APP_COLOR } from "@/utils/constants";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { currencyFormatter } from "@/utils/api";

const { height: sHeight, width: sWidth } = Dimensions.get("window");

interface Variation {
  name: string;
  options: string[];
}

interface SKU {
  _id: string;
  sku_tier_idx: number[];
  sku_price: number;
  sku_stock: number;
  sku_image: string;
  product_id: string;
  sku_no: string;
}

interface ProductVariationsModalProps {
  visible: boolean;
  onClose: () => void;
  productName: string;
  productThumb: string;
  variations: Variation[];
  skus: SKU[];
  onAddToCart: (sku: SKU, quantity: number) => void;
}

const ProductVariationsModal = ({
  visible,
  onClose,
  productName,
  productThumb,
  variations,
  skus,
  onAddToCart,
}: ProductVariationsModalProps) => {
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [selectedSKU, setSelectedSKU] = useState<SKU | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [slideAnim] = useState(new Animated.Value(sHeight));

  // Initialize selected options array based on variations length
  useEffect(() => {
    if (visible) {
      if (variations.length > 0) {
        const initialSelections = variations.map((variation, index) =>
          variation.options.length === 1 ? 0 : -1
        );
        setSelectedOptions(initialSelections);
      } else {
        setSelectedOptions([]);
      }

      setQuantity(1);
      setSelectedSKU(null);

      // Start the slide up animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, variations]);

  const handleClose = () => {
    // Start the slide down animation
    Animated.timing(slideAnim, {
      toValue: sHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  // Handle case where there are no variations
  useEffect(() => {
    // If there are no variations or only one SKU, auto-select it
    if (visible && (variations.length === 0 || skus.length === 1)) {
      setSelectedSKU(skus[0] || null);
    }
  }, [visible, variations.length, skus]);

  // Update selected options and find matching SKU
  useEffect(() => {
    // If there's only one SKU, just use it regardless of selections
    if (skus.length === 1) {
      setSelectedSKU(skus[0]);
      return;
    }

    // Only try to find a matching SKU if all options are selected
    if (
      variations.length > 0 &&
      selectedOptions.every((option) => option !== -1)
    ) {
      // Try to find a matching SKU
      let matchingSKU = null;

      for (const sku of skus) {
        // Check if the SKU's tier indexes match our selected options
        // Some APIs might return sku_tier_idx as numbers or strings
        const skuTierIdxString = JSON.stringify(sku.sku_tier_idx);
        const selectedOptionsString = JSON.stringify(selectedOptions);

        if (skuTierIdxString === selectedOptionsString) {
          matchingSKU = sku;
          break;
        }
      }

      if (!matchingSKU && skus.length > 0) {
        for (const sku of skus) {
          let isMatch = true;
          for (let i = 0; i < selectedOptions.length; i++) {
            // Skip if this variation has no selection
            if (selectedOptions[i] === -1) continue;

            // If the SKU doesn't have this tier index or it doesn't match, it's not a match
            if (
              !sku.sku_tier_idx[i] ||
              sku.sku_tier_idx[i] !== selectedOptions[i]
            ) {
              isMatch = false;
              break;
            }
          }

          if (isMatch) {
            matchingSKU = sku;
            break;
          }
        }
      }

      setSelectedSKU(matchingSKU);
    }
  }, [selectedOptions, skus, variations.length]);

  const handleOptionSelect = (variationIndex: number, optionIndex: number) => {
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[variationIndex] = optionIndex;
    setSelectedOptions(newSelectedOptions);
  };

  const increaseQuantity = () => {
    if (selectedSKU && quantity < selectedSKU.sku_stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (selectedSKU) {
      onAddToCart(selectedSKU, quantity);
      handleClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header with close button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Product summary section */}
            <View style={styles.productSummary}>
              <Image
                source={{
                  uri: selectedSKU?.sku_image || productThumb,
                }}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {productName}
                </Text>
                <Text style={styles.productPrice}>
                  {selectedSKU
                    ? currencyFormatter(selectedSKU.sku_price)
                    : "Chọn tùy chọn"}
                </Text>
                {selectedSKU && (
                  <Text style={styles.stockInfo}>
                    Còn {selectedSKU.sku_stock} sản phẩm
                  </Text>
                )}
              </View>
            </View>

            {/* Variations selection - Only show if there are variations with multiple options */}
            {variations.length > 0 &&
              variations.some((v) => v.options.length > 1) &&
              variations.map((variation, variationIndex) => (
                <View
                  key={`variation-${variationIndex}`}
                  style={styles.variationContainer}
                >
                  <Text style={styles.variationName}>{variation.name}</Text>
                  <View style={styles.optionsContainer}>
                    {variation.options.map((option, optionIndex) => (
                      <TouchableOpacity
                        key={`option-${variationIndex}-${optionIndex}`}
                        style={[
                          styles.optionButton,
                          selectedOptions[variationIndex] === optionIndex &&
                            styles.optionButtonSelected,
                        ]}
                        onPress={() =>
                          handleOptionSelect(variationIndex, optionIndex)
                        }
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selectedOptions[variationIndex] === optionIndex &&
                              styles.optionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

            {/* Quantity selector */}
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityTitle}>Số lượng</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    quantity <= 1 && styles.quantityButtonDisabled,
                  ]}
                  onPress={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <AntDesign
                    name="minus"
                    size={16}
                    color={quantity <= 1 ? "#ccc" : "#333"}
                  />
                </TouchableOpacity>

                <View style={styles.quantityDisplay}>
                  <Text style={styles.quantityText}>{quantity}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    (!selectedSKU || quantity >= selectedSKU.sku_stock) &&
                      styles.quantityButtonDisabled,
                  ]}
                  onPress={increaseQuantity}
                  disabled={!selectedSKU || quantity >= selectedSKU.sku_stock}
                >
                  <AntDesign
                    name="plus"
                    size={16}
                    color={
                      !selectedSKU || quantity >= selectedSKU.sku_stock
                        ? "#ccc"
                        : "#333"
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Add to cart button */}
          <TouchableOpacity
            style={[
              styles.addToCartButton,
              !selectedSKU && styles.addToCartButtonDisabled,
            ]}
            onPress={handleAddToCart}
            disabled={!selectedSKU}
          >
            <Text style={styles.addToCartText}>
              {!selectedSKU ? "Vui lòng chọn đủ tùy chọn" : "Thêm vào giỏ hàng"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: sHeight * 0.8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 12,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    maxHeight: sHeight * 0.65,
  },
  productSummary: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  productImage: {
    width: 80,
    height: 100,
    borderRadius: 4,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 16,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: APP_COLOR.ORANGE,
    marginBottom: 4,
  },
  stockInfo: {
    fontSize: 12,
    color: "#666",
  },
  variationContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  variationName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonSelected: {
    borderColor: APP_COLOR.ORANGE,
    backgroundColor: "#FFF7F4",
  },
  optionText: {
    fontSize: 14,
    color: "#666",
  },
  optionTextSelected: {
    color: APP_COLOR.ORANGE,
  },
  quantityContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  quantityTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
  },
  quantityButtonDisabled: {
    borderColor: "#eee",
    backgroundColor: "#f9f9f9",
  },
  quantityDisplay: {
    width: 50,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  quantityText: {
    fontSize: 14,
  },
  addToCartButton: {
    backgroundColor: APP_COLOR.ORANGE,
    padding: 16,
    alignItems: "center",
  },
  addToCartButtonDisabled: {
    backgroundColor: "#ccc",
  },
  addToCartText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ProductVariationsModal;
