import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  TextInput,
  StatusBar,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { APP_COLOR } from "@/utils/constants";
import { useLocalSearchParams, router } from "expo-router";
import { getShopByIDAPI, getAllProductsByShopIDAPI } from "@/utils/api";
import ProductCard from "@/components/card/card.product";
import {
  AntDesign,
  MaterialIcons,
  Ionicons,
  Feather,
} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get("window");

const ShopDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shopData, setShopData] = useState<IShop | null>(null);
  const [products, setProducts] = useState<ITopProducts[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ITopProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("newest");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (id) {
      fetchShopData();
      fetchShopProducts();
    }
  }, [id]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((product) =>
        product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const response = await getShopByIDAPI(id);
      if (response.result) {
        setShopData(response.result);
      }
    } catch (error) {
      console.error("Error fetching shop data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShopProducts = async (
    filter = "newest",
    currentPage = 1,
    append = false
  ) => {
    try {
      if (currentPage === 1) {
        setProductLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Map filter to sortBy parameter
      let sortBy: "created_at" | "sold_quantity" | "price_asc" | "price_desc" =
        "created_at";

      if (filter === "newest") {
        sortBy = "created_at";
      } else if (filter === "best-selling") {
        sortBy = "sold_quantity";
      } else if (filter === "price") {
        sortBy = sortOrder === "ASC" ? "price_asc" : "price_desc";
      }

      const response = await getAllProductsByShopIDAPI(id, sortBy, currentPage);
      if (response.result && response.result.products) {
        const newProducts = response.result.products;
        setTotalProducts(response.result.total);

        // If we got fewer products than the limit or we're on the last page
        if (
          newProducts.length === 0 ||
          currentPage >= response.result.totalPages
        ) {
          setHasMore(false);
        }

        if (append) {
          const updatedProducts = [...products, ...newProducts];
          setProducts(updatedProducts);
          setFilteredProducts(updatedProducts);
        } else {
          setProducts(newProducts);
          setFilteredProducts(newProducts);
          setHasMore(currentPage < response.result.totalPages);
        }
      }
    } catch (error) {
      console.error("Error fetching shop products:", error);
    } finally {
      setProductLoading(false);
      setLoadingMore(false);
    }
  };

  const handleFilterChange = (filter: string) => {
    // If price filter is selected and it's already active, toggle the sort order
    if (filter === "price" && activeFilter === "price") {
      const newOrder = sortOrder === "ASC" ? "DESC" : "ASC";
      setSortOrder(newOrder);
    }

    setActiveFilter(filter);
    setPage(1); // Reset to first page when changing filters
    fetchShopProducts(filter, 1, false);
  };

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchShopProducts(activeFilter, nextPage, true);
    }
  }, [page, loadingMore, hasMore, activeFilter]);

  const renderShopBanner = () => {
    if (loading) return null;

    return (
      <View style={styles.bannerContainer}>
        {shopData?.shop_banner ? (
          <Image
            source={{ uri: shopData.shop_banner }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.defaultBanner}>
            <Text style={styles.defaultBannerText}>{shopData?.shop_name}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderShopInfo = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APP_COLOR.ORANGE} />
        </View>
      );
    }

    return (
      <View style={styles.shopInfoContainer}>
        <View style={styles.shopHeader}>
          {shopData?.shop_logo ? (
            <Image
              source={{ uri: shopData.shop_logo }}
              style={styles.shopLogo}
            />
          ) : (
            <View style={styles.defaultLogo}>
              <Text style={styles.defaultLogoText}>
                {shopData?.shop_name?.charAt(0) || "S"}
              </Text>
            </View>
          )}

          <View style={styles.shopDetails}>
            <Text style={styles.shopName}>{shopData?.shop_name}</Text>
            <View style={styles.shopStats}>
              <View style={styles.statItem}>
                <AntDesign name="star" size={16} color="#FFD700" />
                <Text style={styles.statText}>
                  {shopData?.shop_rating?.toFixed(1) || "0.0"}
                </Text>
              </View>
              <Text style={styles.statDivider}>|</Text>
              <Text style={styles.statText}>
                {shopData?.follower_count || 0} Người theo dõi
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.followButton}
            onPress={() => console.log("Follow button pressed")}
          >
            <Text style={styles.followButtonText}>
              {shopData?.is_followed ? "Đang theo dõi" : "Theo dõi"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.shopInfoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoTitle}>Đánh giá</Text>
            <Text style={styles.infoValue}>
              {shopData?.shop_rating?.toFixed(1) || "0.0"}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoTitle}>Tỉ lệ phản hồi</Text>
            <Text style={styles.infoValue}>
              {shopData?.shop_response_rate || 0}%
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoTitle}>Tham gia</Text>
            <Text style={styles.infoValue}>
              {shopData?.created_at
                ? new Date(shopData.created_at).getFullYear()
                : "N/A"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderProductFilters = () => {
    return (
      <View style={styles.filterContainer}>
        <View style={styles.filterHeader}>
          <Text style={styles.productCount}>{totalProducts} sản phẩm</Text>
          <Text style={styles.sortByText}>Sắp xếp theo</Text>
        </View>
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "newest" && styles.activeFilterButton,
            ]}
            onPress={() => handleFilterChange("newest")}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === "newest" && styles.activeFilterText,
              ]}
            >
              Mới nhất
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "best-selling" && styles.activeFilterButton,
            ]}
            onPress={() => handleFilterChange("best-selling")}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === "best-selling" && styles.activeFilterText,
              ]}
            >
              Bán chạy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "price" && styles.activeFilterButton,
            ]}
            onPress={() => handleFilterChange("price")}
          >
            <View style={styles.priceFilterContent}>
              <Text
                style={[
                  styles.filterText,
                  activeFilter === "price" && styles.activeFilterText,
                ]}
              >
                Giá
              </Text>
              {activeFilter === "price" && (
                <MaterialIcons
                  name={sortOrder === "ASC" ? "arrow-upward" : "arrow-downward"}
                  size={16}
                  color={APP_COLOR.ORANGE}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={APP_COLOR.ORANGE} />
        <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
      </View>
    );
  };

  const renderProducts = () => {
    if (productLoading && page === 1) {
      return (
        <View style={styles.productLoadingContainer}>
          <ActivityIndicator size="large" color={APP_COLOR.ORANGE} />
        </View>
      );
    }

    if (!filteredProducts || filteredProducts.length === 0) {
      return (
        <View style={styles.emptyProductsContainer}>
          <Text style={styles.emptyProductsText}>
            {searchQuery
              ? "Không tìm thấy sản phẩm phù hợp"
              : "Không có sản phẩm nào"}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.productsListContainer}>
        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item._id || Math.random().toString()}
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
          contentContainerStyle={styles.productsContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          initialNumToRender={6}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="transparent"
        translucent
        barStyle="light-content"
      />

      {/* Banner */}
      {renderShopBanner()}

      {/* Header với thanh search */}
      <View style={styles.headerOverlay}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.headerSearchContainer}>
            <View style={styles.searchInputContainer}>
              <Feather
                name="search"
                size={18}
                color="#666"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm sản phẩm trong Shop"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Feather name="x" size={18} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.headerRight} />
        </View>
      </View>

      {/* Shop Info on top of banner */}
      <View style={styles.shopInfoOverlay}>{renderShopInfo()}</View>

      <View style={styles.content}>
        {renderProductFilters()}
        {renderProducts()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  bannerContainer: {
    width: "100%",
    height: 290,
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  defaultBanner: {
    width: "100%",
    height: "100%",
    backgroundColor: APP_COLOR.ORANGE,
    justifyContent: "center",
    alignItems: "center",
  },
  defaultBannerText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    padding: 5,
  },
  headerSearchContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerRight: {
    width: 34,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 36,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 14,
    color: "#333",
  },
  content: {
    flex: 1,
    marginTop: 310,
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  shopInfoOverlay: {
    position: "absolute",
    top: 130,
    left: 0,
    right: 0,
    zIndex: 3,
  },
  shopInfoContainer: {
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  shopHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  shopLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "white",
  },
  defaultLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: APP_COLOR.ORANGE,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 2,
    borderColor: "white",
  },
  defaultLogoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "white",
  },
  shopStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 14,
    color: "#eee",
    marginLeft: 4,
  },
  statDivider: {
    marginHorizontal: 8,
    color: "#ccc",
  },
  followButton: {
    backgroundColor: APP_COLOR.ORANGE,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
  },
  followButtonText: {
    color: "white",
    fontWeight: "500",
  },
  shopInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
    paddingBottom: 5,
  },
  infoItem: {
    alignItems: "center",
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    color: "#ccc",
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  searchContainer: {
    backgroundColor: "white",
    padding: 10,
    marginBottom: 10,
  },
  filterContainer: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  filtersRow: {
    flexDirection: "row",
  },
  productCount: {
    fontSize: 14,
    fontWeight: "bold",
  },
  sortByText: {
    fontSize: 14,
    color: "#666",
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
  },
  activeFilterButton: {
    borderColor: APP_COLOR.ORANGE,
    backgroundColor: "rgba(244, 81, 30, 0.1)",
  },
  filterText: {
    color: "#666",
    fontSize: 14,
  },
  activeFilterText: {
    color: APP_COLOR.ORANGE,
    fontWeight: "bold",
  },
  priceFilterContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  productsContainer: {
    paddingVertical: 0,
    paddingHorizontal: 4,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginHorizontal: 0,
  },
  productCardContainer: {
    width: screenWidth / 2 - 8,
    marginBottom: 1,
    paddingHorizontal: 0,
  },
  productLoadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyProductsContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyProductsText: {
    fontSize: 16,
    color: "#666",
  },
  productsListContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  footerLoader: {
    padding: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  loadingMoreText: {
    color: "#666",
    fontSize: 14,
    marginLeft: 10,
  },
});

export default ShopDetailScreen;
