# Bracelet 3D Model Spec — Blender → GLB

This document defines the exact requirements for preparing bracelet 3D models for the AR Virtual Try-On feature. Following these rules ensures the bracelet attaches correctly to the detected wrist without manual rotation/offset hacks in code.

> **See also**: [Ring Model Spec](ring-model-spec.md) for ring-specific preparation.

---

## 1. Origin (Pivot Point)

The model's origin **must** be at the **geometric center of the bracelet opening** — the point the wrist would pass through.

### How to set in Blender

1. Position the bracelet so the hole center is at the 3D cursor (or world origin).
2. Select the bracelet object.
3. `Object → Set Origin → Origin to 3D Cursor` (if cursor is at hole center), **or**
4. If the bracelet geometry is symmetric: `Object → Set Origin → Origin to Geometry`.

> **Why**: The AR system places the bracelet's origin on the wrist landmark (MediaPipe landmark 0). If the origin is at the bounding-box corner or at a clasp/charm, the bracelet will visually float away from the wrist.

---

## 2. Hole Axis Alignment

The bracelet hole axis (the cylindrical axis the wrist passes through) must align with **Blender's Z axis**.

- When looking at the bracelet from above in Blender (top-down ortho view, Numpad 7), you should see the bracelet hole.
- The bracelet band lies in the XY plane.

### After export to glTF/GLB

glTF uses a right-hand Y-up coordinate system. Blender's glTF exporter automatically converts Z-up → Y-up. So in Three.js:

- The bracelet hole axis will be along **Y**.
- The code's rotation basis aligns the bracelet's Y axis with the wrist→palm direction — which is correct.

> **Test**: Import the exported GLB into the [Three.js glTF viewer](https://gltf-viewer.donmccurdy.com/). With no rotation applied, the bracelet hole should face upward (Y-up).

---

## 3. Apply All Transforms

Before export, apply all transforms so the model has identity location/rotation/scale:

```
Select bracelet → Ctrl+A → All Transforms
```

Verify in the N-panel that:
- Location: `(0, 0, 0)`
- Rotation: `(0°, 0°, 0°)`
- Scale: `(1, 1, 1)`

> **Why**: Unapplied transforms cause the bracelet to appear at the wrong size, rotation, or position in Three.js, since glTF bakes the object's transform into the node.

---

## 4. Scale / Units

Use Blender's default unit scale: **1 Blender unit = 1 meter** (this is the glTF standard).

A typical bracelet has:
- Inner diameter: ~60–70mm = `0.06 – 0.07` Blender units
- Band width: ~8–15mm = `0.008 – 0.015` BU
- Band thickness: ~2–5mm = `0.002 – 0.005` BU
- Overall bounding box: ~70–90mm

> **Why**: The AR system's scale heuristic expects models in meters. If the model is 1000× too large (e.g., modeled in millimeters without unit conversion), the bracelet will be gigantic and the scale clamp will not save it.

### Comparison with rings

| Dimension | Ring | Bracelet |
|-----------|------|----------|
| Inner diameter | ~18mm (`0.018` BU) | ~60–70mm (`0.06–0.07` BU) |
| Band width | ~4–6mm | ~8–15mm |
| Typical bounding box | ~20–30mm | ~70–90mm |

---

## 5. Materials

Use the **PBR Metallic-Roughness** workflow (Principled BSDF in Blender):

| Parameter | Gold | Silver/White Gold | Platinum | Rose Gold |
|-----------|------|-------------------|----------|-----------|
| Base Color | `#FFD700` | `#C0C0C0` | `#E5E4E2` | `#B76E79` |
| Metallic | 1.0 | 1.0 | 1.0 | 1.0 |
| Roughness | 0.15–0.3 | 0.1–0.25 | 0.2–0.35 | 0.15–0.3 |

Additional maps (optional but recommended):
- **Normal map**: for engravings, chain links, filigree, micro-texture
- **Roughness map**: for polished vs matte areas
- **Emissive**: not typically needed for bracelets

### Texture embedding

All textures **must** be embedded in the GLB file (not external image references). Blender's glTF exporter does this automatically when exporting as `.glb` (binary).

---

## 6. Bracelet Types & Geometry Notes

### Bangle (solid / rigid)

- Model as a single continuous torus-like shape.
- Origin at hole center.
- No moving parts.

### Chain bracelet

- Model the chain in its "worn" position (draped around the wrist, roughly circular).
- Origin at the geometric center of the loop.
- Individual chain links can be separate meshes, but **join them** into one object before export (`Ctrl+J`) to avoid excessive draw calls.
- Alternatively, use a curve-based chain with instanced links, then apply/convert before export.

### Cuff bracelet

- Model the open cuff with the opening facing up or to the side.
- Origin at the center of the cuff's inner arc.
- The opening gap is aesthetic — the AR system places it based on the hole's center regardless.

---

## 7. Export Settings

In Blender: `File → Export → glTF 2.0 (.glb/.gltf)`

| Setting | Value |
|---------|-------|
| Format | `glTF Binary (.glb)` |
| Include → Selected Objects | ✔ (export only the bracelet, not lights/cameras) |
| Transform → +Y Up | ✔ (default) |
| Geometry → Apply Modifiers | ✔ |
| Geometry → UVs | ✔ |
| Geometry → Normals | ✔ |
| Geometry → Vertex Colors | only if used |
| Geometry → Draco Compression | ✔ (if file > 2MB) |
| Animation | ✘ |

---

## 8. File Size Target

| Tier | Max size | When |
|------|----------|------|
| Ideal | < 3 MB | Simple bangle or cuff |
| Acceptable | 3–6 MB | Detailed chain or multi-element bracelet |
| Too large | > 6 MB | Optimize geometry/textures |

### Optimization tips
- Reduce chain link polygon count (use instancing or simplified geometry)
- Use 1K or 2K textures max
- Enable Draco compression in the export dialog
- Remove internal faces that are never visible
- For chain bracelets, consider using a texture-mapped tube instead of fully modeled links for web delivery

---

## 9. Naming Convention

```
{product-slug}.glb
```

Examples:
- `aurora-gold-bangle.glb`
- `celestial-chain-bracelet.glb`
- `serpentine-cuff.glb`

The slug should match the product's URL slug in the catalog system.

---

## 10. Validation Checklist

Before uploading a bracelet model, verify:

- [ ] Origin is at hole center (not bounding box center or world origin)
- [ ] Bracelet hole axis is along Blender Z (which becomes Y in glTF)
- [ ] All transforms applied (`Ctrl+A`)
- [ ] Scale is in meters (~0.065m diameter for a standard bracelet)
- [ ] Materials use Principled BSDF with metallic workflow
- [ ] Textures are embedded (not external files)
- [ ] Exported as `.glb` binary
- [ ] File size < 6 MB
- [ ] GLB opens correctly in [Three.js glTF viewer](https://gltf-viewer.donmccurdy.com/)
- [ ] In the viewer: bracelet hole faces up (Y), origin is at center, no rogue transforms

---

## 11. Quick Test in the App

1. Upload the GLB via the admin panel (Catalog → Product → Media → Add Model)
2. Ensure the product is in a category with slug `bracelets`
3. Open the product page → click "Try in AR"
4. Show your wrist to the camera
5. The bracelet should:
   - Sit at the wrist (slightly toward the forearm)
   - Follow wrist rotation smoothly
   - Not float above or clip into the wrist
   - Reflect the environment lighting (metallic sheen visible)
