const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

export async function POST(request, response) {
  try {
    const { customerOrderId, productId, quantity } = request.body;
    const corder = await prisma.customer_order_product.create({
      data: {
        customerOrderId,
        productId,
        quantity,
      },
    });
    return response.status(201).json(corder);
  } catch (error) {
    console.error("Error creating prodcut order:", error);
    return response.status(500).json({ error: "Error creating product order" });
  }
}
