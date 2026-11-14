const apollo11 = 'https://www.nasa.gov/missions/apollo/apollo-11-mission-overview/';
const apollo12 = 'https://www.nasa.gov/missions/apollo/apollo-12-the-pinpoint-mission/';
const apollo15 = 'https://www.nasa.gov/missions/apollo/apollo-15-mission-details/';
const surveyor = 'https://science.nasa.gov/mission/surveyor-3/';
const lrv = 'https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html';
const alsep = 'https://www.nasa.gov/wp-content/uploads/static/history/SP-4029/Apollo_18-31_ALSEP_Arrays_and_Status.htm';
const nasspModels = 'https://github.com/orbiternassp/NASSP/blob/Orbiter2016/Meshes/ProjectApollo/';
const roverModel = 'https://blenderartists.org/t/nasa-lunar-rover-scene-file/1610886';
const surveyorSite = 'https://www.nasa.gov/missions/lunar-reconnaissance-orbiter-looks-at-apollo-12-surveyor-3-landing-sites/';
export const moonTextureSource = 'https://svs.gsfc.nasa.gov/4720/';

export const moonDimensions = {
  'eagle-nassp.glb': { meters: 9.4, height: 7, label: 'Cao 7 m · Ngang 9,4 m qua hai chân đáp đối diện', source: 'https://airandspace.si.edu/amp-stories/lunar-module/index.html' },
  'lrv-oldschool.glb': { meters: 2.3, tireDiameter: .818, tireWidth: .23, label: 'Chiều dài khung theo NASA 3,1 m · Chiều dài cơ sở 2,3 m · Bánh Ø81,8 cm', source: lrv },
  'alsep-nassp.glb': { meters: 6.9, label: 'Màng chắn nhiệt PSE Ø1,52 m · Bộ phát SNAP-27 cao 45,7 cm, Ø40,6 cm', source: 'https://solarsystem.nasa.gov/system/downloadable_items/2921_Apollo_12.pdf' },
  'surveyor-nassp.glb': { meters: 4.2, height: 3, label: 'Cao 3 m · Rộng 4,2 m khi mở chân đáp', source: 'https://www.nasa.gov/wp-content/uploads/2023/04/sp-4012v2.pdf' },
};

export const moonMissions = [
  {
    id: 'eagle', name: 'Eagle', model: 'eagle-nassp.glb', type: 'Tàu đổ bộ', site: 'Apollo 11 · Biển Tĩnh Lặng',
    lat: .67416, lon: 23.47314, location: '0,674° B · 23,473° Đ', source: apollo11, credit: 'Project Apollo – NASSP · Hoạt cảnh tách tầng minh họa',
    summary: 'Eagle đưa Neil Armstrong và Buzz Aldrin xuống Mặt Trăng. Khi họ trở lại quỹ đạo, tầng cất cánh rời đi từ tầng hạ cánh. Tầng hạ cánh vẫn ở Tranquility Base.',
    titles: ['Hạ cánh', 'Tách tầng cất cánh', 'Tầng hạ cánh ở lại'],
    timeline: [
      ['20/07/1969', 'Eagle đáp xuống Biển Tĩnh Lặng. Armstrong và Aldrin bước ra, thu thập mẫu đá và triển khai các thí nghiệm Apollo 11.', apollo11],
      ['21/07/1969', 'Lúc 17:54 UTC, động cơ đưa tầng trên rời bệ để gặp Michael Collins trên quỹ đạo. Phi hành đoàn thấy các mảnh màng cách nhiệt Kapton văng ra từ tầng dưới.', 'https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11tcdb.html'],
      ['Sau Apollo 11', 'Ảnh từ tàu Lunar Reconnaissance Orbiter cho thấy tầng hạ cánh vẫn ở vị trí đáp.', 'https://science.nasa.gov/resource/apollo-landing-sites/'],
    ],
    modelSource: nasspModels + 'LM_DescentStage.msh',
  },
  {
    id: 'hadley-lrv', name: 'Xe Mặt Trăng Apollo 15', stageName: 'Xe Apollo 15', model: 'lrv-oldschool.glb', type: 'Xe tự hành', site: 'Apollo 15 · Hadley–Apennine',
    travel: { speed: 9.2 / 3.6, label: '9,2 km/h', source: 'https://ntrs.nasa.gov/api/citations/19750013242/downloads/19750013242.pdf' },
    lat: 26.1311, lon: 3.63972, location: '26,131° B · 3,640° Đ (điểm đỗ)', source: apollo15, credit: 'Hameed (OldSchool3D) · Mô hình LRV với bốn bánh quay riêng',
    modelSource: roverModel,
    summary: 'Apollo 15 là nhiệm vụ đầu tiên dùng xe điện trên Mặt Trăng. David Scott và James Irwin đi khoảng 27,9 km để khảo sát địa chất. Xe vẫn đỗ tại Hadley–Apennine.',
    titles: ['Đến khu vực hố Elbow', 'Thu thập Genesis Rock', 'Đỗ xe quan sát cất cánh'],
    timeline: [
      ['31/07/1971', 'Scott và Irwin chạy tới hố Elbow, gần rìa rãnh Hadley, để quan sát và lấy mẫu.', apollo15],
      ['01/08/1971', 'Tại hố Spur, phi hành đoàn thu thập Genesis Rock, một mẫu đá giàu khoáng vật giúp nghiên cứu vỏ Mặt Trăng sơ khai.', apollo15],
      ['02/08/1971', 'Xe được đỗ ở vị trí để camera truyền hình ghi lại cảnh tầng trên của tàu Falcon cất cánh.', apollo15],
    ],
  },
  {
    id: 'apollo12-alsep', name: 'ALSEP Apollo 12', model: 'alsep-nassp.glb', type: 'Trạm khoa học', stationary: true, landing: false,
    site: 'Apollo 12 · Đại Dương Bão Tố', lat: -3.00942, lon: -23.42458, markerOffset: -17,
    location: '3,009° N · 23,425° T', source: alsep, credit: 'Project Apollo – NASSP · Trạm trung tâm, địa chấn kế và nguồn điện RTG',
    modelSource: nasspModels + 'ALSEP_Station.msh',
    summary: 'Trạm ALSEP Apollo 12 gửi dữ liệu về Trái Đất sau khi các phi hành gia rời đi. Địa chấn kế ghi lại rung động, giúp các nhà khoa học nghiên cứu cấu trúc bên trong Mặt Trăng.',
    titles: ['Lắp đặt trạm', 'Ghi nhận rung động', 'Kết thúc thu dữ liệu'],
    timeline: [
      ['19/11/1969', 'Phi hành gia đặt trạm trung tâm, địa chấn kế thụ động và nguồn điện RTG. Trạm dùng điện từ RTG để thu và gửi dữ liệu về Trái Đất.', apollo12],
      ['20/11/1969', 'Tầng cất cánh của Apollo 12 được cho va vào Mặt Trăng có chủ đích. Địa chấn kế ghi được rung động từ cú va chạm.', apollo12],
      ['30/09/1977', 'NASA chấm dứt vận hành mạng lưới ALSEP. Các thiết bị vẫn nằm tại khu vực triển khai.', alsep],
    ],
  },
  {
    id: 'surveyor-3', name: 'Surveyor 3', model: 'surveyor-nassp.glb', type: 'Tàu đổ bộ', site: 'Surveyor 3 · Đại Dương Bão Tố',
    lat: -3.0159, lon: -23.4178, markerOffset: 17, location: '3,016° N · 23,418° T', source: surveyor,
    credit: 'Project Apollo – NASSP · Camera và gàu xúc tách riêng',
    modelSource: nasspModels + 'Surveyor.msh',
    summary: 'Surveyor 3 hạ cánh bằng robot, chụp ảnh và dùng gàu xúc để thử tính chất đất. Hai năm sau, phi hành gia Apollo 12 đến thăm tàu và mang một số bộ phận về Trái Đất.',
    titles: ['Hạ cánh trong hố nông', 'Xúc thử đất', 'Apollo 12 đến thăm'],
    timeline: [
      ['20/04/1967', 'Tàu đáp bên trong một hố nông. Camera truyền ảnh bề mặt về Trái Đất.', surveyor],
      ['04–05/1967', 'Gàu xúc đào bốn rãnh để giúp các nhà khoa học đo tính chất cơ học của đất Mặt Trăng.', surveyor],
      ['20/11/1969', 'Pete Conrad và Alan Bean tháo camera truyền hình, gàu xúc và các mẫu vật liệu. Phần thân và chân đáp ở lại.', apollo12],
    ],
  },
];

