const Order = require("../models/Order");
const { asyncHandler, sendSuccess } = require("./BaseController");
const PDFDocument = require("pdfkit")

//FETCH USER ORDER
const fetchOrder = asyncHandler(async(req, res) => {
    try {
        
        const userId = req?.user?._id 
        const adminId = req.admin?._id
        console.log('in fetch order', userId);

      const { search = "", status="ALL" } = req.query;
      console.log('req.query', req.query);
      console.log('req.params', req.params);
      
      const page = parseInt(req.query.page) || 1;

      const limit = parseInt(req.query.limit) || 10;

      const skipValue = (page - 1) * limit;

      const filter = {};

      if (!adminId && userId) {
  filter.user = userId;
}

      if (search) {
  filter.$or = [
    { orderId: { $regex: search, $options: "i" } },
    { "deliveryAddress.phone": { $regex: search, $options: "i" } },
    { "deliveryAddress.fName": { $regex: search, $options: "i" } }
  ];
}
      

console.log('status:', filter);

        if(status !== 'ALL') {
            filter.orderStatus = status
        }
      
      const [orders, totalOrders] = await Promise.all([
        Order.find(filter)
          .populate(["items.product", "items.variant"])
          .sort({ createdAt: -1 })
          .skip(skipValue)
          .limit(limit)
         ,Order.countDocuments(filter),
      ]);
      
      const totalPages = Math.ceil(totalOrders / limit);
      console.log('total order', search);

      sendSuccess(res, 'Orders fetched successfully', {orders, pagination: {
          limit,
          page,
          totalPages,
          totalOrders,
        },})

    } catch (error) {
      throw error;
    }
})

 //FETCH ORDER BY ID
  const fetchOrderById = async(req, res) => {
    try {
        const { orderId } = req.params
        console.log('orderId:', orderId);
        
      const order = await Order.findOne({ _id: orderId }).populate(
        ["items.product", "items.variant"]
      );
      sendSuccess(res, 'Order fetched successfully', {order}, 200);
    } catch (error) {
      throw error;
    }
  }

//UPDATE ORDER
const updateOrderStatus = asyncHandler(async(req, res) => {
   try {
     const { orderId, status } = req.query
    console.log('params', req.query);

    const order = await Order.findByIdAndUpdate(orderId, {orderStatus: status}, {new: true})

    sendSuccess(res, 'Status updated successfully', {order}, 200)

   } catch (error) {
    throw error
   }
})

// DOWNLOAD INVOICE
const downloadInvoice = async (req, res) => {
  try {
      const order = await Order.findById(req.params.orderId).populate("items.product");
      
      if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
        
        const doc = new PDFDocument({ margin: 50 });
        const pageWidth = doc.page.width;
        const centerX = (pageWidth - 100) / 2;


        doc.image("public/amcloth-logo-text.png", centerX, 20, { width: 100 });
        doc.moveDown(6)
    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.orderId}.pdf`
    );

    // Handle stream errors
    doc.on("error", (err) => {
      console.error("PDF error:", err);
      if (!res.headersSent) res.status(500).end();
    });

    doc.pipe(res);

    /* ---------- HEADER ---------- */
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("ORDER INVOICE", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).font("Helvetica");
    doc.text(`Order ID: ${order.orderId}`, { align: "left", continued: true });
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, {
      align: "right",
    });
    doc.moveDown(2);

    /* ---------- ITEMS TABLE ---------- */
    const tableTop = doc.y;
    const itemStartX = 50;
    const qtyX = 300;
    const priceX = 370;
    const totalX = 450;

    doc.font("Helvetica-Bold");
    doc.text("Product", itemStartX, tableTop);
    doc.text("Qty", qtyX, tableTop);
    doc.text("Price", priceX, tableTop);
    doc.text("Total", totalX, tableTop);

    doc.moveTo(itemStartX, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    doc.font("Helvetica");
    let rowY = tableTop + 25;

    order.items.forEach((item) => {
      doc.text(item.product.name, itemStartX, rowY);
      doc.text(item.quantity.toString(), qtyX, rowY);
      doc.text(`Rs. ${item.finalUnitPrice}`, priceX, rowY);
      doc.text(`Rs. ${item.itemTotal}`, totalX, rowY);
      rowY += 20;
    });

    doc.moveDown(5);

    /* ---------- SUMMARY ---------- */
    const summaryX = 420;
    const labelWidth = 150;
    const valueWidth = 100;
    const rowHeight = 20;
    let currentY = doc.y;

    const drawSummaryRow = (label, value, valueColor = "black", isBold = false) => {
      doc.font(isBold ? "Helvetica-Bold" : "Helvetica");
      // Label
      doc
        .fillColor("black")
        .text(label, summaryX - labelWidth, currentY, {
          width: labelWidth,
          align: "left",
        });
      // Value
      doc
        .fillColor(valueColor)
        .text(`Rs. ${value}`, summaryX, currentY, {
          width: valueWidth,
          align: "right",
        });
      currentY += rowHeight;
    };

    drawSummaryRow("Sub Total:", order.subTotal);
    if (order.shippingFee) drawSummaryRow("Shipping:", order.shippingFee);
    if (order.codFee) drawSummaryRow("COD Fee:", order.codFee);
    if (order.totalDiscount) drawSummaryRow("Discount:", `-${order.totalDiscount}`, "green");

    // Line under discount or last summary row
    doc
      .moveTo(summaryX - labelWidth, currentY - 5)
      .lineTo(summaryX + valueWidth, currentY - 5)
      .strokeColor("black")
      .lineWidth(1)
      .stroke();

    drawSummaryRow("Total:", order.totalAmount, "black", true);

    doc.end();
  } catch (error) {
    console.error("Invoice generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Invoice generation failed" });
    }
  }
};



module.exports = {
    fetchOrder,
    updateOrderStatus,
    downloadInvoice,
    fetchOrderById
}