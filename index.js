const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();

        const db = client.db("resell-hub");
        const productsCollection = db.collection("products");
        const ordersCollection = db.collection("orders");
        const usersCollection = db.collection("users");
        const paymentsCollection = db.collection("payments")
        const wishlistCollection = db.collection("wishlist")

        console.log("✅ MongoDB Connected");

        // CREATE PRODUCT
        app.post("/api/products", async (req, res) => {
            try {
                const product = req.body;

                if (
                    !product.title ||
                    !product.category ||
                    !product.condition ||
                    !product.price
                ) {
                    return res.status(400).send({
                        success: false,
                        message: "Missing required fields",
                    });
                }

                const result = await productsCollection.insertOne(product);

                res.send({
                    success: true,
                    message: "Product added successfully",
                    insertedId: result.insertedId,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        // GET ALL PRODUCTS OF A SELLER
        app.get("/api/products/seller/:sellerId", async (req, res) => {
            try {
                const sellerId = req.params.sellerId;

                const result = await productsCollection
                    .find({
                        "userId": sellerId,
                    })
                    .toArray();

                res.send({
                    success: true,
                    data: result,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        // GET SINGLE PRODUCT
        app.get("/api/products/:id", async (req, res) => {
            try {
                const id = req.params.id;

                const product = await productsCollection.findOne({
                    _id: new ObjectId(id),
                });

                if (!product) {
                    return res.status(404).send({
                        success: false,
                        message: "Product not found",
                    });
                }

                res.send({
                    success: true,
                    data: product,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        // UPDATE PRODUCT
        app.put("/api/products/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updatedProduct = req.body;

                const result = await productsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: updatedProduct,
                    }
                );

                res.send({
                    success: true,
                    data: result,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        // DELETE PRODUCT
        app.delete("/api/products/:id", async (req, res) => {
            try {
                const id = req.params.id;

                const result = await productsCollection.deleteOne({
                    _id: new ObjectId(id),
                });

                res.send({
                    success: true,
                    data: result,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        // Api Orders

        app.post("/api/orders", async (req, res) => {
            try {
                const order = req.body;

                if (
                    !order.productId ||
                    !order.sellerId ||
                    !order.buyerId
                ) {
                    return res.status(400).send({
                        success: false,
                        message: "Missing required fields",
                    });
                }

                order.orderStatus = "pending";
                order.paymentStatus = "pending";
                order.createdAt = new Date();

                const result = await ordersCollection.insertOne(order);

                res.send({
                    success: true,
                    insertedId: result.insertedId,
                    message: "Order created successfully",
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });
        app.get("/api/orders/seller/:sellerId", async (req, res) => {
            try {
                const sellerId = req.params.sellerId;

                const orders = await ordersCollection
                    .find({ sellerId })
                    .toArray();

                res.send({
                    success: true,
                    data: orders,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        app.get("/api/orders/buyer/:buyerId", async (req, res) => {
            try {
                const buyerId = req.params.buyerId;

                const orders = await ordersCollection
                    .find({ buyerId })
                    .toArray();

                res.send({
                    success: true,
                    data: orders,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });
        app.patch("/api/orders/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const { orderStatus } = req.body;

                const result = await ordersCollection.updateOne(
                    {
                        _id: new ObjectId(id),
                    },
                    {
                        $set: {
                            orderStatus,
                        },
                    }
                );

                res.send({
                    success: true,
                    data: result,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        app.delete("/api/orders/:id", async (req, res) => {
            try {
                const id = req.params.id;

                const result = await ordersCollection.deleteOne({
                    _id: new ObjectId(id),
                });

                res.send({
                    success: true,
                    data: result,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        app.get("/api/analytics/seller/:sellerId", async (req, res) => {
            try {
                const sellerId = req.params.sellerId;

                const orders = await ordersCollection
                    .find({ sellerId })
                    .toArray();

                const totalOrders = orders.length;

                const completedOrders = orders.filter(
                    (order) => order.orderStatus === "delivered"
                );

                const pendingOrders = orders.filter(
                    (order) =>
                        order.orderStatus === "pending" ||
                        order.orderStatus === "confirmed"
                );

                const totalRevenue = completedOrders.reduce(
                    (sum, order) => sum + Number(order.productPrice || 0),
                    0
                );

                res.send({
                    success: true,
                    data: {
                        totalOrders,
                        totalSales: completedOrders.length,
                        pendingOrders: pendingOrders.length,
                        totalRevenue,
                    },
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });
        app.get("/api/users/:id", async (req, res) => {
            try {
                const id = req.params.id;

                const user = await usersCollection.findOne({
                    _id: new ObjectId(id),
                });

                res.send({
                    success: true,
                    data: user,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        app.put("/api/users/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updatedData = req.body;

                const result = await usersCollection.updateOne(
                    {
                        _id: new ObjectId(id),
                    },
                    {
                        $set: updatedData,
                    }
                );

                res.send({
                    success: true,
                    data: result,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });


        // Buyer Api
        app.get("/api/buyer-overview/:buyerId", async (req, res) => {
            try {
                const buyerId = req.params.buyerId;

                const orders = await ordersCollection
                    .find({ buyerId })
                    .toArray();

                const totalOrders = orders.length;
                const pendingOrders = orders.filter(
                    o =>
                        o.orderStatus === "pending" ||
                        o.orderStatus === "confirmed" ||
                        o.orderStatus === "shipped"
                ).length;

                const completedOrders = orders.filter(
                    o => o.orderStatus === "delivered"
                ).length;

                res.send({
                    success: true,
                    data: {
                        totalOrders,
                        pendingOrders,
                        completedOrders,
                    },
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        app.get("/api/orders/buyer/:buyerId", async (req, res) => {
            try {
                const buyerId = req.params.buyerId;

                const orders = await ordersCollection
                    .find({ buyerId })
                    .toArray();

                res.send({
                    success: true,
                    data: orders,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        // Wishlist Api
        app.post("/api/wishlist", async (req, res) => {
            try {
                const wishlistData = req.body;

                const existing = await wishlistCollection.findOne({
                    buyerId: wishlistData.buyerId,
                    productId: wishlistData.productId
                });

                if (existing) {
                    return res.send({
                        success: false,
                        message: "Already in wishlist"
                    });
                }

                wishlistData.savedAt = new Date();

                const result = await wishlistCollection.insertOne(wishlistData);

                res.send({
                    success: true,
                    data: result
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message
                });
            }
        });

        app.get("/api/wishlist/:buyerId", async (req, res) => {
            try {
                const buyerId = req.params.buyerId;

                const wishlist = await wishlistCollection.find({
                    buyerId
                }).toArray();

                res.send({
                    success: true,
                    data: wishlist
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message
                });
            }
        });


        app.delete("/api/wishlist/:id", async (req, res) => {
            try {
                const id = req.params.id;

                const result = await wishlistCollection.deleteOne({
                    _id: new ObjectId(id)
                });

                res.send({
                    success: true,
                    data: result
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message
                });
            }
        });

        // Payments Api
        app.get("/api/payments/:buyerId", async (req, res) => {
            try {
                const buyerId = req.params.buyerId;

                const payments = await paymentsCollection
                    .find({ buyerId })
                    .toArray();

                res.send({
                    success: true,
                    data: payments
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message
                });
            }
        });

        app.get("/api/buyer-overview/:buyerId", async (req, res) => {
            try {
                const buyerId = req.params.buyerId;

                const orders = await ordersCollection
                    .find({ buyerId })
                    .toArray();

                const wishlist = await wishlistCollection
                    .find({ buyerId })
                    .toArray();

                const totalOrders = orders.length;

                const pendingOrders = orders.filter(
                    (order) =>
                        order.orderStatus === "pending" ||
                        order.orderStatus === "confirmed" ||
                        order.orderStatus === "shipped"
                ).length;

                const completedOrders = orders.filter(
                    (order) => order.orderStatus === "delivered"
                ).length;

                const totalSpent = orders
                    .filter(order => order.paymentStatus === "paid")
                    .reduce(
                        (sum, order) =>
                            sum + Number(order.productPrice || 0),
                        0
                    );

                res.send({
                    success: true,
                    data: {
                        totalOrders,
                        pendingOrders,
                        completedOrders,
                        wishlistCount: wishlist.length,
                        totalSpent
                    }
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message
                });
            }
        });
        app.post("/api/payments", async (req, res) => {
            try {
                const payment = req.body;

                payment.paidAt = new Date();

                const result = await paymentsCollection.insertOne(payment);

                res.send({
                    success: true,
                    data: result,
                    message: "Payment saved successfully"
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message
                });
            }
        });
        app.get("/api/payments/:buyerId", async (req, res) => {
            try {
                const buyerId = req.params.buyerId;

                const payments = await paymentsCollection
                    .find({ buyerId })
                    .toArray();

                res.send({
                    success: true,
                    data: payments
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message
                });
            }
        });

        app.get("/api/products", async (req, res) => {
            try {
                const products = await productsCollection
                    .find()
                    .sort({ _id: -1 })
                    .toArray();

                res.send({
                    success: true,
                    data: products
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message
                });
            }
        });

        // Admin Apis


        // Ping database
        await client.db("admin").command({ ping: 1 });
        console.log("✅ Pinged MongoDB successfully.");
    } catch (err) {
        console.error("MongoDB Connection Error:", err);
    }
}

run();

app.get("/", (req, res) => {
    res.send("Server Running Fine");
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});