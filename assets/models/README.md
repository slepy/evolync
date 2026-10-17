# 3D Models

## Pobieranie darmowego modelu człowieka

### Polecane źródła:

1. **Sketchfab** (najlepsze)
   - Odwiedź: https://sketchfab.com/3d-models?features=downloadable&sort_by=-likeCount&type=models&q=human
   - Wyszukaj: "human low poly" lub "human character"
   - Filtry: Downloadable + Free
   - Pobierz w formacie: **glTF (.gltf / .glb)**
   - Przykładowy model: https://sketchfab.com/3d-models/stylized-human-male-base-mesh-f23da023b67a48dfa37dee1c0b2d5a11

2. **Mixamo** (Adobe - darmowe)
   - Odwiedź: https://www.mixamo.com/
   - Wybierz Character > Download
   - Format: **FBX** (potem konwertuj na glTF)

3. **Free3D**
   - Odwiedź: https://free3d.com/3d-models/human
   - Wybierz model z formatem glTF/GLB

## Jak użyć pobranego modelu:

1. Pobierz model w formacie `.glb` lub `.gltf`
2. Umieść plik w tym folderze: `assets/models/`
3. Nazwij plik: `character.glb` (ładuje go `src/modules/threed/components/HumanModel.tsx`)
4. Model zastąpi obecną postać w edytorze 3D

## Konwersja formatów (jeśli potrzebne):

Jeśli model jest w formacie FBX/OBJ, użyj:
- Online converter: https://products.aspose.app/3d/conversion/fbx-to-gltf
- Blender (File > Export > glTF 2.0)
