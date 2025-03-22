import {
  currencyFormatter,
  getOrderHistoryAPI,
  getURLBaseBackend,
  chatWithAI,
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
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  const LoadingDots = () => {
    const [dots, setDots] = useState("");

    useEffect(() => {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
      }, 500);

      return () => clearInterval(interval);
    }, []);

    return (
      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        <Image
          source={require("@/assets/ai-avatar.png")}
          style={{
            width: 30,
            height: 30,
            marginRight: 8,
          }}
        />
        <View
          style={{
            backgroundColor: "#f0f2ff",
            padding: 12,
            borderRadius: 16,
            borderBottomLeftRadius: 4,
          }}
        >
          <Text style={{ color: "#000", fontSize: 16 }}>
            {`Đang nhập${dots}`}
          </Text>
        </View>
      </View>
    );
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    // Clear input
    setInputText("");
    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        type: "text",
        content: inputText,
        sender: "user",
      },
    ]);

    setIsLoading(true); // Show loading animation

    try {
      // Call API with default values for user_id and session_id
      const response = await chatWithAI("1", "1", inputText);

      // Add AI response to chat
      if (response.data?.response) {
        setMessages((prev) => [
          ...prev,
          {
            type: "text",
            content: response.data.response,
            sender: "ai",
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Optionally show error message to user
    } finally {
      setIsLoading(false); // Hide loading animation
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
          paddingBottom: isKeyboardVisible ? 0 : 60,
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

        {/* AI Chat Area */}
        <ScrollView style={{ flex: 1, padding: 15 }}>
          {messages.map((msg, index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                justifyContent:
                  msg.sender === "user" ? "flex-end" : "flex-start",
                marginBottom: 30,
                alignItems: "flex-start",
              }}
            >
              {msg.sender === "ai" && (
                <Image
                  source={require("@/assets/ai-avatar.png")}
                  style={{
                    width: 30,
                    height: 30,
                    marginRight: 8,
                  }}
                />
              )}

              <View
                style={{
                  maxWidth: "70%",
                  backgroundColor:
                    msg.sender === "user" ? APP_COLOR.ORANGE : "#f0f2ff",
                  padding: 12,
                  borderRadius: 16,
                  borderBottomRightRadius: msg.sender === "user" ? 4 : 16,
                  borderBottomLeftRadius: msg.sender === "ai" ? 4 : 16,
                }}
              >
                <Text
                  style={{
                    color: msg.sender === "user" ? "#fff" : "#000",
                    fontSize: 16,
                    lineHeight: 24,
                  }}
                >
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}
          {isLoading && <LoadingDots />}
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
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập nội dung chat"
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: "#f5f5f5",
              borderRadius: 20,
            }}
          />
          <TouchableOpacity
            style={{ marginLeft: 10 }}
            onPress={handleSendMessage}
          >
            <MaterialIcons name="send" size={24} color={APP_COLOR.ORANGE} />
          </TouchableOpacity>
        </View>
      </View>

      {renderOptionsModal()}
    </SafeAreaView>
  );
};

export default AIChatPage;
