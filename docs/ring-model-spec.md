# Ring 3D Model Spec — Blender → GLB

This document defines the exact requirements for preparing ring 3D models for the AR Virtual Try-On feature. Following these rules ensures the ring attaches correctly to the detected finger without manual rotation/offset hacks in code.

---

## 1. Origin (Pivot Point)

The model's origin **must** be at the **geometric center of the ring hole** — the point the finger would pass through.

### How to set in Blender

1. Position the ring so the hole center is at the 3D cursor (or world origin).
2. Select the ring object.
3. `Object → Set Origin → Origin to 3D Cursor` (if cursor is at hole center), **or**
4. If the ring geometry is symmetric: `Object → Set Origin → Origin to Geometry`.

> **Why**: The AR system places the ring's origin on the finger midpoint between MCP and PIP landmarks. If the origin is at the bounding-box corner or at the gem, the ring will visually float away from the finger.

---

## 2. Hole Axis Alignment

The ring hole axis (the cylindrical axis the finger passes through) must align with **Blender's Z axis**.

- When looking at the ring from above in Blender (top-down ortho view, Numpad 7), you should see the ring hole.
- The ring "band" lies in the XY plane.

### After export to glTF/GLB

glTF uses a right-hand Y-up coordinate system. Blender's glTF exporter automatically converts Z-up → Y-up. So in Three.js:

- The ring hole axis will be along **Y**.
- The code's rotation basis (built from the finger direction vector and palm normal) aligns the ring's Y axis with the finger direction — which is correct.

> **Test**: Import the exported GLB into the [Three.js glTF viewer](https://gltf-viewer.donmccurdy.com/). With no rotation applied, the ring hole should face upward (Y-up).

---

## 3. Apply All Transforms

Before export, apply all transforms so the model has identity location/rotation/scale:

```
Select ring → Ctrl+A → All Transforms
```

Verify in the N-panel that:
- Location: `(0, 0, 0)`
- Rotation: `(0°, 0°, 0°)`
- Scale: `(1, 1, 1)`

> **Why**: Unapplied transforms cause the ring to appear at the wrong size, rotation, or position in Three.js, since glTF bakes the object's transform into the node.

---

## 4. Scale / Units

Use Blender's default unit scale: **1 Blender unit = 1 meter** (this is the glTF standard).

A typical ring has:
- Band diameter: ~18mm = `0.018` Blender units
- Band width: ~4-6mm = `0.004 - 0.006` BU
- Overall bounding box: ~20-30mm

> **Why**: The AR system's scale heuristic expects models in meters. If the model is 1000× too large (e.g., modeled in millimeters without unit conversion), the ring will be gigantic and the scale clamp will not save it.

---

## 5. Materials

Use the **PBR Metallic-Roughness** workflow (Principled BSDF in Blender):

| Parameter | Gold | Silver/White Gold | Platinum | Rose Gold |
|-----------|------|-------------------|----------|-----------|
| Base Color | `#FFD700` | `#C0C0C0` | `#E5E4E2` | `#B76E79` |
| Metallic | 1.0 | 1.0 | 1.0 | 1.0 |
| Roughness | 0.15–0.3 | 0.1–0.25 | 0.2–0.35 | 0.15–0.3 |

Additional maps (optional but recommended):
- **Normal map**: for engravings, filigree, micro-texture
- **Roughness map**: for polished vs matte areas
- **Emissive**: not typically needed for rings

### Texture embedding

All textures **must** be embedded in the GLB file (not external image references). Blender's glTF exporter does this automatically when exporting as `.glb` (binary).

---

## 6. Export Settings

In Blender: `File → Export → glTF 2.0 (.glb/.gltf)`

| Setting | Value |
|---------|-------|
| Format | `glTF Binary (.glb)` |
| Include → Selected Objects | ✔ (export only the ring, not lights/cameras) |
| Transform → +Y Up | ✔ (default) |
| Geometry → Apply Modifiers | ✔ |
| Geometry → UVs | ✔ |
| Geometry → Normals | ✔ |
| Geometry → Vertex Colors | only if used |
| Geometry → Draco Compression | ✔ (if file > 2MB) |
| Animation | ✘ |

---

## 7. File Size Target

| Tier | Max size | When |
|------|----------|------|
| Ideal | < 2 MB | Simple band or solitaire |
| Acceptable | 2–5 MB | Detailed pave or multi-stone |
| Too large | > 5 MB | Optimize geometry/textures |

### Optimization tips
- Reduce subdivision levels (rings rarely need > 3)
- Use 1K or 2K textures max (the ring is small on screen)
- Enable Draco compression in the export dialog
- Remove internal faces that are never visible

---

## 8. Naming Convention

```
{product-slug}.glb
```

Examples:
- `aurora-diamond-ring.glb`
- `celestial-solitaire.glb`
- `serpentine-gold-band.glb`

The slug should match the product's URL slug in the catalog system.

---

## 9. Validation Checklist

Before uploading a ring model, verify:

- [ ] Origin is at hole center (not bounding box center or world origin)
- [ ] Ring hole axis is along Blender Z (which becomes Y in glTF)
- [ ] All transforms applied (`Ctrl+A`)
- [ ] Scale is in meters (~0.018m diameter for a standard ring)
- [ ] Materials use Principled BSDF with metallic workflow
- [ ] Textures are embedded (not external files)
- [ ] Exported as `.glb` binary
- [ ] File size < 5 MB
- [ ] GLB opens correctly in [Three.js glTF viewer](https://gltf-viewer.donmccurdy.com/)
- [ ] In the viewer: ring hole faces up (Y), origin is at center, no rogue transforms

---

## 10. Quick Test in the App

1. Upload the GLB via the admin panel (Catalog → Product → Media → Add Model)
2. Open the product page → click "Try in AR"
3. Show your ring finger to the camera
4. The ring should:
   - Sit on the proximal phalanx (between knuckle and middle joint)
   - Follow finger rotation smoothly
   - Not float above or clip into the finger
   - Reflect the environment lighting (metallic sheen visible)
