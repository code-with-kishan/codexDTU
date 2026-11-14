const mongoose = require('mongoose');

const modelUrlsSchema = new mongoose.Schema(
  {
    glb: String,
    fbx: String,
    usdz: String,
    obj: String,
    mtl: String,
    stl: String,
  },
  { _id: false }
);

const studioExtraSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: '' },
    modelUrl: String,
  },
  { _id: false }
);

const modelCapabilitiesSchema = new mongoose.Schema(
  {
    animations: { type: Boolean, default: false },
    interactiveParts: { type: Boolean, default: false },
    assembly: { type: Boolean, default: false },
    dismantling: { type: Boolean, default: false },
    physics: { type: Boolean, default: false },
    driving: { type: Boolean, default: false },
  },
  { _id: false }
);

const interactionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    partId: { type: String, required: true },
    type: { type: String, required: true }, // ROTATE, OPEN, CLOSE, TOGGLE, SLIDE, DRIVE, ANIMATION, etc.
    axis: { type: String }, // x, y, z
    min: { type: Number },
    max: { type: Number },
    defaultValue: { type: Number },
    speed: { type: Number },
    animationClip: { type: String }, // For embedded animations
  },
  { _id: false }
);

const assemblySchema = new mongoose.Schema(
  {
    partId: { type: String, required: true },
    targetPosition: { type: [Number], default: [0, 0, 0] },
    targetRotation: { type: [Number], default: [0, 0, 0] },
    snapDistance: { type: Number, default: 0.1 },
  },
  { _id: false }
);

const studioProjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    modelUrl: String,
    thumbnailUrl: String,
    tripoTaskId: String,
    modelUrls: modelUrlsSchema,
    useCase: { type: String, default: '' },
    category: { type: String, default: '' },
    studioTransforms: { type: mongoose.Schema.Types.Mixed, default: {} },
    /** Motion rig preview configs keyed by scene node id (primary / extra ids). */
    studioRigs: { type: mongoose.Schema.Types.Mixed, default: {} },
    studioExtras: [studioExtraSchema],
    logoScale: Number,
    logoOffsetY: Number,
    /** When true, `GET /api/projects/share/:id` and hosted GLB are world-readable. */
    arSharePublic: { type: Boolean, default: false },
    /** Viewer page heading (falls back to `name`). */
    arPageTitle: { type: String, default: '' },
    arPageTagline: { type: String, default: '' },
    arCtaLabel: { type: String, default: '' },
    /** Optional `#RRGGBB` accent for the public viewer. */
    arAccentHex: { type: String, default: '' },
    arGlbUploadedAt: { type: Date },
    modelCapabilities: { type: modelCapabilitiesSchema, default: () => ({}) },
    interactions: [interactionSchema],
    assemblyData: [assemblySchema],
  },
  { timestamps: true }
);

studioProjectSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('StudioProject', studioProjectSchema);
