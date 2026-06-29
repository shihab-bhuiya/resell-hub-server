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
        const usersCollection = db.collection("user");
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


        // Get All Products of DB
        app.get("/api/products", async (req, res) => {
            try {
                const products = await productsCollection
                    .find({
                        sold: { $ne: true },
                    })
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

        app.get("/api/admin/products", async (req, res) => {
            try {
                const products = await productsCollection.find().toArray();

                res.send({
                    success: true,
                    data: products,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        // Admin Apis
        app.get("/api/admin/overview", async (req, res) => {
            try {
                const totalUsers = await usersCollection.countDocuments();
                const totalProducts = await productsCollection.countDocuments();
                const totalOrders = await ordersCollection.countDocuments();

                res.send({
                    success: true,
                    data: {
                        totalUsers,
                        totalProducts,
                        totalOrders,
                    },
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        // Read all users
        app.get("/api/users", async (req, res) => {
            const users = await usersCollection.find().toArray();

            res.send({
                success: true,
                data: users,
            });
        });
        app.patch("/api/users/:id", async (req, res) => {
            const id = req.params.id;
            const { status } = req.body;

            const result = await usersCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: { status },
                }
            );

            res.send({
                success: true,
                data: result,
            });
        });

        app.delete("/api/users/:id", async (req, res) => {
            const id = req.params.id;

            const result = await usersCollection.deleteOne({
                _id: new ObjectId(id),
            });

            res.send({
                success: true,
                data: result,
            });
        });

        // Admin product API

        app.patch("/api/products/:id", async (req, res) => {
            const id = req.params.id;
            const { status } = req.body;

            const result = await productsCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: { status },
                }
            );

            res.send({
                success: true,
                data: result,
            });
        });

        app.delete("/api/products/:id", async (req, res) => {
            const id = req.params.id;

            const result = await productsCollection.deleteOne({
                _id: new ObjectId(id),
            });

            res.send({
                success: true,
                data: result,
            });
        });


        // Admin order status API

        app.patch("/api/orders/:id", async (req, res) => {
            const id = req.params.id;
            const { orderStatus } = req.body;

            const result = await ordersCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: { orderStatus },
                }
            );

            res.send({
                success: true,
                data: result,
            });
        });

        // Admin Users API
        app.get("/api/users", async (req, res) => {
            try {
                const users = await usersCollection.find().toArray();

                res.send({
                    success: true,
                    data: users,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });


        app.patch("/api/users/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const { status } = req.body;

                const result = await usersCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: { status },
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

        app.delete("/api/users/:id", async (req, res) => {
            try {
                const id = req.params.id;

                const result = await usersCollection.deleteOne({
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

        // admin product management api
        app.get("/api/products", async (req, res) => {
            try {
                const products = await productsCollection.find().toArray();

                res.send({
                    success: true,
                    data: products,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        app.patch("/api/products/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const { status } = req.body;

                const result = await productsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: { status },
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

        // Get All orders 

        app.get("/api/orders", async (req, res) => {
            try {
                const orders = await ordersCollection.find().toArray();

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
        // Update Orders 

        app.patch("/api/orders/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const { orderStatus } = req.body;

                const result = await ordersCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: { orderStatus },
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

        // Buyer overview API
        app.get("/api/buyer/overview/:buyerId", async (req, res) => {
            try {
                const buyerId = req.params.buyerId;

                const totalOrders = await ordersCollection.countDocuments({
                    buyerId,
                });

                const pendingOrders = await ordersCollection.countDocuments({
                    buyerId,
                    orderStatus: "pending",
                });

                const wishlistItems = await wishlistCollection.countDocuments({
                    buyerId,
                });

                const paidOrders = await ordersCollection.countDocuments({
                    buyerId,
                    paymentStatus: "paid",
                });

                res.send({
                    success: true,
                    data: {
                        totalOrders,
                        pendingOrders,
                        wishlistItems,
                        paidOrders,
                    },
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        app.post("/api/payments", async (req, res) => {
            try {
                const payment = req.body;

                const existing = await paymentsCollection.findOne({
                    transactionId: payment.transactionId,
                });

                if (existing) {
                    return res.send({
                        success: true,
                        message: "Payment already saved",
                    });
                }

                const paymentResult =
                    await paymentsCollection.insertOne(payment);

                const order = {
                    buyerId: payment.buyerId,
                    sellerId: payment.sellerId,
                    productId: payment.productId,
                    transactionId: payment.transactionId,

                    orderStatus: "pending",
                    paymentStatus: "paid",

                    amount: payment.paymentAmount,
                    createdAt: new Date(),
                };

                const orderResult =
                    await productsCollection.updateOne(
                        {
                            _id: new ObjectId(payment.productId),
                        },
                        {
                            $set: {
                                sold: true,
                                soldAt: new Date(),
                            },
                        }
                    );

                res.send({
                    success: true,
                    paymentResult,
                    orderResult,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        // Api for category page
        app.get("/api/categories", async (req, res) => {
            try {
                const categories =
                    await productsCollection.distinct("category");

                res.send({
                    success: true,
                    data: categories,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        app.get("/api/categories/:category", async (req, res) => {
            try {
                const category = req.params.category;

                const products = await productsCollection
                    .find({
                        category,
                        status: "approved",
                    })
                    .toArray();

                res.send({
                    success: true,
                    data: products,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });
        app.get("/api/categories", async (req, res) => {
            try {
                const categories =
                    await productsCollection.distinct("category", {
                        status: "approved",
                    });

                res.send({
                    success: true,
                    data: categories,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        app.get("/api/categories/:category", async (req, res) => {
            try {
                const category = req.params.category;

                const products =
                    await productsCollection
                        .find({
                            category,
                            status: "approved",
                        })
                        .toArray();

                res.send({
                    success: true,
                    data: products,
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        });

        app.get("/api/featured-products", async (req, res) => {
            const products = await productsCollection
                .find({ status: "approved" })
                .limit(8)
                .toArray();

            res.send({
                success: true,
                data: products,
            });
        });

        // MarketPlace Stats API
        app.get("/api/stats", async (req, res) => {
            try {
                const totalProducts =
                    await productsCollection.countDocuments();

                const totalSellers =
                    await usersCollection.countDocuments({
                        role: "seller",
                    });

                const totalBuyers =
                    await usersCollection.countDocuments({
                        role: "buyer",
                    });

                const completedOrders =
                    await ordersCollection.countDocuments({
                        orderStatus: "delivered",
                    });

                res.send({
                    success: true,
                    data: {
                        totalProducts,
                        totalSellers,
                        totalBuyers,
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