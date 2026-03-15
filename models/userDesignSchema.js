const mongoose = require("mongoose");

const DesignElementSchema = new mongoose.Schema({

  // front / back
  side: {
    type: String,
    enum: ["front", "back"],
    default: "front"
  },

  // element type
  type: {
    type: String,
    enum: ["libraryDesign", "uploadedImage", "text"],
    required: true
  },

  // if design from your design collection
  designId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Design",
    default: null
  },

  // if user uploaded image
  imageUrl: {
    type: String,
    default: null
  },

  // text element
  text: {
    type: String,
    default: null
  },

  fontFamily: String,
  fontSize: Number,
  color: String,

  // canvas position
  positionX: Number,
  positionY: Number,

  // transformations
  scaleX: {
    type: Number,
    default: 1
  },

  scaleY: {
    type: Number,
    default: 1
  },

  rotation: {
    type: Number,
    default: 0
  },

  layerIndex: Number

});


const UserDesignSchema = new mongoose.Schema({

  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required:true
  },

  designName:{
 type:String,
 default:"Untitled Design"
},

  productId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    default:null
  },

  source:{
    type:String,
    enum:["product","studio"],
    required:true
  },

  clothType:{
    type:String
  },

  clothColor:{
    type:String
  },

  // all objects placed on tshirt
  elements:[DesignElementSchema],

  // generated preview image
  previewImage:{
    type:String
  },

  status:{
    type:String,
    enum:["draft","saved","ordered"],
    default:"draft"
  }

},{
  timestamps:true
});

module.exports = mongoose.model("UserDesign", UserDesignSchema);