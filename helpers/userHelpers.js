var db = require("../config/connection");
var ObjectId = require("mongodb").ObjectId;
const bcrypt = require("bcrypt");
const { response } = require("../app");
var uniqid = require("uniqid");
var referralCodeGenerator = require("referral-code-generator");
const ref = referralCodeGenerator.alphaNumeric("uppercase", 4, 4);
var paypal = require("paypal-rest-sdk");
paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:
    "AaqMVQEzkiBtx5KW_Xw1LWtJflGewTq6FpgKiVOZ8IKwXXh-Z7mX0USziB4iWrg9wDpRBmnrR-rHoI0e", // please provide your client id here
  client_secret:
    "EAhfXz3P-CooXSCiGfRTy8JH62hN-bLZ0-e-i6b8c33ceW2v6K4R8GucoG1LgmQIeQ89a3-RwmEI0ync", // provide your client secret here
});

const Razorpay = require("razorpay");
const { resolve } = require("path");
var instance = new Razorpay({
  key_id: "rzp_test_khNCczWUSpMkAN",
  key_secret: "KFurDKWHvBINgjiJjdiau6OR",
});
module.exports = {
  verifyLogin: (req, res, next) => {
    req.session.redirectTo = req.url;
    if (req.session.userLoggedIn) {
      console.log(req.session.redirectTo, "if");
      next();
    } else {
      console.log(req.session.redirectTo, "inside elseee");
      res.render("user/login", { user: false });
    }
  },
  verifyNonLogin: (req, res, next) => {
    req.session.redirectTo = req.url;
    next();
  },

  addUsers: (userData) => {
    console.log(userData, "USERDATA>>>>>");
    walletDetails = [];
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10);
      userData.status = true;
      userData.referalId = ref;
      userData.wallet = 0;
      userData.walletDetails = walletDetails;
      db.get()
        .collection("users")
        .insertOne(userData)
        .then((data) => {
          resolve(userData);
        });
    });
  },

  getLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection("users")
        .findOne({ email: userData.email });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            let stat = user.status;
            if (stat) {
              console.log("success");
              response.user = user;
              response.status = true;
              resolve(response);
            } else {
              resolve({ status: false });
            }
          } else {
            console.log("loggin failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("failed");
        resolve({ status: false });
      }
    });
  },

  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let user = await db
        .get()
        .collection("users")
        .findOne({ mobileNo: userData.mobile });
      if (user) {
        let unblocked = user.status;
        resolve(response);
        if (unblocked) {
          response.user = user;
          response.status = true;
          resolve(response);
        } else {
          console.log("user blocked");
          resolve({ status: 222 });
        }
      } else {
        console.log("user no found");
        resolve({ status: false });
      }
    }).catch();
  },

  addToCart: (pId, userId) => {
    return new Promise(async (resolve, reject) => {
      let productInfo = await db
        .get()
        .collection("product")
        .findOne({ _id: ObjectId(pId) });
      console.log(productInfo, "productinfo");
      let MRP = productInfo.prodMarketPrice;
      let frelloPrice = productInfo.prodSellPrice;
      let pName = productInfo.prodName;
      let imageMany = productInfo.imageMany;

      let proObj = {
        item: ObjectId(pId),
        quantity: 1,
        MRP: MRP,
        frelloPrice: frelloPrice,
        pName: pName,
        statusbar: true,
        imageMany: imageMany,
      };
      let usercart = await db
        .get()
        .collection("cart")
        .findOne({ user: ObjectId(userId) });
      if (usercart) {
        let proExist = usercart.products.findIndex(
          (product) => product.item == pId
        );
        console.log(proExist);
        if (proExist != -1) {
          db.get()
            .collection("cart")
            .updateOne(
              { user: ObjectId(userId), "products.item": ObjectId(pId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then((response) => {
              resolve({ status: false });
            });
        } else {
          db.get()
            .collection("cart")
            .updateOne(
              { user: ObjectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve({ status: true });
            });
        }
      } else {
        let cartObj = {
          user: ObjectId(userId),
          products: [proObj],
        };
        db.get()
          .collection("cart")
          .insertOne(cartObj)
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },

  totalOrderCount: (uId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection("order")
        .find({ userId: ObjectId(uId) })
        .count()
        .then((orderCount) => {
          resolve(orderCount);
        });
    });
  },

  getCartDetails: (uId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection("cart")
        .aggregate([
          {
            $match: { user: ObjectId(uId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: "product",
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              products: { $arrayElemAt: ["$products", 0] },
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              products: 1,
              total: {
                $multiply: [
                  "$quantity",
                  {
                    $convert: {
                      input: "$products.prodSellPrice",
                      to: "int",
                      onError: 0,
                    },
                  },
                ],
              },
              totalMRP: {
                $multiply: [
                  "$quantity",
                  {
                    $convert: {
                      input: "$products.prodMarketPrice",
                      to: "int",
                      onError: 0,
                    },
                  },
                ],
              },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },

  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection("cart")
        .findOne({ user: ObjectId(userId) });
      if (cart) {
        count = cart.products.length;
        resolve(count);
      } else {
        resolve();
      }
    });
  },

  changeProductQuantity: (details) => {
    console.log(details, "details");
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);

    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection("cart")
          .updateOne(
            { _id: ObjectId(details.cart) },
            {
              $pull: { products: { item: ObjectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection("cart")
          .updateOne(
            {
              _id: ObjectId(details.cart),
              "products.item": ObjectId(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },

  removeProduct: (details) => {
    let productId = details.pId;
    let cartId = details.cartId;
    return new Promise((resolve, reject) => {
      db.get()
        .collection("cart")
        .updateOne(
          { _id: ObjectId(cartId) },
          {
            $pull: {
              products: { item: ObjectId(productId) },
            },
          }
        )
        .then((response) => {
          resolve({ status: true });
        });
    });
  },

  getTotalAmount: (uId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection("cart")
        .aggregate([
          {
            $match: { user: ObjectId(uId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: "product",
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              products: { $arrayElemAt: ["$products", 0] },
            },
          },

          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $multiply: [
                    "$quantity",
                    {
                      $convert: {
                        input: "$products.prodSellPrice",
                        to: "int",
                        onError: 0,
                      },
                    },
                  ],
                },
              },
            },
          },
        ])
        .toArray();
      console.log(total, "total");

      if (total < 1) {
        resolve(0);
      } else {
        resolve(total[0].total);
      }
    });
  },
  getTotalMRP: (uId) => {
    return new Promise(async (resolve, reject) => {
      let totalMRP = await db
        .get()
        .collection("cart")
        .aggregate([
          {
            $match: { user: ObjectId(uId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: "product",
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              products: { $arrayElemAt: ["$products", 0] },
            },
          },

          {
            $group: {
              _id: null,
              totalMRP: {
                $sum: {
                  $multiply: [
                    "$quantity",
                    {
                      $convert: {
                        input: "$products.prodMarketPrice",
                        to: "int",
                        onError: 0,
                      },
                    },
                  ],
                },
              },
            },
          },
        ])
        .toArray();

      if (totalMRP < 1) {
        resolve(0);
      } else {
        resolve(totalMRP[0].totalMRP);
      }
    });
  },

  catwiseName: (catname) => {
    return new Promise(async (resolve, reject) => {
      let carter = await db
        .get()
        .collection("product")
        .find({ prodCat: catname })
        .toArray();
      resolve(carter);
    });
  },

  placeOrder: (order, products, total, discount, mrp) => {
    console.log(order, "<<<<<<", products, "total", total, "mrp", mrp);
    return new Promise((resolve, reject) => {
      let status =
        order["payment-method"] === "COD" || "Wallet" ? "Placed" : "Pending";
      let subtotal = total + discount;
      let mmrp = parseInt(mrp);
      console.log(mmrp, "KKKKKKK");
      let totalProduct = products.total;
      console.log(totalProduct, "totalProduct");

      // let date = new Date();
      products.forEach((products) => {
        (products.status = status),
          (products.invoice = uniqid()),
          (products.statusbar = true),
          (products.statbar = false);
      });
      console.log(products, "products");
      let orderObj = {
        deliveryDetails: {
          name: order.name,
          mobile: order.mobile,
          zip: order.zip,
          locality: order.locality,
          house: order.house,
          street: order.street,
          town: order.town,
          state: order.state,
          email: order.email,
          addId: order.addId,
          userId: order.userId,
        },
        userId: ObjectId(order.userId),
        paymentMathod: order["payment-method"],
        MRP: mmrp,
        Subtotal: subtotal,
        discountAmt: discount,
        GrandTotal: total,
        products: products,
        status: status,
        date: new Date(),
      };

      db.get()
        .collection("order")
        .insertOne(orderObj)
        .then((response) => {
          resolve(response);
        });
    });
  },

  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection("cart")
        .findOne({ user: ObjectId(userId) });
      console.log(cart);
      resolve(cart.products);
    });
  },

  getProductDetail: (quant, pId) => {
    return new Promise((resolve, reject) => {
      let prod = db
        .get()
        .collection("product")
        .findOne({ _id: ObjectId(pId) });
      resolve(prod);
    });
  },

  getOrderDetails: (userId, page) => {
    return new Promise(async (resolve, reject) => {
      let skip = (parseInt(page) - 1) * 10;
      let orders = await db
        .get()
        .collection("order")
        .find({ userId: ObjectId(userId) })
        .sort({ date: -1 })
        .skip(skip)
        .limit(10)
        .toArray();
      resolve(orders);
    });
  },

  getTotalProd: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection("product")
        .find()
        .count()
        .then((totalProducts) => {
          resolve(totalProducts);
        });
    });
  },

  getOrderProduct: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection("order")
        .find({ _id: ObjectId(orderId) })
        .toArray();
      resolve(orders);
    });
  },

  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection("order")
        .aggregate([
          {
            $match: { _id: ObjectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
              status: "$products.status",
              price: "$products.frelloPrice",
              invoice: "$products.invoice",
            },
          },
          {
            $lookup: {
              from: "product",
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              status: 1,
              price: 1,
              invoice: 1,
              products: { $arrayElemAt: ["$products", 0] },
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              status: 1,
              price: 1,
              invoice: 1,
              products: 1,
              total: {
                $multiply: [
                  "$quantity",
                  {
                    $convert: {
                      input: "$products.prodSellPrice",
                      to: "int",
                      onError: 0,
                    },
                  },
                ],
              },
            },
          },
        ])
        .toArray();
      console.log(orderItems, "orderrrr");
      resolve(orderItems);
    });
  },

  getSingleProduct: (pId) => {
    return new Promise(async (resolve, reject) => {
      let prod = await db
        .get()
        .collection("order")
        .findOne({ "products.item": ObjectId(pId) });
      resolve(prod);
      console.log(prod, "producyy");
    });
  },

  userAddress: (address, uId) => {
    console.log(address);
    console.log(uId);
    let addObj = {
      user: ObjectId(uId),
      name: address.name,
      mobile: address.mobile,
      zip: address.zip,
      locality: address.locality,
      house: address.house,
      street: address.street,
      town: address.town,
      state: address.state,
      email: address.email,
      addId: uniqid(),
    };
    console.log(addObj);
    return new Promise(async (resolve, reject) => {
      let useraddress = await db
        .get()
        .collection("address")
        .findOne({ user: ObjectId(uId) });
      if (useraddress) {
        db.get()
          .collection("address")
          .updateOne(
            { user: ObjectId(uId) },
            {
              $push: {
                address: addObj,
              },
            }
          )
          .then(() => {
            resolve(useraddress);
          });
      } else {
        let addedObj = {
          user: ObjectId(uId),
          address: [addObj],
        };

        db.get()
          .collection("address")
          .insertOne(addedObj)
          .then(() => {
            resolve(useraddress);
          });
      }
    });
  },

  getUserAddress: (uId) => {
    return new Promise((resolve, reject) => {
      let addressdetails = db
        .get()
        .collection("address")
        .aggregate([
          {
            $match: { user: ObjectId(uId) },
          },
          {
            $unwind: "$address",
          },
        ])
        .toArray();
      resolve(addressdetails);
    });
  },

  deleteAddress: (aId, uId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection("address")
        .updateOne(
          { user: ObjectId(uId) },
          {
            $pull: { address: { addId: aId } },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  generateRazorpay: (orderIdd, totalPrice) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: totalPrice * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: orderIdd.insertedId + "",
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          console.log(order, "iorder");
          resolve(order);
        }
      });
    });
  },

  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "KFurDKWHvBINgjiJjdiau6OR");
      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  //  changePaymentStatus:(orderId)=>{
  //     return new Promise((resolve,reject)=>{
  //         db.get().collection('order').updateOne({_id:ObjectId(orderId)},
  //         {
  //             $set:{
  //                 status:'Placed',Placed:true

  //             }
  //         }
  //         ).then(()=>{
  //             resolve()
  //         })
  //     })
  //  },
  changePaymentStatus: (orderId) => {
    console.log(orderId, "ckakaferrrrrrrrrrrrrrrrr");
    return new Promise((resolve, reject) => {
      db.get()
        .collection("order")
        .updateOne(
          { _id: ObjectId(orderId) },
          {
            $set: {
              "products.$[].status": "Placed",
              Placed: true,
              status: "Placed",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  createPay: (payment) => {
    console.log(payment, "payment");
    return new Promise((resolve, reject) => {
      paypal.payment.create(payment, function (err, payment) {
        if (err) {
          reject(err);
        } else {
          resolve(payment);
        }
      });
    });
  },

  getAddress: (aId, uId) => {
    return new Promise((resolve, reject) => {
      let addressdetails = db
        .get()
        .collection("address")
        .aggregate([
          {
            $match: { user: ObjectId(uId) },
          },

          {
            $unwind: "$address",
          },

          {
            $project: {
              _id: 0,
              name: "$address.name",
              mobile: "$address.mobile",
              zip: "$address.zip",
              locality: "$address.locality",
              house: "$address.house",
              street: "$address.street",
              town: "$address.town",
              state: "$address.state",
              email: "$address.email",
              addId: "$address.addId",
            },
          },

          {
            $match: { addId: aId },
          },
        ])
        .toArray();
      resolve(addressdetails);
    });
  },

  // cancelOrder:(oId)=>{

  //     return new Promise((resolve,reject)=>{

  //         db.get().collection('order').updateOne({_id:ObjectId(oId)},
  //         {
  //             $set:{status:'Cancelled',statbar:true, Cancelled:true,Placed:false,Shipped:false,Despatched:false,OutforDelivery:false,Delivered:false,Return:false,ReturnCompleted:false}
  //         }
  //         )
  //         resolve()
  //     })
  // },
  cancelOrder: (oId, pId) => {
    console.log(oId, "LLLLLLLLLL", pId);
    return new Promise(async (resolve, reject) => {
      let cancel = await db
        .get()
        .collection("order")
        .updateOne(
          { _id: ObjectId(oId), "products.item": ObjectId(pId) },
          {
            $set: {
              "products.$.status": "Cancel Requested",
              "products.$.statbar": true,
              "products.$.statusbar": false,
            },
          }
        );
      resolve(cancel);
    });
  },

  returnOrder: (oId, pId) => {
    return new Promise(async (resolve, reject) => {
      let ret = await db
        .get()
        .collection("order")
        .updateOne(
          { _id: ObjectId(oId), "products.item": ObjectId(pId) },
          {
            $set: {
              "products.$.status": "Return Requested",
              "products.$.statbar": true,
            },
          }
        );
      resolve(ret);
    });
  },

  CODtotal: () => {
    return new Promise(async (resolve, reject) => {
      let cod = await db
        .get()
        .collection("order")
        .aggregate([
          {
            $match: { paymentMathod: "COD" },
          },
          {
            $match: { status: "Delivered" },
          },
          {
            $group: {
              _id: null,
              sum: { $sum: { $ifNull: ["$totalAmount", 0] } },
            },
          },
        ])
        .toArray();
      resolve(cod);
    });
  },
  Razortotal: () => {
    return new Promise(async (resolve, reject) => {
      let razor = await db
        .get()
        .collection("order")
        .aggregate([
          {
            $match: { paymentMathod: "Razorpay" },
          },
          {
            $match: { status: "Delivered" },
          },
          {
            $group: {
              _id: null,
              sum: { $sum: { $ifNull: ["$totalAmount", 0] } },
            },
          },
        ])
        .toArray();
      resolve(razor);
    });
  },
  Paypaltotal: () => {
    return new Promise(async (resolve, reject) => {
      let paypal = await db
        .get()
        .collection("order")
        .aggregate([
          {
            $match: { paymentMathod: "Paypal" },
          },
          {
            $match: { status: "Delivered" },
          },
          {
            $group: {
              _id: null,
              sum: { $sum: { $ifNull: ["$totalAmount", 0] } },
            },
          },
        ])
        .toArray();
      resolve(paypal);
    });
  },

  wishList: (userId, pId) => {
    let wishObj = {
      item: ObjectId(pId),
    };
    console.log(wishObj, "ororororo");

    return new Promise(async (resolve, reject) => {
      console.log(userId, "userId==================>");
      let usercart = await db
        .get()
        .collection("wishlist")
        .findOne({ user: ObjectId(userId) });
      if (usercart) {
        db.get()
          .collection("wishlist")
          .updateOne(
            { user: ObjectId(userId) },
            {
              $addToSet: { products: wishObj },
            }
          )
          .then(() => {
            resolve();
          });
      } else {
        let wishlistObj = {
          user: ObjectId(userId),
          products: [wishObj],
        };
        db.get()
          .collection("wishlist")
          .insertOne(wishlistObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },

  getWishlist: (uId) => {
    return new Promise(async (resolve, reject) => {
      let wishlistItems = await db
        .get()
        .collection("wishlist")
        .aggregate([
          {
            $match: { user: ObjectId(uId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
            },
          },
          {
            $lookup: {
              from: "product",
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },
          {
            $project: {
              item: 1,
              products: { $arrayElemAt: ["$products", 0] },
            },
          },
        ])
        .toArray();

      resolve(wishlistItems);
    });
  },

  removeFromCart: (pId, uId) => {
    console.log(pId, uId, "==============================$$$$");
    return new Promise((resolve, reject) => {
      db.get()
        .collection("wishlist")
        .updateOne(
          { user: ObjectId(uId) },
          {
            $pull: { products: { item: ObjectId(pId) } },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  getWishlistCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let wish = await db
        .get()
        .collection("wishlist")
        .findOne({ user: ObjectId(userId) });
      if (wish) {
        count = wish.products.length;
        resolve(count);
      } else {
        resolve();
      }
    });
  },

  getProduct: () => {},

  checkCoupon: (couponData, userId, total) => {
    console.log(userId, "]]]]]]]]]]]]]]]]]]]]]]");
    let tot = total;
    return new Promise(async (resolve, reject) => {
      let couponCheck = await db
        .get()
        .collection("coupons")
        .findOne({ couponCode: couponData.couponName });

      if (couponCheck == null) {
        let coupon = {};
        coupon.status = false;
        coupon.err = "invalid Coupon";
        resolve(coupon);
        console.log(coupon, "couponaaaaaaaa");
      } else {
        let couponCh = {};
        couponCh.total = tot;
        couponCh.data = couponCheck;

        resolve(couponCh);
        console.log(couponCh, "couponCheckaaaaaaaaaaaaa");
      }
    });
  },

  checkReferal: (refData) => {
    console.log(refData, "refDaata");

    return new Promise(async (resolve, reject) => {
      let userRef = await db
        .get()
        .collection("users")
        .findOne({ referalId: refData.referal });
      console.log(userRef, "userRef");

      let walletDataNew = {
        details: "Bonus from Referral",
        referer: userRef.username,
        date: new Date(),
        amount: 50,
      };

      let walletData = {
        details: "Bonus from Referral",
        referer: refData?.username,
        date: new Date(),
        amount: 100,
      };

      db.get()
        .collection("users")
        .updateOne(
          { referalId: refData.referal },
          {
            $inc: { wallet: 100 },

            $push: { walletDetails: walletData },
          }
        );
      console.log(refData.username, "refData.username");

      db.get()
        .collection("users")
        .updateOne(
          { username: refData?.username },
          {
            $inc: { wallet: 50 },

            $push: { walletDetails: walletDataNew },
          }
        );

      resolve();
    });
  },

  userProfile: (uId) => {
    return new Promise(async (resolve, reject) => {
      let profile = await db
        .get()
        .collection("users")
        .findOne({ _id: ObjectId(uId) });
      resolve(profile);
    });
  },

  getWalletHistory: (uId) => {
    return new Promise(async (resolve, reject) => {
      let history = await db
        .get()
        .collection("users")
        .findOne({ _id: ObjectId(uId) });
      resolve(history.walletDetails);
    });
  },

  walletPayment: (total, userId, orderId) => {
    let Placed = true;
    let order = orderId.insertedId.toString();

    return new Promise((resolve, reject) => {
      db.get()
        .collection("users")
        .updateOne(
          { _id: ObjectId(userId) },
          {
            $inc: { wallet: -total },
          }
        );
      db.get()
        .collection("order")
        .updateMany(
          { _id: ObjectId(order) },
          {
            $set: { status: "Placed", Placed: Placed },
          }
        );
      resolve();
    });
  },

  getAllCoupons: () => {
    return new Promise(async (resolve, reject) => {
      let coupon = await db.get().collection("coupons").find().toArray();
      resolve(coupon);
    });
  },

  editAddress: (aDetails, aId) => {
    console.log(aDetails.name, "adetaisl");

    return new Promise((resolve, reject) => {
      db.get()
        .collection("address")
        .updateOne(
          { "address.addId": aId },
          {
            $set: {
              "address.$.name": aDetails.name,
              "address.$.house": aDetails.house,
              "address.$.street": aDetails.street,
              "address.$.locality": aDetails.locality,
              "address.$.town": aDetails.town,
              "address.$.state": aDetails.state,
              "address.$.zip": aDetails.zip,
              "address.$.email": aDetails.email,
              "address.$.mobile": aDetails.mobile,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  getAllOrders1: (userId, page) => {
    console.log(page, "page");
    let skip = (parseInt(page) - 1) * 8;
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection("order")
        .aggregate([
          {
            $match: { userId: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $unwind: "$deliveryDetails",
          },
          {
            $project: {
              invoice: "$products.invoice",
              date: 1,
              name: "$deliveryDetails.name",
              mobile: "$deliveryDetails.mobile",
              item: "$products.item",
              quantity: "$products.quantity",
              MRP: "$products.MRP",
              image: "$products.imageMany",
              frelloPrice: "$products.frelloPrice",
              name: "$products.pName",
              paymentMathod: 1,
              userId: 1,
              status: "$products.status",
              statusbar: "$products.statusbar",
              statbar: "$products.statbar",
              subtotal: {
                $multiply: [
                  "$products.quantity",
                  {
                    $convert: {
                      input: "$products.frelloPrice",
                      to: "int",
                      onError: 0,
                    },
                  },
                ],
              },
              subMRP: {
                $multiply: [
                  "$products.quantity",
                  {
                    $convert: { input: "$products.MRP", to: "int", onError: 0 },
                  },
                ],
              },
            },
          },
          {
            $sort: { date: -1 },
          },
          {
            $skip: skip,
          },
          {
            $limit: 8,
          },
        ])
        .toArray();
      resolve(orders);
    });
  },

  totalOdrCount1: (userId) => {
    return new Promise(async (resolve, reject) => {
      let userCount = await db
        .get()
        .collection("order")
        .aggregate([
          {
            $match: { userId: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $count: "count",
          },
        ])
        .toArray();
      resolve(userCount[0]?.count);
    });
  },

  searchProduct: (sear) => {
    return new Promise(async (resolve, reject) => {
      var re = new RegExp(sear, "i");
      let searchAll = await db
        .get()
        .collection("product")
        .find({ prodName: re })
        .toArray();
      resolve(searchAll);
    });
  },

  getRecentProducts: () => {
    return new Promise((resolve, reject) => {
      let recent = db
        .get()
        .collection("product")
        .find()
        .sort({ date: -1 })
        .limit(4)
        .toArray();
      resolve(recent);
    });
  },

  // emailExist:(data)=>{
  //     return new Promise(async(resole,reject)=>{
  //         let res=await db.get().collection('users').find({email:data}).toArray()
  //         console.log(res,"heyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy");
  //         resolve(res)
  //     })
  // }

  filterPrice: (mini, maxi) => {
    console.log(mini, maxi, "lolokokolo");
    let minVal = parseInt(mini.slice(1));
    let maxVal = parseInt(maxi.slice(1));
    console.log(minVal, "????????????", maxVal, "miniVal,maxVal");

    return new Promise(async (resolve, reject) => {
      let cost = await db
        .get()
        .collection("product")
        .find({ prodSellPrice: { $gte: minVal, $lte: maxVal } })
        .toArray();
      console.log(cost, "cost");
      resolve(cost);
    });
  },

  deleteCart: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection("cart")
        .deleteOne({ user: ObjectId(userId) });
      resolve();
    });
  },

  deletePending: () => {
    return new Promise((resolve, reject) => {
      db.get().collection("order").deleteMany({ status: "Pending" });
      resolve();
    });
  },
};
