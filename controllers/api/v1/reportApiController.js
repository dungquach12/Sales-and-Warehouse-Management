const controller = {};
const { Order, OrderItem, Product } = require("../../../models");
const { Op } = require("sequelize");

controller.getAllReport = async (req, res) => {
    const { period } = req.query;
    
    try {
        let startDate;
        const now = new Date();
        
        switch (period) {
            case 'today':
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        }
        
        // Step 1: Get orders
        const orders = await Order.findAll({
            where: {
                created_at: { [Op.gte]: startDate },
                status: 'completed'
            },
            order: [['created_at', 'DESC']],
            raw: true
        });
        
        if (orders.length === 0) {
            return res.json({ success: true, orders: [] });
        }
        
        const orderIds = orders.map(order => order.id);
        
        // Step 2: Get order items with product info
        const items = await OrderItem.findAll({
            where: { order_id: { [Op.in]: orderIds } },
            include: [{
                model: Product,
                as: 'Product',
                attributes: ['id', 'name', 'price', 'cost'],
                required: false
            }],
            raw: true,
            nest: true
        });
        
        // Step 3: Group items by order_id and calculate profit per item
        const itemsByOrder = {};
        items.forEach(item => {
            if (!itemsByOrder[item.order_id]) {
                itemsByOrder[item.order_id] = [];
            }
            
            const cost = parseFloat(item.Product?.cost || 0);
            const unitPrice = parseFloat(item.unit_price);
            const quantity = item.quantity;
            const profit = (unitPrice - cost) * quantity;
            
            itemsByOrder[item.order_id].push({
                id: item.id,
                name: item.Product?.name || `Sản phẩm ${item.product_id}`,
                price: unitPrice,
                profit: profit,
                qty: quantity
            });
        });
        
        // Step 4: Combine orders with their items and calculate total profit
        const transformedOrders = orders.map(order => ({
            id: order.id,
            customer_id: order.customer_id,
            customer_name: order.customer_name,
            payment_method: order.payment_method,
            order_method: order.order_method,
            total_price: parseFloat(order.total_price) || 0,
            total_profit: itemsByOrder[order.id]?.reduce((sum, item) => sum + (item.profit || 0), 0) || 0,
            status: order.status,
            createdAt: order.createdAt,
            items: itemsByOrder[order.id] || []
        }));
        
        return res.json({ 
            success: true, 
            orders: transformedOrders
        });
        
    } catch (error) {
        console.error("Error fetching report:", error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

module.exports = controller;