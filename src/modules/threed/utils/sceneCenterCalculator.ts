/**
 * Calculates the geometric center between active characters in the 3D scene
 */

export const calculateSceneCenter = (
  mainCharacterPos: [number, number, number] = [0, 0, 0],
  partnerEnabled: boolean,
  partnerPos?: [number, number, number],
): [number, number, number] => {
  if (!partnerEnabled || !partnerPos) {
    // Single character: look at main character's position with Y offset
    return [mainCharacterPos[0], mainCharacterPos[1] + 1, mainCharacterPos[2]];
  }

  // Two characters: center at midpoint between them with Y offset
  const centerX = (mainCharacterPos[0] + partnerPos[0]) / 2;
  const centerY = (mainCharacterPos[1] + partnerPos[1]) / 2;
  const centerZ = (mainCharacterPos[2] + partnerPos[2]) / 2;

  return [centerX, centerY + 1, centerZ];
};
