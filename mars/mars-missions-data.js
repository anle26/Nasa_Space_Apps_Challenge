export const modelDimensions = {
  'ingenuity.glb': {
    meters: 1.2,
    label: 'Đường kính cánh quạt 1,2 m · Cao khoảng 0,49 m',
    source: 'https://www.jpl.nasa.gov/news/press_kits/ingenuity/landing/quick_facts/',
  },
  'mer-articulated.glb': {
    meters: 2.3,
    label: 'Dài 1,6 m · Rộng 2,3 m · Cao 1,5 m',
    source: 'https://mars.nasa.gov/internal_resources/823/',
  },
  'insight-deployed.glb': {
    meters: 6,
    label: 'Sải pin 6 m · Mặt boong cao 0,83–1,08 m',
    source: 'https://science.nasa.gov/mission/insight/spacecraft/',
  },
  'viking.glb': {
    meters: 3,
    label: 'Rộng khoảng 3 m · Cao khoảng 2 m',
    source: 'https://science.nasa.gov/wp-content/uploads/2023/09/viking-encounter-press-kit.pdf',
  },
};

const merTravel = {
  speed: .0375, label: '3,75 cm/s',
  source: 'https://robotics.jpl.nasa.gov/media/documents/biesiadecki_driving05.pdf',
};

