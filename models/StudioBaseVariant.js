const StudioBaseVariantSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ["men", "women", "kids"]
  },

  subCategory: {
    type: String,
    enum: ["regular", "hoodie", "polo", "crop"]
  },
  // sleeveType: {
  //   type: String,
  //   enum: ["half", "full", "sleeveless"]
  // },
  
  imageUrl: {
    front: { type: String, required: true },
    back: { type: String, required: true }
  }
})

StudioBaseVariantSchema.index(
  {
    category: 1,
    subCategory: 1,
    sleeveType: 1,
  },
  { unique: true }
)