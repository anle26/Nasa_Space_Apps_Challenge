# Nasa_Space_Apps_Challenge
Bản thử cho NASA Space Apps Challenge. Khám phá sáu thiết bị trên Sao Hỏa, xem mô hình 3D, các mốc nhiệm vụ và hoạt cảnh. Mỗi địa điểm có ngoại cảnh dựng theo ảnh NASA/JPL. Địa hình, lộ trình và chuyển động là minh họa.

## Chạy trên máy

Cần Node.js 22.12 trở lên (hoặc 20.19 trở lên thuộc nhánh Node 20) và pnpm.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Mở địa chỉ Vite in ra. Trang chính là bản đồ nhiệm vụ. Mở thêm `/mars-explorer.html` để xem địa hình Dingo Gap từ dữ liệu NASA-AMMOS. Demo Dingo Gap tải địa hình qua mạng.

Dùng `pnpm build` để tạo thư mục `dist/` và `pnpm preview` để xem bản build.

## Nguồn

- Mô hình và ảnh hành tinh từ [NASA 3D Resources](https://github.com/nasa/NASA-3D-Resources). Thân InSight dùng [InSight Deployed](https://science.nasa.gov/resource/insight-3d-model/). Các bộ phận và tư thế lấy từ [InSight Cruise Lander](https://science.nasa.gov/3d-resources/insight-cruise-lander/).
- Mỗi cảnh nhiệm vụ có liên kết đến ảnh địa điểm, thông số kích thước và tư liệu nhiệm vụ.
- Trình xem Dingo Gap dựa trên ví dụ của [NASA-AMMOS/3DTilesRendererJS](https://github.com/NASA-AMMOS/3DTilesRendererJS), với [dữ liệu Dingo Gap](https://github.com/NASA-AMMOS/3DTilesSampleData/tree/master/msl-dingo-gap).
- Các tệp giải mã Draco được lấy từ bản phân phối [Three.js](https://github.com/mrdoob/three.js). Xem giấy phép đi kèm và [hướng dẫn sử dụng ảnh và dữ liệu NASA](https://www.nasa.gov/nasa-brand-center/images-and-media/).
