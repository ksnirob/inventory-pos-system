import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.stockTransaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();

  const categories = await Promise.all(
    [
      ["Electronics", "Devices, accessories, and digital equipment"],
      ["Office Supplies", "Stationery and everyday office items"],
      ["Furniture", "Office and warehouse furniture"],
      ["Packaging", "Boxes, tapes, labels, and packing material"],
    ["Grocery", "Weighted grocery goods sold by kg or packet"]
    ].map(([name, description]) => prisma.category.create({ data: { name, description } }))
  );

  const suppliers = await Promise.all(
    [
      ["Northline Traders", "Ava Carter", "ava@northline.example", "+1 555 0101", "42 Market Street"],
      ["Metro Wholesale", "Liam Reed", "liam@metro.example", "+1 555 0102", "8 Depot Avenue"],
      ["Prime Office Co.", "Mia Khan", "mia@primeoffice.example", "+1 555 0103", "19 Commerce Road"],
      ["Bright Supply", "Noah Lee", "noah@brightsupply.example", "+1 555 0104", "71 Supply Lane"],
      ["CleanPro Distribution", "Sara Bell", "sara@cleanpro.example", "+1 555 0105", "12 Industrial Park"]
    ].map(([name, contactPerson, email, phone, address]) =>
      prisma.supplier.create({ data: { name, contactPerson, email, phone, address } })
    )
  );

  const productSeeds = [
    ["Wireless Mouse", "ELE-MOU-001", 12.5, 24.99, 42, 10, "piece", 0, 0],
    ["USB-C Hub", "ELE-HUB-002", 28, 49.99, 18, 8, "piece", 0, 1],
    ["Laptop Stand", "ELE-STD-003", 16.75, 32, 6, 6, "piece", 0, 2],
    ["Copy Paper A4", "OFF-PAP-004", 4.2, 7.5, 120, 30, "box", 1, 2],
    ["Basmati Rice", "GRO-RIC-005", 1.8, 3.2, 5, 1, "kg", 4, 3],
    ["Sugar", "GRO-SUG-006", 0.7, 1.25, 8, 2, "kg", 4, 3],
    ["Ergonomic Chair", "FUR-CHR-007", 74, 129, 9, 4, "piece", 2, 1],
    ["Standing Desk", "FUR-DSK-008", 180, 299, 3, 3, "piece", 2, 0],
    ["Storage Cabinet", "FUR-CAB-009", 95, 159, 7, 2, "piece", 2, 2],
    ["Shipping Box Medium", "PAC-BOX-010", 0.8, 1.75, 240, 80, "piece", 3, 1],
    ["Packing Tape", "PAC-TAP-011", 1.4, 3.25, 24, 25, "piece", 3, 3],
    ["Thermal Labels", "PAC-LBL-012", 6.5, 12.75, 40, 10, "box", 3, 4],
    ["Lentils", "GRO-LEN-013", 1.1, 2.4, 6, 1, "kg", 4, 4],
    ["Flour", "GRO-FLO-014", 0.8, 1.7, 10, 2, "kg", 4, 4],
    ["Cooking Oil", "GRO-OIL-015", 2.9, 5.6, 12, 3, "litre", 4, 1]
  ] as const;

  const products = await Promise.all(
    productSeeds.map(([name, sku, purchasePrice, sellingPrice, quantity, minimumStockLevel, unit, categoryIndex, supplierIndex]) =>
      prisma.product.create({
        data: {
          name,
          sku,
          description: `${name} maintained in local inventory.`,
          purchasePrice,
          sellingPrice,
          quantity,
          minimumStockLevel,
          unit,
          categoryId: categories[categoryIndex].id,
          supplierId: suppliers[supplierIndex].id
        }
      })
    )
  );

  await Promise.all(
    products.slice(0, 10).map((product, index) =>
      prisma.stockTransaction.create({
        data: {
          productId: product.id,
          type: "STOCK_IN",
          quantity: Number(product.quantity) + 5,
          previousQuantity: 0,
          newQuantity: Number(product.quantity) + 5,
          referenceNumber: `SEED-IN-${String(index + 1).padStart(3, "0")}`,
          note: "Initial stock receiving",
          transactionDate: new Date(Date.now() - (15 - index) * 24 * 60 * 60 * 1000)
        }
      })
    )
  );

  await Promise.all(
    products.slice(0, 6).map((product, index) =>
      prisma.stockTransaction.create({
        data: {
          productId: product.id,
          type: index % 2 === 0 ? "STOCK_OUT" : "ADJUSTMENT",
          quantity: index % 2 === 0 ? 5 : Number(product.quantity),
          previousQuantity: Number(product.quantity) + 5,
          newQuantity: Number(product.quantity),
          referenceNumber: `SEED-ADJ-${String(index + 1).padStart(3, "0")}`,
          note: "Seeded stock history",
          transactionDate: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000)
        }
      })
    )
  );

  const customerSeeds = [
    ["Harbor Retail", "orders@harbor.example", "+1 555 0201", "18 Harbor Road"],
    ["City Office Hub", "sales@cityhub.example", "+1 555 0202", "77 Center Street"],
    ["North School", "admin@northschool.example", "+1 555 0203", "5 Academy Lane"],
    ["Studio Lane", "buying@studiolane.example", "+1 555 0204", "44 Creative Block"]
  ] as const;

  const customers = await Promise.all(
    customerSeeds.map(([name, email, phone, address]) => prisma.customer.create({ data: { name, email, phone, address } }))
  );

  const orderSeeds = [
    { customerIndex: 0, status: "CONFIRMED", lines: [[0, 2], [3, 5]] },
    { customerIndex: 1, status: "SHIPPED", lines: [[6, 1], [10, 3]] },
    { customerIndex: 2, status: "PENDING", lines: [[4, 2], [5, 8]] },
    { customerIndex: 3, status: "DELIVERED", lines: [[1, 1], [11, 2]] }
  ] as const;

  for (const [index, orderSeed] of orderSeeds.entries()) {
    const lines = orderSeed.lines.map(([productIndex, quantity]) => {
      const product = products[productIndex];
      const unitPrice = Number(product.sellingPrice);
      return {
        product,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity
      };
    });
    const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0);
    const tax = Number((subtotal * 0.05).toFixed(2));
    const total = subtotal + tax;
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-SEED-${String(index + 1).padStart(3, "0")}`,
        customerId: customers[orderSeed.customerIndex].id,
        status: orderSeed.status,
        subtotal,
        tax,
        discount: 0,
        total,
        paymentMethod: index % 2 === 0 ? "CASH" : "CARD",
        paidAmount: total,
        changeDue: 0,
        note: "Seed order",
        orderDate: new Date(Date.now() - (4 - index) * 24 * 60 * 60 * 1000)
      }
    });

    for (const line of lines) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: line.product.id,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
