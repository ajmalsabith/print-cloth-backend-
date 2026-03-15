const StudioBaseVariantSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ["men", "women", "kids"]
  },

  subCategory: {
    type: String,
    enum: ["regular", "hoodie", "polo", "crop"]
  },
    colors: [
    {
      name: String,
      frontImage: String,
      backImage: String
    }
  ],
  printableAreas:{
    front:{
      x: Number, //Horizontal starting point of the print area 
      y: Number, //Vertical starting point of the print area
      width: Number, //print area width
      height: Number //print area height
    },

    back:{
      x: Number,
      y: Number,
      width: Number,
      height: Number
    }
  }
})

StudioBaseVariantSchema.index(
  {
    category: 1,
    subCategory: 1,
    color: 1,
  },
  { unique: true }
)