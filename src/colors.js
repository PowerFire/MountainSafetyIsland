import * as THREE from 'three'

// r126 does not automatically decode CSS/hex swatches to linear working space.
// Decode once before lighting, so sRGB output does not wash out the palette.
export const clayColor = value => new THREE.Color(value).convertSRGBToLinear()
