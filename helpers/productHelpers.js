const { order } = require("paypal-rest-sdk");
const { router } = require("../app");
var db = require("../config/connection");
var ObjectId = require("mongodb").ObjectId;

module.exports = {
  verifyLogin: (req, res, next) => {
    if (req.session.loggedIn) {
      next();
    } else {
      res.render("admin/log");
    }
  },

  addNewProduct: (data) => {
    let pName = data.prodName;
    console.log(pName, "pnameee");
    let mPrice = data.prodMarketPrice;
    console.log(mPrice);
    let sPrice = data.prodSellPrice;
    console.log(sPrice);
    return new Promise(async (resolve, reject) => {
      let sameProd = await db
        .get()
        .collection("product")
        .findOne({ prodName: pName });
      if (sameProd) {
        console.log("product existttttttt");
        resolve({ value: "exist" });
      } else if (sPrice > mPrice) {
        console.log("selling price should be lower");
        resolve({ value: "amount" });
      } else {
        db.get()
          .collection("product")
          .insertOne(data)
          .then((res) => {
            console.log("prodct enteresed successfully");
            console.log(res, "sameproddd");
            resolve(res.insertedId);
          });
      }
    });
  },

  fetchImages: (pId) => {
    return new Promise(async (resolve, reject) => {
      let data = await db
        .get()
        .collection("product")
        .findOne({ _id: ObjectId(pId) });
      console.log(data, "dataaaa");
      resolve(data.imageMany);
    });
  },

  fetchImg: (pId) => {
    return new Promise(async (resolve, reject) => {
      let data = await db
        .get()
        .collection("category")
        .findOne({ _id: ObjectId(pId) });
      console.log(data, "dataaaa");
      resolve(data.image);
    });
  },

  addCategory: (category) => {
    return new Promise(async (resolve, reject) => {
      console.log(category.catName, "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
      let cat = category.catName;
      let dupCat = await db
        .get()
        .collection("category")
        .findOne({ catName: cat });
      console.log(dupCat, "kpdupvatt");
      if (dupCat) {
        resolve(dupCat);
      } else {
        db.get()
          .collection("category")
          .insertOne(category)
          .then((data) => {
            resolve(data.insertedId);
            console.log(data);
          });
      }
    });
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db.get().collection("product").find().toArray();
      resolve(products);
    });
  },

  getAllProductt: (page) => {
    return new Promise(async (resolve, reject) => {
      let skip = (parseInt(page) - 1) * 9;
      console.log(skip, "Skipp", page);
      let prod = await db
        .get()
        .collection("product")
        .find()
        .sort({ _id: -1 })
        .skip(skip)
        .limit(9)
        .toArray();

      resolve(prod);
    });
  },
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let user = await db.get().collection("users").find().toArray();
      resolve(user);
    });
  },

  getAllCategory: () => {
    return new Promise(async (resolve, reject) => {
      let category = await db.get().collection("category").find().toArray();
      resolve(category);
    });
  },
  // getAllOrders:()=>{
  //   return new Promise(async(resolve,reject)=>{
  //     let orders= await db.get().collection('order').find().toArray()
  //     resolve(orders)
  //   })
  // },
  getAllOrders: (page) => {
    console.log(page, "pageajuuuuuuuuuuuuuuuu");
    let skip = (parseInt(page) - 1) * 8;
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection("order")
        .aggregate([
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
              productname: "$products.pName",
              image: "$products.imageMany",
              quantity: "$products.quantity",
              frelloPrice: "$products.frelloPrice",
              paymentMathod: 1,
              userId: 1,
              status: "$products.status",
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
      console.log(orders, "ordersss");
      resolve(orders);
    });
  },

  deleteProduct: (productId) => {
    return new Promise((resolve, request) => {
      db.get()
        .collection("product")
        .deleteOne({ _id: ObjectId(productId) })
        .then((response) => {
          resolve(response);
        });
    });
  },

  deleteUser: (userId) => {
    return new Promise((resolve, request) => {
      db.get()
        .collection("users")
        .deleteOne({ _id: ObjectId(userId) })
        .then((response) => {
          resolve(response);
        });
    });
  },

  getProductDetails: (pId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection("product")
        .findOne({ _id: ObjectId(pId) })
        .then((product) => {
          resolve(product);
        });
    });
  },
  updateProduct: (pId, pDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection("product")
        .updateOne(
          { _id: ObjectId(pId) },
          {
            $set: {
              prodName: pDetails.prodName,
              prodDescrp: pDetails.prodDescrp,
              prodCat: pDetails.prodCat,
              prodQuantity: pDetails.prodQuantity,
              prodSellPrice: pDetails.prodSellPrice,
              prodMarketPrice: pDetails.prodMarketPrice,
              imageMany: pDetails.imageMany,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  deleteCategory: (catId) => {
    return new Promise((resolve, request) => {
      db.get()
        .collection("category")
        .deleteOne({ _id: ObjectId(catId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
  getCatDetails: (catId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection("category")
        .findOne({ _id: ObjectId(catId) })
        .then((product) => {
          resolve(product);
        });
    });
  },
  updateCategory: (catId, cDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection("category")
        .updateOne(
          { _id: ObjectId(catId) },
          {
            $set: {
              catName: cDetails.catName,
              catDescrp: cDetails.catDescrp,
              image: cDetails.image,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  blockUser: (Id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection("users")
        .updateOne(
          { _id: ObjectId(Id) },
          {
            $set: {
              status: false,
            },
          }
        )
        .then((reponse) => {
          resolve();
        });
    });
  },
  unblockUser: (Id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection("users")
        .updateOne(
          { _id: ObjectId(Id) },
          {
            $set: {
              status: true,
            },
          }
        )
        .then((reponse) => {
          resolve();
        });
    });
  },

  updateOrderStatus: (data) => {
    let totalAmt;
    totalAmt = parseInt(data.orderAmt) * parseInt(data.quantity);

    console.log(data, "DATAAAAAAAAAAA");

    let walletdata = {
      details: "Return on Order Cancellation",
      refere: "Frello",
      date: new Date(),
      amount: parseInt(totalAmt),
    };

    return new Promise((resolve, reject) => {
      if (
        (data.status == "Return Completed" && data.payMethod !== "COD") ||
        (data.status == "Order Cancelled" && data.payMethod !== "COD")
      ) {
        console.log(data.cartId, "datacarttt");
        db.get()
          .collection("order")
          .updateOne(
            {
              _id: ObjectId(data.orderId),
              "products.item": ObjectId(data.cartId),
            },
            {
              $set: { "products.$.status": data.status },
            }
          );

        db.get()
          .collection("users")
          .updateOne(
            { _id: ObjectId(data.user) },
            {
              $inc: { wallet: parseInt(totalAmt) },
              $push: { walletDetails: walletdata },
            }
          );
        resolve();
      } else if (
        data.status == "Despatched" ||
        data.status == "Shipped" ||
        data.status == "Out for Delivery" ||
        data.status == "Delivered" ||
        data.status == "Return Requested" ||
        data.status == "Cancelled" ||
        data.status == "Return Completed"
      ) {
        if (data.status == "Delivered") {
          db.get()
            .collection("order")
            .updateOne(
              {
                _id: ObjectId(data.orderId),
                "products.item": ObjectId(data.cartId),
              },
              {
                $set: {
                  "products.$.status": "Delivered",
                  "products.$.statusbar": false,
                },
              }
            );
          resolve();
        } else {
          db.get()
            .collection("order")
            .updateOne(
              {
                _id: ObjectId(data.orderId),
                "products.item": ObjectId(data.cartId),
              },
              {
                $set: { "products.$.status": data.status },
              }
            );
          resolve();
        }
      }
    });
  },

  getAllTheOrders: () => {
    return new Promise(async (resolve, reject) => {
      let order = await db
        .get()
        .collection("order")
        .find()
        .sort({ date: -1 })
        .limit(5)
        .toArray();
      let totalcount = await db.get().collection("order").find().count();

      let ord = {};
      ord.order = order;
      ord.totalcount = totalcount;
      resolve(ord);
      console.log(order, totalcount, "//////////////////////////////////");
    });
  },

  addCoupon: (couponData) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection("coupons")
        .insertOne(couponData)
        .then(() => {
          resolve();
        });
    });
  },

  getAllCoupons: () => {
    return new Promise(async (resolve, reject) => {
      let coupon = await db.get().collection("coupons").find().toArray();
      resolve(coupon);
    });
  },

  deleteCoupon: (cId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection("coupons")
        .deleteOne({ _id: ObjectId(cId) })
        .then((res) => {
          resolve(res);
        });
    });
  },

  generateReportt: (from, to) => {
    console.log(from, to, "lllllllll98888888888888888");
    return new Promise(async (resolve, reject) => {
      let ress = await db
        .get()
        .collection("order")
        .aggregate([
          {
            $match: { date: { $gte: new Date(from), $lte: new Date(to) } },
          },

          {
            $unwind: "$products",
          },
          {
            $group: {
              _id: "$products.item",
              sum: { $sum: "$products.quantity" },
            },
          },
          {
            $lookup: {
              from: "product",
              localField: "_id",
              foreignField: "_id",
              as: "newProduct",
            },
          },
          {
            $project: {
              item: 1,
              sum: 1,
              name: { $arrayElemAt: ["$newProduct.prodName", 0] },
              cost: { $arrayElemAt: ["$newProduct.prodSellPrice", 0] },
            },
          },
          {
            $project: {
              item: 1,
              sum: 1,
              name: 1,
              cost: 1,
              total: {
                $multiply: [
                  "$sum",
                  { $convert: { input: "$cost", to: "int", onError: 0 } },
                ],
              },
            },
          },
        ])
        .toArray();
      console.log(ress, "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWww");
      resolve(ress);
    });
  },

  addBanner: (bannerData) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection("banner")
        .insertOne(bannerData)
        .then(() => {
          resolve();
        });
    });
  },

  setBanner: () => {
    return new Promise(async (resolve, reject) => {
      let banner = await db.get()?.collection("banner")?.find()?.toArray();
      resolve(banner);
    });
  },

  totalUserCount: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection("users")
        .find()
        .count()
        .then((userCount) => {
          resolve(userCount);
        });
    });
  },
  getUserManDetails: (page) => {
    return new Promise(async (resolve, reject) => {
      let skip = (parseInt(page) - 1) * 8;
      console.log(skip, "jellele", page);
      let users = await db
        .get()
        .collection("users")
        .find()
        .sort({ username: 1 })
        .skip(skip)
        .limit(8)
        .toArray();
      resolve(users);
    });
  },

  totalProdCount: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection("product")
        .find()
        .count()
        .then((userCount) => {
          resolve(userCount);
        });
    });
  },
  getProdManDetails: (page) => {
    return new Promise(async (resolve, reject) => {
      let skip = (parseInt(page) - 1) * 8;
      console.log(skip, "jellele", page);
      let users = await db
        .get()
        .collection("product")
        .find()
        .sort({ prodName: 1 })
        .skip(skip)
        .limit(8)
        .toArray();
      resolve(users);
    });
  },

  totalOdrCount: () => {
    return new Promise(async (resolve, reject) => {
      let userCount = await db
        .get()
        .collection("order")
        .aggregate([
          {
            $unwind: "$products",
          },
          {
            $count: "tytytytyty",
          },
        ])
        .toArray();
      resolve(userCount[0].tytytytyty);
    });
  },
  // getOdrManDetails:(page)=>{
  //   return new Promise(async(resolve,reject)=>{

  //       let skip=(parseInt(page)-1)*8
  //       console.log(skip,"jellele",page);
  //       let users= await db.get().collection('order').find().sort({date:-1}).skip(skip).limit(8).toArray()
  //       resolve(users)

  //   })
  // }

  getMonthReport: () => {
    return new Promise(async (resolve, reject) => {
      let monthRprt = await db
        .get()
        .collection("order")
        .aggregate([
          {
            $group: {
              _id: { month: { $month: "$date" }, year: { $year: "$date" } },
              GrandTotal: { $sum: "$GrandTotal" },
            },
          },
          {
            $project: {
              _id: 0,
              year: "$_id.year",
              month: "$_id.month",
              GrandTotal: "$GrandTotal",
            },
          },
          {
            $sort: { year: -1, month: -1 },
          },
          {
            $limit: 12,
          },
        ])
        .toArray();
      console.log(monthRprt, "monthRprt");

      monthRprt.forEach((element) => {
        function toMonthName(month) {
          const date = new Date();
          date.setMonth(month - 1);
          return date.toLocaleString("en-US", {
            month: "long",
          });
        }
        element.month = toMonthName(element.month);
      });
      console.log(monthRprt, "monthRprt");
      resolve(monthRprt);
    });
  },

  getYearlyReport: () => {
    return new Promise(async (resolve, reject) => {
      let yearlyRprt = await db
        .get()
        .collection("order")
        .aggregate([
          {
            $group: {
              _id: { year: { $year: "$date" } },
              GrandTotal: { $sum: "$GrandTotal" },
            },
          },
          {
            $project: { _id: 0, year: "$_id.year", GrandTotal: "$GrandTotal" },
          },
          {
            $sort: { year: -1 },
          },
          {
            $limit: 5,
          },
        ])
        .toArray();
      resolve(yearlyRprt);
      console.log(yearlyRprt, "yearlyRprt");
    });
  },
};
