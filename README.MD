# Mobile E-Commerce Application

## Tổng quan

Ứng dụng thương mại điện tử di động toàn diện được xây dựng bằng React Native và Expo, cung cấp trải nghiệm mua sắm trực tuyến đầy đủ tính năng. Ứng dụng cho phép người dùng duyệt sản phẩm, quản lý giỏ hàng, thực hiện thanh toán và theo dõi lịch sử đơn hàng.

## Tính năng chính

- **Xác thực người dùng**: Đăng nhập, đăng ký, xác minh email và khôi phục mật khẩu
- **Duyệt sản phẩm**: Xem sản phẩm theo danh mục, tìm kiếm và lọc
- **Trang chi tiết sản phẩm**: Hình ảnh, mô tả, biến thể, đánh giá
- **Quản lý giỏ hàng**: Thêm, cập nhật số lượng, xóa sản phẩm
- **Thanh toán**: Xem tổng quan đơn hàng, chọn địa chỉ giao hàng, phương thức thanh toán
- **Quản lý đơn hàng**: Theo dõi đơn hàng, xem lịch sử, chi tiết đơn hàng
- **Quản lý tài khoản**: Cập nhật thông tin cá nhân, mật khẩu, địa chỉ

## Công nghệ sử dụng

- **React Native**: Framework xây dựng ứng dụng di động đa nền tảng
- **Expo**: Nền tảng phát triển React Native
- **Expo Router**: Hệ thống điều hướng dựa trên tệp
- **TypeScript**: Ngôn ngữ lập trình static typing
- **Context API**: Quản lý trạng thái ứng dụng
- **AsyncStorage**: Lưu trữ dữ liệu cục bộ
- **Axios**: Thực hiện các yêu cầu HTTP đến API

## Cấu trúc dự án

```
src/
├── app/                   # Cấu trúc điều hướng dựa trên tệp Expo Router
│   ├── (auth)/            # Màn hình xác thực (đăng nhập, đăng ký, v.v.)
│   ├── (tabs)/            # Màn hình tab chính (trang chủ, danh mục, giỏ hàng, tài khoản)
│   ├── (user)/            # Màn hình người dùng (chi tiết sản phẩm, cửa hàng, v.v.)
│   │   └── (order)/       # Màn hình liên quan đến đơn hàng
│   ├── _layout.tsx        # Cấu hình bố cục và điều hướng chính
│   └── index.tsx          # Điểm vào ứng dụng
├── components/            # Các component có thể tái sử dụng
├── context/               # Context API cho quản lý trạng thái
├── utils/                 # Tiện ích, hằng số, và APIs
│   ├── api.ts             # Các hàm gọi API
│   ├── axios.customize.ts # Cấu hình Axios
│   └── constants.ts       # Hằng số ứng dụng
└── types/                 # Định nghĩa kiểu TypeScript
```

## Cài đặt và thiết lập

### Yêu cầu

- Node.js (>= 16.x)
- npm hoặc yarn
- Expo CLI
- Android Studio/Xcode (cho phát triển cục bộ)

### Các bước cài đặt

1. Clone repository:

   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. Cài đặt các dependencies:

   ```bash
   npm install
   # hoặc
   yarn install
   ```

3. Tạo file cấu hình môi trường:

   ```bash
   cp .env.example .env
   ```

4. Cập nhật các biến môi trường trong file `.env` với thông tin API cần thiết.

## Khởi chạy ứng dụng

### Phát triển

```bash
npm start
# hoặc
yarn start
```

Sau đó, bạn có thể chọn chạy trên:

- Android: Nhấn `a`
- iOS: Nhấn `i`
- Web: Nhấn `w`

### Xây dựng bản production

```bash
expo build:android  # Cho Android
expo build:ios      # Cho iOS
```

## Tích hợp API

Ứng dụng sử dụng Axios để kết nối với backend API. Tất cả các gọi API được định nghĩa trong `src/utils/api.ts`. Các hàm API chính bao gồm:

- Xác thực: `loginAPI`, `registerAPI`, `verifyCodeAPI`
- Sản phẩm: `getProductByIdAPI`, `getProductByCategoryIDAPI`
- Giỏ hàng: `getCartItemsAPI`, `addProductToCartAPI`, `updateCartAPI`, `deleteCartItemAPI`
- Đơn hàng: `checkoutOrderAPI`, `placeOrderAPI`, `getOrderHistoryAPI`, `getOrderDetailAPI`
- Địa chỉ: `createDeliveryAddressAPI`, `getAllDeliveryAddressByUserIDAPI`, `updateDeliveryAddressAPI`

## Quản lý trạng thái

Trạng thái ứng dụng được quản lý chủ yếu thông qua React Context API, với context chính được định nghĩa trong `src/context/app.context.tsx`. Context này quản lý:

- Thông tin người dùng đã đăng nhập
- Trạng thái giỏ hàng
- Trạng thái toàn cục khác

Dữ liệu đăng nhập được lưu trữ cục bộ bằng AsyncStorage để duy trì phiên đăng nhập.

## Điều hướng

Ứng dụng sử dụng Expo Router với cấu trúc điều hướng dựa trên tệp:

- `(auth)`: Màn hình xác thực
- `(tabs)`: Điều hướng tab chính
- `(user)`: Màn hình người dùng
- `(order)`: Màn hình liên quan đến đơn hàng

Cấu hình điều hướng chính được định nghĩa trong `src/app/_layout.tsx`.

## Đóng góp

1. Fork dự án
2. Tạo nhánh tính năng (`git checkout -b feature/amazing-feature`)
3. Commit thay đổi (`git commit -m 'Add some amazing feature'`)
4. Push lên nhánh (`git push origin feature/amazing-feature`)
5. Mở Pull Request

## Giấy phép

Dự án này được cấp phép theo [Giấy phép MIT](LICENSE).

## Liên hệ

Nếu có bất kỳ câu hỏi hoặc góp ý nào, vui lòng liên hệ [phatngo.040103@gmail.com].
