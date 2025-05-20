import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  Dimensions,
  SafeAreaView,
  TextInput,
  StatusBar as RNStatusBar,
  Platform,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import {
  getChildrenCategoryByParentIDAPI,
  getProductByCategoryIDAPI,
} from "@/utils/api";
import { StatusBar } from "expo-status-bar";
import { APP_COLOR } from "@/utils/constants";
import {
  Ionicons,
  MaterialIcons,
  Feather,
  AntDesign,
} from "@expo/vector-icons";
import ProductCard from "@/components/card/card.product";

const { width: screenWidth } = Dimensions.get("window");
const STATUSBAR_HEIGHT =
  Platform.OS === "ios" ? 44 : RNStatusBar.currentHeight || 0;

// Default image to use when category image is null or empty
const DEFAULT_CATEGORY_IMAGE = "https://via.placeholder.com/100?text=Category";

// Helper function to validate image URL
const getValidImageUrl = (url: string | undefined | null): string => {
  if (!url || url.trim() === "") {
    return DEFAULT_CATEGORY_IMAGE;
  }
  return url;
};

// FallbackImage component that displays a colored box with the first letter when image fails to load
const FallbackImage = ({ name, style }: { name: string; style: any }) => {
  const firstLetter =
    name && name.length > 0 ? name.charAt(0).toUpperCase() : "?";

  return (
    <View
      style={[
        style,
        {
          backgroundColor: APP_COLOR.ORANGE,
          justifyContent: "center",
          alignItems: "center",
        },
      ]}
    >
      <Text
        style={{
          color: "white",
          fontWeight: "bold",
          fontSize: style.height ? style.height * 0.4 : 20,
        }}
      >
        {firstLetter}
      </Text>
    </View>
  );
};

interface ProductsData {
  category: {
    _id: string;
    category_name: string;
    image: string;
    level: number;
    ancestors: Array<{
      _id: string;
      category_name: string;
      category_slug: string;
    }>;
  };
  relatedCategories: ICategory[];
  products: ITopProducts[];
}

const CategoryProductsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [subCategories, setSubCategories] = useState<ICategory[]>([]);
  const [productsData, setProductsData] = useState<ProductsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSubcategoriesExpanded, setIsSubcategoriesExpanded] =
    useState<boolean>(false);

  const handleImageError = (categoryId: string) => {
    setFailedImages((prev) => ({
      ...prev,
      [categoryId]: true,
    }));
  };

  useEffect(() => {
    if (id) {
      fetchData();
    } else {
      setError("Category ID not found");
      setLoading(false);
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch subcategories (level 4 if the current is level 3)
      const subCategoriesResponse = await getChildrenCategoryByParentIDAPI(
        id as string
      );
      if (subCategoriesResponse && subCategoriesResponse.result) {
        const categories = Array.isArray(subCategoriesResponse.result)
          ? subCategoriesResponse.result
          : [subCategoriesResponse.result];
        setSubCategories(categories);
      }

      // Fetch products for this category
      const productsResponse = await getProductByCategoryIDAPI(id as string);
      if (productsResponse && productsResponse.result) {
        setProductsData(productsResponse.result as unknown as ProductsData);
      }

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch category data:", err);
      setError("Không thể tải sản phẩm");
      setLoading(false);
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/category/products/${categoryId}`);
  };

  const toggleSubcategories = () => {
    setIsSubcategoriesExpanded(!isSubcategoriesExpanded);
  };

  const renderSubCategories = () => {
    // Don't render subcategories section if there are none
    if (!subCategories || subCategories.length === 0) return null;

    // Calculate how many subcategories to show
    const displayedCategories = isSubcategoriesExpanded
      ? subCategories
      : subCategories.slice(0, 6);

    // Create rows with 2 subcategories per row
    const rows = [];
    for (let i = 0; i < displayedCategories.length; i += 2) {
      const row = displayedCategories.slice(i, i + 2);
      rows.push(
        <View key={i} style={styles.subcategoryRow}>
          {row.map((category) => (
            <TouchableOpacity
              key={category._id}
              style={styles.subcategoryItem}
              onPress={() => handleCategoryPress(category._id)}
            >
              {category?.image && !failedImages[category._id] ? (
                <Image
                  source={{ uri: getValidImageUrl(category.image) }}
                  style={styles.subcategoryImage}
                  onError={() => handleImageError(category._id)}
                />
              ) : (
                <FallbackImage
                  name={category.category_name}
                  style={styles.subcategoryImage}
                />
              )}
              <Text style={styles.subcategoryName} numberOfLines={2}>
                {category.category_name}
              </Text>
            </TouchableOpacity>
          ))}
          {/* Add empty placeholder if row has only 1 item */}
          {row.length === 1 && <View style={styles.subcategoryItem} />}
        </View>
      );
    }

    return (
      <View style={styles.subcategoriesContainer}>
        {rows}
        {subCategories.length > 6 && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={toggleSubcategories}
          >
            <Text style={styles.expandButtonText}>
              {isSubcategoriesExpanded ? "Thu gọn" : "Xem thêm"}
            </Text>
            <AntDesign
              name={isSubcategoriesExpanded ? "up" : "down"}
              size={16}
              color={APP_COLOR.ORANGE}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderProducts = () => {
    if (
      !productsData ||
      !productsData.products ||
      productsData.products.length === 0
    ) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="category" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>Không có sản phẩm nào</Text>
        </View>
      );
    }

    return (
      <View style={styles.productsContainer}>
        <FlatList
          data={productsData.products}
          numColumns={2}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            if (!item) return null;
            return (
              <View style={styles.productCardContainer}>
                <ProductCard
                  product={item}
                  customStyle={{
                    container: {
                      width: screenWidth / 2 - 6,
                      marginRight: 0,
                      marginBottom: 1,
                      borderRadius: 0,
                      backgroundColor: "white",
                    },
                    image: {
                      height: 250,
                    },
                    content: {
                      padding: 8,
                      paddingBottom: 12,
                      backgroundColor: "white",
                    },
                    name: {
                      fontSize: 13,
                      marginBottom: 6,
                    },
                    price: {
                      fontSize: 16,
                    },
                  }}
                />
              </View>
            );
          }}
          contentContainerStyle={styles.productsGrid}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false} // Parent ScrollView will handle scrolling
        />
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Nội diện các loại"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push("/cart")}
        >
          <Feather name="shopping-cart" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreButton}>
          <Feather name="more-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={APP_COLOR.ORANGE} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#ff424f" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeAreaTop} />

      {renderHeader()}

      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>Mua Sắm Theo Danh Mục</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {renderSubCategories()}
        <View style={styles.filterTabs}>
          <TouchableOpacity style={[styles.filterTab, styles.activeFilterTab]}>
            <Text style={[styles.filterTabText, styles.activeFilterTabText]}>
              Phổ biến
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}>
            <Text style={styles.filterTabText}>Bán chạy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}>
            <Text style={styles.filterTabText}>Hàng mới</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}>
            <Text style={styles.filterTabText}>Giá</Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {renderProducts()}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  safeAreaTop: {
    backgroundColor: "white",
    height: STATUSBAR_HEIGHT,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    height: 56,
  },
  backButton: {
    padding: 6,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 8,
    color: "#333",
    padding: 0,
  },
  cartButton: {
    padding: 6,
    marginRight: 6,
  },
  moreButton: {
    padding: 6,
  },
  categoryHeader: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
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
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  subcategoriesContainer: {
    backgroundColor: "white",
    paddingVertical: 16,
    marginBottom: 8,
  },
  subcategoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  subcategoryItem: {
    width: (screenWidth - 48) / 2,
    alignItems: "center",
  },
  subcategoryImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  subcategoryName: {
    fontSize: 14,
    textAlign: "center",
    color: "#333",
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    padding: 8,
  },
  expandButtonText: {
    fontSize: 14,
    color: APP_COLOR.ORANGE,
    marginRight: 4,
  },
  filterTabs: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    paddingVertical: 4,
  },
  activeFilterTab: {
    borderBottomWidth: 2,
    borderBottomColor: APP_COLOR.ORANGE,
  },
  filterTabText: {
    fontSize: 14,
    color: "#6b7280",
  },
  activeFilterTabText: {
    fontWeight: "600",
    color: APP_COLOR.ORANGE,
  },
  blueText: {
    color: "#3b82f6",
  },
  productsContainer: {
    flex: 1,
  },
  productsGrid: {
    paddingVertical: 0,
    paddingHorizontal: 4,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginHorizontal: 0,
  },
  productCardContainer: {
    width: screenWidth / 2,
    marginBottom: 1,
    paddingHorizontal: 0,
  },
  emptyContainer: {
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#9ca3af",
  },
  bottomPadding: {
    height: 20,
  },
});

export default CategoryProductsScreen;
