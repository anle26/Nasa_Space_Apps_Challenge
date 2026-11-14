import * as THREE from 'three';

// Site-specific artistic reconstructions from surface imagery. Dimensions
// describe this scene in meters and are not a survey of the landing site.
export const terrainSites = {
  ingenuity: {
    title: 'Valinor Hills', source: 'https://science.nasa.gov/photojournal/ingenuity-at-valinor-hills/',
    note: 'Cát mịn với các dải gợn song song và ít đá lớn.',
    soil: 0xad7856, rock: 0x69544a, sky: 0xa88571, count: 72, radius: .11, flatness: .66, ripple: 1,
    height: (x, z) => .075 * Math.sin((z + x * .34) * 5.3 + .55 * Math.sin(x)) + .14 * Math.sin(z * .48),
  },
  opportunity: {
    title: 'Perseverance Valley', source: 'https://science.nasa.gov/resource/opportunity-legacy-pan/',
    note: 'Rãnh nông trên sườn hố Endeavour, có các mảng đá lộ thiên.',
    soil: 0xa08069, rock: 0x70615b, sky: 0xa99586, count: 360, radius: .26, flatness: .34, ripple: .08,
    height: (x, z) => .045 * z + .24 * (1 - Math.exp(-Math.pow((x + .22 * z) / 2.8, 2))) + .052 * Math.sin(x * 1.3 + z * .46),
    outcrops: [[-3.7, -1.1, .75], [3.4, -3.2, .95], [-5.3, 3.2, .8], [5.2, 1.7, .6]],
  },
  spirit: {
    title: 'Troy, hố Gusev', source: 'https://www.jpl.nasa.gov/images/pia12202-calypso-panorama-of-spirits-view-from-troy-stereo/',
    note: 'Đất sẫm xen mảng đất sáng mềm ở Troy, cạnh rìa cao nguyên thấp Home Plate.',
    soil: 0x927361, rock: 0x66574e, sky: 0xaa8a73, count: 295, radius: .24, flatness: .47, ripple: .1,
    height: (x, z) => .85 * THREE.MathUtils.smoothstep(x + .22 * z, 3.4, 8.4) + .11 * Math.sin(z * .55)
      - .13 * Math.exp(-((x - .15) ** 2 + (z + 2.3) ** 2) / .85),
    outcrops: [[5.6, -.9, .85], [5.3, 3.8, .75], [6.5, -4.2, 1.05]],
  },
  insight: {
    title: 'Homestead Hollow', source: 'https://science.nasa.gov/resource/insight-sol-14-panorama/',
    note: 'Vùng trũng rất nông, nền khá bằng và ít đá lớn gần tàu.',
    soil: 0xaf8667, rock: 0x8b7260, sky: 0xb09a85, count: 165, radius: .13, flatness: .52, ripple: .04,
    height: (x, z) => .17 * Math.exp(-((Math.hypot(x + .7, z) - 10) ** 2) / 10)
      + .035 * Math.sin(x * .85) * Math.sin(z * .56),
  },
  'viking-1': {
    title: 'Chryse Planitia', source: 'https://photojournal.jpl.nasa.gov/catalog/PIA00567',
    note: 'Đồng bằng hơi lượn, có chỗ trũng nhỏ, đá rải rác và vài mảng nền đá sáng.',
    soil: 0xa4775d, rock: 0x76635a, sky: 0xb09584, count: 360, radius: .16, flatness: .65, ripple: .06,
    height: (x, z) => .084 * Math.sin(x * .47 + z * .30) - .14 * Math.exp(-((x + 3.4) ** 2 + (z + 1.7) ** 2) / 3),
    outcrops: [[-4.1, -2.4, .32], [5.7, -3.2, .52]],
  },
  'viking-2': {
    title: 'Utopia Planitia', source: 'https://www.jpl.nasa.gov/images/pia00396-viking-lander-2s-first-picture-on-the-surface-of-mars/',
    note: 'Nền hạt mịn phủ dày đá góc cạnh và đá dạng phiến, thường cỡ 10–20 cm.',
    soil: 0x9d6e57, rock: 0x79685f, sky: 0xb69385, count: 880, radius: .105, flatness: .55, ripple: .03,
    height: (x, z) => .11 * Math.sin(x * .31 - z * .31) + .047 * Math.cos(z * .76),
  },
};
