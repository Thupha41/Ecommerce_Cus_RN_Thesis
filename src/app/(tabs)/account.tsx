import { useCurrentApp } from "@/context/app.context";
import { getURLBaseBackend } from "@/utils/api";
import { APP_COLOR } from "@/utils/constants";
import {
  View,
  Text,
  Image,
  Pressable,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";

const AccountPage = () => {
  const { appState } = useCurrentApp();
  const baseImage = `${getURLBaseBackend()}/images/avatar`;
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn chắc chắn đăng xuất người dùng ?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xác nhận",
        onPress: async () => {
          await AsyncStorage.removeItem("access_token");
          router.replace("/(auth)/welcome");
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Profile Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.profileInfo}>
          <Image
            style={styles.avatar}
            source={{ uri: `${baseImage}/${appState?.user.avatar}` }}
          />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{appState?.user.name}</Text>
            <View style={styles.followInfo}>
              <Text style={styles.followText}>0 Người theo dõi</Text>
              <Text style={styles.followText}>39 Đang theo dõi</Text>
            </View>
          </View>
        </View>

        {/* Profile Completion Alert */}
        <View style={styles.completeProfileAlert}>
          <Feather name="alert-circle" size={20} color={APP_COLOR.ORANGE} />
          <Text style={styles.completeProfileText}>
            Vui lòng chọn Tên, Giới tính, Ngày sinh của bạn{" "}
            <Text style={styles.setupNowText}>Thiết lập ngay</Text>
          </Text>
          <MaterialIcons name="close" size={24} color="gray" />
        </View>
      </View>

      {/* Order Status Section */}
      <View style={styles.orderSection}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderTitle}>Đơn mua</Text>
          <Pressable
            style={styles.viewHistoryBtn}
            onPress={() => router.push("/(user)/(order)")}
          >
            <Text style={styles.viewHistoryText}>Xem lịch sử mua hàng</Text>
            <MaterialIcons name="chevron-right" size={20} color="gray" />
          </Pressable>
        </View>

        <View style={styles.orderStatusContainer}>
          <Pressable
            style={styles.orderStatusItem}
            onPress={() => router.push("/(user)/(order)?tab=pending")}
          >
            <FontAwesome5 name="file-invoice" size={24} color="#333" />
            <Text style={styles.orderStatusText}>Chờ xác nhận</Text>
          </Pressable>

          <Pressable
            style={styles.orderStatusItem}
            onPress={() => router.push("/(user)/(order)?tab=confirmed")}
          >
            <FontAwesome5 name="box" size={24} color="#333" />
            <Text style={styles.orderStatusText}>Chờ lấy hàng</Text>
          </Pressable>

          <Pressable
            style={styles.orderStatusItem}
            onPress={() => router.push("/(user)/(order)?tab=shipped")}
          >
            <FontAwesome5 name="shipping-fast" size={24} color="#333" />
            <Text style={styles.orderStatusText}>Chờ giao hàng</Text>
          </Pressable>

          <Pressable
            style={styles.orderStatusItem}
            onPress={() => router.push("/(user)/(order)?tab=delivered")}
          >
            <View style={styles.badgeContainer}>
              <FontAwesome name="star" size={24} color="#333" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>1</Text>
              </View>
            </View>
            <Text style={styles.orderStatusText}>Đánh giá</Text>
          </Pressable>
        </View>
      </View>

      {/* Account Options */}
      <View style={styles.optionsContainer}>
        <Pressable
          onPress={() => router.navigate("/(user)/account/info")}
          style={styles.optionItem}
        >
          <View style={styles.optionLeft}>
            <Feather name="user-check" size={20} color="green" />
            <Text style={styles.optionText}>Cập nhật thông tin</Text>
          </View>
          <MaterialIcons name="navigate-next" size={24} color="grey" />
        </Pressable>

        <Pressable style={styles.optionItem}>
          <View style={styles.optionLeft}>
            <Ionicons name="location-outline" size={20} color="green" />
            <Text style={styles.optionText}>Địa chỉ</Text>
          </View>
          <MaterialIcons name="navigate-next" size={24} color="grey" />
        </Pressable>

        <Pressable
          onPress={() => router.navigate("/(user)/account/password")}
          style={styles.optionItem}
        >
          <View style={styles.optionLeft}>
            <MaterialIcons name="password" size={20} color="green" />
            <Text style={styles.optionText}>Thay đổi mật khẩu</Text>
          </View>
          <MaterialIcons name="navigate-next" size={24} color="grey" />
        </Pressable>

        <Pressable style={styles.optionItem}>
          <View style={styles.optionLeft}>
            <MaterialIcons name="language" size={20} color="green" />
            <Text style={styles.optionText}>Ngôn ngữ</Text>
          </View>
          <MaterialIcons name="navigate-next" size={24} color="grey" />
        </Pressable>

        <Pressable style={styles.optionItem}>
          <View style={styles.optionLeft}>
            <MaterialIcons name="info-outline" size={20} color="green" />
            <Text style={styles.optionText}>Về ứng dụng</Text>
          </View>
          <MaterialIcons name="navigate-next" size={24} color="grey" />
        </Pressable>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={styles.logoutText}>Đăng Xuất</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: APP_COLOR.ORANGE,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    height: 60,
    width: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 5,
  },
  followInfo: {
    flexDirection: "row",
    gap: 15,
  },
  followText: {
    color: "white",
    fontSize: 14,
  },
  completeProfileAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 5,
    padding: 12,
    marginTop: 5,
  },
  completeProfileText: {
    flex: 1,
    fontSize: 13,
    color: "#333",
    marginHorizontal: 10,
  },
  setupNowText: {
    color: APP_COLOR.ORANGE,
    fontWeight: "500",
  },
  orderSection: {
    backgroundColor: "white",
    marginTop: 10,
    paddingVertical: 12,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  viewHistoryBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewHistoryText: {
    fontSize: 13,
    color: "#666",
  },
  orderStatusContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  orderStatusItem: {
    alignItems: "center",
    width: "25%",
  },
  orderStatusText: {
    fontSize: 12,
    color: "#333",
    marginTop: 5,
    textAlign: "center",
  },
  badgeContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -8,
    backgroundColor: "red",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  optionsContainer: {
    marginTop: 10,
    backgroundColor: "white",
  },
  optionItem: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomColor: "#f0f0f0",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionText: {
    fontSize: 14,
    color: "#333",
  },
  logoutContainer: {
    padding: 15,
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: APP_COLOR.ORANGE,
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  logoutText: {
    color: "white",
    fontSize: 15,
    fontWeight: "500",
  },
});

export default AccountPage;
