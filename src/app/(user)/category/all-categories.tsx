import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { APP_COLOR } from "@/utils/constants";
import {
  getCategoryByLevelAPI,
  getChildrenCategoryByParentIDAPI,
} from "@/utils/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";

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

interface Level2WithChildren {
  category: ICategory;
  children: ICategory[];
}

const AllCategoriesScreen = () => {
  const [level1Categories, setLevel1Categories] = useState<ICategory[]>([]);
  const [level2WithChildren, setLevel2WithChildren] = useState<
    Level2WithChildren[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [level2Loading, setLevel2Loading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleImageError = (categoryId: string) => {
    setFailedImages((prev) => ({
      ...prev,
      [categoryId]: true,
    }));
  };

  // Fetch level 1 categories on component mount
  useEffect(() => {
    const fetchLevel1Categories = async () => {
      try {
        setLoading(true);
        const response = await getCategoryByLevelAPI(1);

        if (response && response.result) {
          const categories = Array.isArray(response.result)
            ? response.result
            : [response.result];
          setLevel1Categories(categories);

          // Select the first category by default
          if (categories.length > 0) {
            setSelectedCategory(categories[0]._id);
            fetchLevel2CategoriesWithChildren(categories[0]._id);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch level 1 categories:", err);
        setError("Không thể tải danh mục");
        setLoading(false);
      }
    };

    fetchLevel1Categories();
  }, []);

  // Fetch level 2 categories and their children (level 3) for the selected level 1 category
  const fetchLevel2CategoriesWithChildren = async (parentId: string) => {
    try {
      setLevel2Loading(true);
      setLevel2WithChildren([]); // Clear previous data

      // Fetch level 2 categories
      const response = await getChildrenCategoryByParentIDAPI(parentId);

      if (response && response.result) {
        const level2Categories = Array.isArray(response.result)
          ? response.result
          : [response.result];

        // Array to store level 2 categories with their children
        const categoriesWithChildren: Level2WithChildren[] = [];

        // Fetch children for each level 2 category
        await Promise.all(
          level2Categories.map(async (category) => {
            try {
              const childrenResponse = await getChildrenCategoryByParentIDAPI(
                category._id
              );
              let children: ICategory[] = [];

              if (childrenResponse && childrenResponse.result) {
                children = Array.isArray(childrenResponse.result)
                  ? childrenResponse.result
                  : [childrenResponse.result];
              }

              categoriesWithChildren.push({
                category,
                children,
              });
            } catch (error) {
              console.error(
                `Failed to fetch children for category ${category._id}`,
                error
              );
              categoriesWithChildren.push({
                category,
                children: [],
              });
            }
          })
        );

        setLevel2WithChildren(categoriesWithChildren);
      }
      setLevel2Loading(false);
    } catch (err) {
      console.error("Failed to fetch level 2 categories:", err);
      setLevel2WithChildren([]);
      setLevel2Loading(false);
    }
  };

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryId);
    setSelectedTitle(categoryName);
    fetchLevel2CategoriesWithChildren(categoryId);
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
      <View style={styles.loadingContainer}>
        <Text>{error}</Text>
      </View>
    );
  }

  // Render a grid of categories (3 per row)
  const renderCategoryGrid = (categories: ICategory[]) => {
    const rows = [];
    for (let i = 0; i < categories.length; i += 3) {
      const row = categories.slice(i, i + 3);
      rows.push(
        <View key={i} style={styles.categoryRow}>
          {row.map((category) => (
            <TouchableOpacity
              key={category._id}
              style={styles.categoryCard}
              onPress={() =>
                router.push({
                  pathname: "/category/products/[id]",
                  params: { id: category._id },
                })
              }
            >
              {category?.image && !failedImages[category._id] ? (
                <Image
                  source={{ uri: getValidImageUrl(category.image) }}
                  style={styles.categoryImage}
                  onError={() => handleImageError(category._id)}
                />
              ) : (
                <FallbackImage
                  name={category.category_name}
                  style={styles.categoryImage}
                />
              )}
              <Text style={styles.categoryName} numberOfLines={2}>
                {category.category_name}
              </Text>
            </TouchableOpacity>
          ))}
          {/* Add empty placeholders if row doesn't have 3 items */}
          {row.length < 3 &&
            [...Array(3 - row.length)].map((_, idx) => (
              <View key={`empty-${idx}`} style={styles.emptyCard} />
            ))}
        </View>
      );
    }
    return rows;
  };

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      style={styles.container}
    >
      <StatusBar style="dark" />

      <View style={styles.content}>
        {/* Left sidebar - Level 1 Categories */}
        <View style={styles.sidebarContainer}>
          <ScrollView
            style={styles.sidebar}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sidebarContent}
          >
            {level1Categories.map((category) => (
              <TouchableOpacity
                key={category._id}
                style={[
                  styles.sidebarItem,
                  selectedCategory === category._id &&
                    styles.selectedSidebarItem,
                ]}
                onPress={() =>
                  handleCategoryPress(category._id, category.category_name)
                }
              >
                {category.image && !failedImages[category._id] ? (
                  <Image
                    source={{ uri: getValidImageUrl(category.image) }}
                    style={styles.sidebarIcon}
                    onError={() => handleImageError(category._id)}
                  />
                ) : (
                  <FallbackImage
                    name={category.category_name}
                    style={styles.sidebarIcon}
                  />
                )}
                <Text
                  style={[
                    styles.sidebarText,
                    selectedCategory === category._id &&
                      styles.selectedSidebarText,
                  ]}
                  numberOfLines={2}
                >
                  {category.category_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Right content area */}
        <View style={styles.mainContent}>
          {level2Loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={APP_COLOR.ORANGE} />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Display each level 2 category as a section with its children */}
              {level2WithChildren.map((item, index) => (
                <View key={item.category._id} style={styles.section}>
                  <Text style={styles.contentTitle}>
                    {item.category.category_name}
                  </Text>

                  {item.children.length > 0 ? (
                    renderCategoryGrid(item.children)
                  ) : (
                    <Text style={styles.emptyMessage}>
                      {" "}
                      Không có danh mục con{" "}
                    </Text>
                  )}
                </View>
              ))}
              <View style={styles.bottomPadding} />
            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    marginBottom: 80,
    flex: 1,
    flexDirection: "row",
  },
  sidebarContainer: {
    width: "25%",
    height: "100%",
  },
  sidebar: {
    width: "100%",
    backgroundColor: "#f8f8f8",
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
    height: "100%",
  },
  sidebarContent: {
    paddingBottom: 20,
  },
  sidebarItem: {
    padding: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
    backgroundColor: "#fff",
    flexDirection: "column",
    justifyContent: "center",
  },
  selectedSidebarItem: {
    backgroundColor: "#fff9f6",
    borderLeftWidth: 3,
    borderLeftColor: APP_COLOR.ORANGE,
  },
  sidebarIcon: {
    width: 36,
    height: 36,
    marginBottom: 6,
    resizeMode: "contain",
  },
  sidebarText: {
    fontSize: 13,
    textAlign: "center",
    color: "#666",
    width: "100%",
  },
  selectedSidebarText: {
    color: APP_COLOR.ORANGE,
    fontWeight: "500",
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
    width: "75%",
    height: "100%",
  },
  scrollContent: {
    paddingTop: 5,
    flexGrow: 1,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    color: "#333",
  },
  section: {
    marginBottom: 15,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 5,
    color: "#333",
    borderLeftWidth: 3,
    borderLeftColor: APP_COLOR.ORANGE,
    paddingLeft: 8,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
    width: "100%",
  },
  categoryCard: {
    width: "32%",
    backgroundColor: "#fff",
    padding: 8,
    marginBottom: 5,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  emptyCard: {
    width: "32%",
    backgroundColor: "transparent",
  },
  categoryImage: {
    width: 50,
    height: 50,
    marginBottom: 6,
    resizeMode: "contain",
  },
  categoryName: {
    fontSize: 13,
    textAlign: "center",
    color: "#333",
  },
  emptyMessage: {
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    padding: 10,
  },
  bottomPadding: {
    height: 20,
  },
});

export default AllCategoriesScreen;
