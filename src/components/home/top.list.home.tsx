import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import BannerHome from "./banner.home";
import { useEffect, useState } from "react";
import { getCategoryByLevelAPI } from "@/utils/api";
import { useRouter } from "expo-router";
import { APP_COLOR } from "@/utils/constants";

const styles = StyleSheet.create({
  topList: {
    minHeight: 100,
    marginBottom: 6,
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    marginTop: 15,
  },
  titleText: {
    fontSize: 17,
    fontWeight: "600",
    color: APP_COLOR.ORANGE,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  viewAllText: {
    color: "#5a5a5a",
    fontSize: 14,
  },
});

const TopListHome = () => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await getCategoryByLevelAPI(1);

        // The axios interceptor already extracts the data
        if (response && response.result) {
          setCategories(
            Array.isArray(response.result) ? response.result : [response.result]
          );
        }
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError("Không thể tải danh mục");
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleViewAllPress = () => {
    router.push("/(user)/category/all-categories");
  };

  // https://stackoverflow.com/questions/45939823/react-native-horizontal-flatlist-with-multiple-rows
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
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

  return (
    <View style={styles.topList}>
      <BannerHome />

      <View style={styles.headerContainer}>
        <Text style={styles.titleText}>Danh mục</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={handleViewAllPress}
        >
          <Text style={styles.viewAllText}>Xem tất cả</Text>
          <MaterialIcons name="navigate-next" size={20} color="grey" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        directionalLockEnabled={true}
        alwaysBounceVertical={false}
        style={{ marginVertical: 15 }}
      >
        <FlatList
          contentContainerStyle={{ alignSelf: "flex-start" }}
          numColumns={Math.ceil(categories.length / 2)}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            return (
              <View
                style={{
                  padding: 5,
                  width: 100,
                  alignItems: "center",
                }}
              >
                <Image
                  source={{ uri: item.image }}
                  style={{ height: 35, width: 35 }}
                  defaultSource={require("@/assets/icons/flash-deals.png")}
                />
                <Text style={{ textAlign: "center" }}>
                  {item.category_name}
                </Text>
              </View>
            );
          }}
        />
      </ScrollView>
    </View>
  );
};
export default TopListHome;