export const missions = [
  {
    id: 'ingenuity', name: 'Ingenuity', type: 'Trực thăng', site: 'Valinor Hills · Hố Jezero',
    lat: 18.45, lon: 77.4, location: 'Vùng hoạt động gần điểm dừng cuối',
    model: 'ingenuity.glb', credit: 'NASA / Brian E. Kumanchik',
    travel: { speed: 2, label: '2 m/s', flight: { altitude: 1.35, verticalSpeed: 1 }, source: 'https://www.jpl.nasa.gov/missions/ingenuity/' },
    source: 'https://science.nasa.gov/blog/farewell-to-our-flying-friend-and-closing-in-on-the-crater-rim/',
    summary: 'Ingenuity chứng minh máy bay có thể cất cánh có kiểm soát trong khí quyển loãng của Sao Hỏa. Sau đó, nó giúp Perseverance quan sát địa hình từ trên cao.',
    timeline: [['2021', 'Đến hố Jezero cùng xe Perseverance.'], ['19/04/2021', 'Thực hiện chuyến bay có động cơ đầu tiên trên một hành tinh khác.'], ['18/01/2024', 'Cánh quạt hư hỏng khi hạ cánh sau chuyến bay thứ 72 tại Valinor Hills.']],
  },
  {
    id: 'opportunity', name: 'Opportunity', type: 'Xe tự hành', site: 'Perseverance Valley · Meridiani Planum',
    lat: -2.0, lon: -5.4, location: 'Vùng hoạt động gần điểm dừng cuối',
    model: 'mer-articulated.glb', credit: 'NASA/JPL-Caltech',
    travel: merTravel,
    source: 'https://science.nasa.gov/mission/mer-opportunity/',
    summary: 'Opportunity nghiên cứu đất đá và tìm thấy bằng chứng về nước lỏng trong quá khứ. Chiếc xe đi hơn 45 km trong gần 15 năm hoạt động.',
    timeline: [['2004', 'Hạ cánh tại hố Eagle ở Meridiani Planum.'], ['2011', 'Đến hố Endeavour và tiếp tục khảo sát các lớp đá.'], ['2018–2019', 'Gửi tín hiệu cuối từ Perseverance Valley trong bão bụi toàn cầu. NASA kết thúc nhiệm vụ năm 2019.']],
  },
  {
    id: 'spirit', name: 'Spirit', type: 'Xe tự hành', site: 'Troy · Hố Gusev',
    lat: -14.6, lon: 175.5, location: 'Vùng hoạt động gần điểm dừng cuối',
    model: 'mer-articulated.glb', credit: 'NASA/JPL-Caltech',
    travel: merTravel,
    source: 'https://science.nasa.gov/mission/mer-spirit/',
    summary: 'Spirit khảo sát đá và đất ở hố Gusev, tìm thấy dấu vết cho thấy Sao Hỏa từng ẩm ướt hơn.',
    timeline: [['2004', 'Hạ cánh tại hố Gusev và bắt đầu khảo sát.'], ['2009', 'Mắc kẹt trong nền đất mềm tại khu vực Troy.'], ['2010–2011', 'Gửi tín hiệu cuối năm 2010. NASA kết thúc nỗ lực liên lạc năm 2011.']],
  },
  {
    id: 'insight', name: 'InSight', type: 'Tàu đổ bộ', site: 'Elysium Planitia',
    lat: 4.5, lon: 135.9, location: 'Khu vực hạ cánh',
    model: 'insight-deployed.glb', credit: 'NASA VTAD · Thiết bị khoa học: NASA / Brian E. Kumanchik',
    source: 'https://science.nasa.gov/mission/insight/',
    summary: 'InSight dùng máy đo địa chấn để ghi rung động, giúp các nhà khoa học tìm hiểu cấu trúc bên trong Sao Hỏa.',
    timeline: [
      ['26/11/2018', 'InSight hạ cánh tại Elysium Planitia với hai tấm pin còn gập.'],
      ['26/11/2018', 'Sau khi bụi lắng, hai tấm pin mở ra để cấp điện. Cánh tay robot vẫn ở tư thế thu gọn.', 'https://www.jpl.nasa.gov/news/press_kits/insight/launch/mission/'],
      ['19/12/2018', 'Cánh tay robot đặt máy đo địa chấn SEIS xuống mặt đất.', 'https://science.nasa.gov/photojournal/seis-deployed-on-mars/'],
      ['2022', 'Bụi phủ tấm pin làm nguồn điện suy giảm. NASA kết thúc nhiệm vụ tháng 12.'],
    ],
  },
  {
    id: 'viking-1', name: 'Viking 1', type: 'Tàu đổ bộ', site: 'Chryse Planitia',
    lat: 22.5, lon: -48.0, location: 'Khu vực hạ cánh',
    model: 'viking.glb', credit: 'NASA / Michael Carbajal',
    source: 'https://science.nasa.gov/mission/viking-1/',
    summary: 'Viking 1 gửi ảnh từ bề mặt, theo dõi thời tiết và phân tích đất để tìm dấu hiệu sự sống. Các thí nghiệm chưa cho bằng chứng rõ ràng về sự sống.',
    timeline: [['20/07/1976', 'Hạ cánh tại Chryse Planitia.'], ['28/07/1976', 'Cần lấy mẫu hạ đầu xúc xuống đất rồi nâng lên. Mẫu đất được đưa về phòng thí nghiệm trên tàu.', 'https://science.nasa.gov/mission/viking-1/'], ['1982', 'Kết thúc liên lạc sau hơn sáu năm hoạt động trên bề mặt.']],
  },
  {
    id: 'viking-2', name: 'Viking 2', type: 'Tàu đổ bộ', site: 'Utopia Planitia',
    lat: 47.64, lon: 134.29, location: 'Khu vực hạ cánh',
    model: 'viking.glb', credit: 'NASA / Michael Carbajal',
    source: 'https://science.nasa.gov/mission/viking-2/',
    summary: 'Viking 2 dùng cùng thiết kế với Viking 1 để chụp ảnh, khảo sát thời tiết và phân tích đất ở một khu vực khác trên Sao Hỏa.',
    timeline: [['03/09/1976', 'Hạ cánh tại Utopia Planitia.'], ['1976', 'Tay lấy mẫu đào một rãnh nhỏ giữa các tảng đá để lấy đất phân tích.', 'https://www.jpl.nasa.gov/images/pia00145-surface-sampler-arm-acquiring-sample/'], ['1980', 'Kết thúc hoạt động của tàu đổ bộ.']],
  },
];

export const replayTitles = {
  ingenuity: ['Đến Jezero', 'Cất cánh lần đầu', 'Chuyến bay thứ 72'],
  opportunity: ['Hạ cánh ở hố Eagle', 'Khảo sát hố Endeavour', 'Tín hiệu cuối'],
  spirit: ['Hạ cánh ở hố Gusev', 'Mắc kẹt tại Troy', 'Kết thúc liên lạc'],
  insight: ['Hạ cánh ở Elysium Planitia', 'Mở tấm pin mặt trời', 'Triển khai máy đo địa chấn', 'Năng lượng cạn dần'],
  'viking-1': ['Hạ cánh ở Chryse Planitia', 'Triển khai tay lấy mẫu', 'Kết thúc liên lạc'],
  'viking-2': ['Hạ cánh ở Utopia Planitia', 'Triển khai tay lấy mẫu', 'Kết thúc nhiệm vụ'],
};
