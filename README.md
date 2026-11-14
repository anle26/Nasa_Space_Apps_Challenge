# Nasa_Space_Apps_Challenge
Bản thử cho NASA Space Apps Challenge. Khám phá sáu thiết bị trên Sao Hỏa và bốn hồ sơ trên Mặt Trăng. Chọn ghim để xem mô hình 3D, các mốc nhiệm vụ và hoạt cảnh. Địa hình và chuyển động là minh họa.

## Chạy trên máy

Cần Node.js 22.12 trở lên (hoặc 20.19 trở lên thuộc nhánh Node 20) và pnpm.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Mở địa chỉ Vite in ra. Trang chính là bản đồ Sao Hỏa. Chọn **Mặt Trăng** trong thanh điều hướng hoặc mở `/?body=moon` để xem Eagle (Apollo 11), xe Apollo 15, ALSEP Apollo 12 và Surveyor 3. Mở thêm `/mars-explorer.html` để xem địa hình Dingo Gap từ dữ liệu NASA-AMMOS. Demo Dingo Gap tải địa hình qua mạng.

Dùng `pnpm build` để tạo thư mục `dist/` và `pnpm preview` để xem bản build.

## Cấu trúc thư mục

- `mars/` chứa hồ sơ, địa hình, hoạt cảnh Sao Hỏa và trang Dingo Gap. Mô hình và ảnh nằm trong `public/mars/`.
- `moon/` chứa hồ sơ, địa hình và hoạt cảnh Mặt Trăng. Mô hình và ảnh nằm trong `public/moon/`.
- `shared/` chứa trình xem, điều khiển phát lại và bộ dựng địa hình dùng chung. Bộ giải mã Draco nằm trong `public/draco/`.

## Nguồn

- Mô hình và ảnh hành tinh từ [NASA 3D Resources](https://github.com/nasa/NASA-3D-Resources). Thân InSight dùng [InSight Deployed](https://science.nasa.gov/resource/insight-3d-model/). Các bộ phận và tư thế lấy từ [InSight Cruise Lander](https://science.nasa.gov/3d-resources/insight-cruise-lander/).
- Mỗi cảnh nhiệm vụ có liên kết đến ảnh địa điểm, thông số kích thước và tư liệu nhiệm vụ.
- Bản đồ Mặt Trăng dùng ảnh LRO từ [NASA CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/). Eagle, ALSEP và Surveyor 3 dùng mô hình chuyển sang GLB từ [Project Apollo – NASSP](https://github.com/orbiternassp/NASSP), với hoạt cảnh dựng theo tư liệu liên kết trong từng hồ sơ. Xem [giấy phép của NASSP](https://github.com/orbiternassp/NASSP/blob/Orbiter2016/NASSP-LICENSE.txt) và các tệp mô hình gốc qua liên kết trong từng hồ sơ.
- Xe Mặt Trăng dùng [mô hình Blender của Hameed (OldSchool3D)](https://blenderartists.org/t/nasa-lunar-rover-scene-file/1610886), giảm số mặt và kích thước ảnh vật liệu để dùng trên web. Hình học và vật liệu gốc của tác giả theo CC0 1.0. Tài liệu PDF đi kèm bản tải ghi các điều khoản riêng cho ảnh vật liệu bên thứ ba, trong đó có ảnh từ AmbientCG, Poly Haven và NASA.
- Tọa độ xe Apollo 15, ALSEP và Surveyor 3 lấy từ bảng B-1 và B-2 của [Lunar Constants and Models](https://planetarydata.jpl.nasa.gov/img/data/m3/CH1M3_0002/EXTRAS/LunConstantsModels_2005_jpl_d32296.pdf).
- Trình xem Dingo Gap dựa trên ví dụ của [NASA-AMMOS/3DTilesRendererJS](https://github.com/NASA-AMMOS/3DTilesRendererJS), với [dữ liệu Dingo Gap](https://github.com/NASA-AMMOS/3DTilesSampleData/tree/master/msl-dingo-gap).
- Các tệp giải mã Draco được lấy từ bản phân phối [Three.js](https://github.com/mrdoob/three.js). Xem giấy phép đi kèm và [hướng dẫn sử dụng ảnh và dữ liệu NASA](https://www.nasa.gov/nasa-brand-center/images-and-media/).
