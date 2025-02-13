import {
  currencyFormatter,
  getOrderHistoryAPI,
  getURLBaseBackend,
} from "@/utils/api";
import { APP_COLOR } from "@/utils/constants";
import { useEffect, useState } from "react";
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Keyboard, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Camera from "expo-camera";

const AIChatPage = () => {
  const [messages, setMessages] = useState<
    Array<{
      type: "text" | "image";
      content: string;
      sender: "user" | "ai";
    }>
  >([
    {
      type: "text",
      content:
        "Xin chào! Mình là trợ lý AI của bạn tại LazdaMall. Mình đang phát triển nên không phải lúc nào cũng đúng. Bạn có thể phản hồi để giúp mình cải thiện tốt hơn.\n\nMình sẵn sàng giúp bạn với câu hỏi về chính sách và tìm kiếm sản phẩm. Hôm nay bạn cần mình hỗ trợ gì hông? ^^",
      sender: "ai",
    },
  ]);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const suggestedQuestions = [
    "Làm sao để giải trí sau một ngày làm việc căng thẳng?",
    "Làm sao để cải thiện chất lượng không khí trong nhà?",
    "Tôi muốn tìm hiểu về lịch sử thế giới",
    "Nên bắt đầu học guitar như thế nào?",
  ];

  const takePicture = async () => {
    // Request camera permissions using the new API
    const [permission, requestPermission] = Camera.useCameraPermissions();

    if (!permission?.granted) {
      const permissionResult = await requestPermission();
      if (!permissionResult.granted) {
        alert("Sorry, we need camera permissions to make this work!");
        return;
      }
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        console.log("Captured image:", imageUri);

        setMessages((prev) => [
          ...prev,
          {
            type: "image",
            content: imageUri,
            sender: "user",
          },
        ]);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      alert("Failed to take picture");
    }
  };

  const pickImage = async () => {
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert("Sorry, we need gallery permissions to make this work!");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        // Handle the selected image
        console.log("Selected image:", result.assets[0]);
        // You can upload the image or add it to the chat here
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert("Failed to pick image");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // all file types
        multiple: false,
      });

      if (!result.canceled) {
        // Handle the selected document
        console.log("Selected document:", result.assets[0]);
        // You can upload the document or add it to the chat here
      }
    } catch (error) {
      console.error("Error picking document:", error);
      alert("Failed to pick document");
    }
  };

  const renderOptionsModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showOptions}
      onRequestClose={() => setShowOptions(false)}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
        onPress={() => setShowOptions(false)}
      >
        <View
          style={{
            backgroundColor: "white",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
          }}
        >
          <TouchableOpacity
            style={{
              position: "absolute",
              right: 15,
              top: 15,
              zIndex: 1,
            }}
            onPress={() => setShowOptions(false)}
          >
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 15,
              marginTop: 10,
            }}
            onPress={() => {
              setShowOptions(false);
              // Handle take picture
            }}
          >
            <MaterialIcons
              name="camera-alt"
              size={24}
              color={APP_COLOR.ORANGE}
            />
            <Text style={{ marginLeft: 15, fontSize: 16 }}>Chụp Ảnh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 15,
            }}
            onPress={() => {
              setShowOptions(false);
              pickImage();
            }}
          >
            <MaterialIcons name="photo" size={24} color={APP_COLOR.ORANGE} />
            <Text style={{ marginLeft: 15, fontSize: 16 }}>Đính Kèm Ảnh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 15,
            }}
            onPress={() => {
              setShowOptions(false);
              pickDocument();
            }}
          >
            <MaterialIcons
              name="attach-file"
              size={24}
              color={APP_COLOR.ORANGE}
            />
            <Text style={{ marginLeft: 15, fontSize: 16 }}>Đính Kèm Tệp</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View
        style={{
          flex: 1,
          paddingBottom: isKeyboardVisible ? 0 : 60, // Add padding when keyboard is not visible
        }}
      >
        {/* Header */}
        <View
          style={{
            padding: 15,
            borderBottomWidth: 1,
            borderBottomColor: "#eee",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Image
            source={require("@/assets/ai-avatar.png")}
            style={{ width: 30, height: 30, marginRight: 10 }}
          />
          <Text style={{ fontSize: 18, fontWeight: "500" }}>Trợ lý AI</Text>
        </View>

        {/* Chat Area */}
        <ScrollView style={{ flex: 1, padding: 15 }}>
          {messages.map((msg, index) => (
            <View
              key={index}
              style={{
                backgroundColor: "#f0f2ff",
                padding: 15,
                borderRadius: 12,
                marginBottom: 10,
              }}
            >
              <Text>{msg.content}</Text>
            </View>
          ))}

          {/* Suggested Questions */}
          {suggestedQuestions.map((question, index) => (
            <TouchableOpacity
              key={index}
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                padding: 15,
                borderRadius: 8,
                marginBottom: 10,
              }}
            >
              <Text>{question}</Text>
              <Text
                style={{
                  color: "#0066FF",
                  position: "absolute",
                  right: 10,
                  top: 15,
                }}
              >
                ▶
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input Area */}
        <View
          style={{
            padding: 15,
            borderTopWidth: 1,
            borderTopColor: "#eee",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => setShowOptions(true)}
            style={{ marginRight: 10 }}
          >
            <MaterialIcons
              name="add-circle-outline"
              size={24}
              color={APP_COLOR.ORANGE}
            />
          </TouchableOpacity>

          <TextInput
            placeholder="Nhập nội dung chat"
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: "#f5f5f5",
              borderRadius: 20,
            }}
          />
          <TouchableOpacity style={{ marginLeft: 10 }}>
            <MaterialIcons name="send" size={24} color={APP_COLOR.ORANGE} />
          </TouchableOpacity>
        </View>
      </View>

      {renderOptionsModal()}
    </SafeAreaView>
  );
};

export default AIChatPage;