const sky = 0x050507;
const plain = (x, z) => .045 * Math.sin(x * .5) * Math.cos(z * .6) + .065 * Math.sin(z * .31);
export const moonTerrainSites = {
  eagle: {
    title: 'Biển Tĩnh Lặng', source: 'https://science.nasa.gov/resource/view-apollo-11-lunar-module-as-it-rested-on-lunar-surface/', sky,
    note: 'Nền đồng bằng bụi xám với đá nhỏ rải rác. Địa hình minh họa theo ảnh bề mặt Apollo 11.',
    soil: 0x89837f, rock: 0x777476, count: 360, radius: .19, flatness: .53, ripple: 0, height: plain,
  },
  'hadley-lrv': {
    title: 'Hadley–Apennine', source: 'https://www.nasa.gov/history/50-years-ago-apollo-15-on-the-moon-at-hadley-apennine/', sky,
    note: 'Nền bụi xám, đá và các sườn đồi phía xa gợi địa hình Hadley. Ba chấm minh họa thứ tự ghé thăm, với khoảng cách được thu gọn.',
    soil: 0x827d78, rock: 0x797577, count: 480, radius: .24, flatness: .49, ripple: 0,
    height: (x, z) => plain(x, z) + 2.7 * Math.exp(-((x + 17) ** 2 + (z + 19) ** 2) / 90)
      + 3.1 * Math.exp(-((x + 28) ** 2 + (z + 14) ** 2) / 100),
    outcrops: [[-4, -3.4, .44], [5.2, -2.8, .32]],
  },
  'apollo12-alsep': {
    title: 'Đại Dương Bão Tố', source: surveyorSite, sky,
    note: 'Đồng bằng bụi mịn gần khu đáp Apollo 12. Địa chấn kế và nguồn RTG nằm ở hai phía, cách trạm trung tâm khoảng 3 m mỗi bên.',
    soil: 0x8f8a84, rock: 0x737073, count: 300, radius: .15, flatness: .48, ripple: 0, height: plain,
  },
  'surveyor-3': {
    title: 'Hố Surveyor', source: surveyorSite, sky,
    note: 'Tàu nằm trên sườn trong hố. Độ dốc dưới chân đáp và vành hố được dựng minh họa theo địa điểm.',
    soil: 0x8a837c, rock: 0x6e6c6b, count: 390, radius: .18, flatness: .54, ripple: 0,
    height: (x, z) => (-.15 * x + .08 * z) * Math.exp(-(x * x + z * z) / 36)
      + .8 * Math.exp(-((Math.hypot(x - 4, z + 2) - 13) ** 2) / 6),
  },
};
