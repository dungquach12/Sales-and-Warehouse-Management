const controller = {};
const { Product, Category, Order, OrderItem } = require("../../../models");
const { Op } = require("sequelize");

controller.createOrder = async (req, res) => {
    try {
        const { userId, customerName, orderMethod, paymentMethod, items, total } = req.body;

        // Validate required fields
        if (!customerName || !orderMethod || !paymentMethod) {
            return res.status(400).json({ error: "Vui lòng cung cấp tên khách hàng, phương thức đặt hàng và phương thức thanh toán." });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "Vui lòng cung cấp danh sách sản phẩm." });
        }

        // Lấy danh sách sản phẩm từ database
        const productIds = items.map(item => item.productId);
        const products = await Product.findAll({
            where: { id: { [Op.in]: productIds } }
        });

        // Kiểm tra xem tất cả sản phẩm có tồn tại không
        if (products.length !== items.length) {
            return res.status(404).json({ error: "Một hoặc nhiều sản phẩm không tồn tại." });
        }

        // Create order using correct model field names
        const order = await Order.create({
            customer_name: customerName,
            order_method: orderMethod,
            payment_method: paymentMethod,
            total_price: parseFloat(total) || 0,
            status: "completed"
        });

        // Create order items
        const orderItems = await Promise.all(
            items.map(item => 
                OrderItem.create({
                    order_id: order.id,
                    product_id: item.productId,
                    quantity: parseInt(item.quantity) || 1,
                    unit_price: parseFloat(item.price) || 0
                })
            )
        );

        return res.status(201).json({
            message: "Đơn hàng được tạo thành công.",
            order: {
                id: order.id,
                customer_name: order.customer_name,
                order_method: order.order_method,
                payment_method: order.payment_method,
                total_price: order.total_price,
                status: order.status,
                items: orderItems.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                }))
            }
        });
        
    } catch (error) {
        console.error("Lỗi khi tạo đơn hàng:", error);
        return res.status(500).json({ error: "Đã xảy ra lỗi khi tạo đơn hàng." });
    }
};
        

module.exports = controller;