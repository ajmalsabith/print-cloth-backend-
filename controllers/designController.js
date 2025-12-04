const Design = require("../models/design");

// Create Category
const uploadDesign = async (req, res) => {
  try {
    const design = await Design.create(req.body);
    res.status(201).json({ success: true, message: 'Design uploaded successfully' , data: design });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};