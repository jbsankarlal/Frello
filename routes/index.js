const { response } = require("express");
var express = require("express");
var router = express.Router();
var userHelper = require("../helpers/userHelpers");
var productHelper = require("../helpers/productHelpers");
const { route } = require("./admin");
const userHelpers = require("../helpers/userHelpers");
const { verifyLogin, verifyNonLogin } = require("../helpers/userHelpers");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = process.env.TWILIO_SERVICE_ID;
const client = require("twilio")(accountSid, authToken);

//*******************************LANDING PAGE***************************

router.get("/", async function (req, res, next) {
  let user1 = req.session.user;
  let cartCount = 0;
  let product;
  let totalValue;
  let wishlistCount = 0;
  if (req.session.user) {
    if ((cartCount = null)) {
      cartCount = 0;
    } else {
      cartCount = await userHelper.getCartCount(req.session.user._id);
    }
    product = await userHelper.getCartDetails(req.session.user._id);
    totalValue = await userHelper.getTotalAmount(req.session.user._id);
    wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
  }
  banner = await productHelper.setBanner(req.body);
  productHelper.getAllCategory().then((category) => {
    productHelper.getAllProducts().then((products) => {
      res.render("user/index", {
        user: true,
        category,
        products,
        user1,
        cartCount,
        product,
        totalValue,
        wishlistCount,
        banner,
      });
    });
  });
});

//*******************************GARDEN PAGE***************************

router.get("/shopProd", async function (req, res, next) {
  let user1 = req.session.user;
  let cartCount = 0;
  req.session.final = null;
  req.session.discount = null;
  let wishlistCount = 0,
    product;

  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);

    wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
    product = await userHelper.getCartDetails(req.session.user._id);
  }

  let totalproducts = await userHelper.getTotalProd();
  let pageCount = Math.ceil(totalproducts / 9);
  let count = [];
  for (i = 1; i <= pageCount; i++) {
    count.push(i);
  }
  let products = await productHelper.getAllProductt(req.query.id);

  productHelper.getAllCategory().then((category) => {
    productHelper.getAllProducts().then((prod) => {
      res.render("user/shopProducts", {
        user: true,
        category,
        products,
        user1,
        cartCount,
        product,
        wishlistCount,
        totalproducts,
        count,
        prod,
      });
    });
  });
});

//*******************************DETAILED VIEW OF PRODUCT ***************************

router.get("/detailProd", async (req, res, next) => {
  let user1 = req.session.user;
  let cartCount = null;
  let wishlistCount, product;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
    wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
    product = await userHelper.getCartDetails(req.session.user._id);
    console.log(product, "product");
  }

  let productr = await productHelper.getProductDetails(req.query.id);
  let recent = await userHelper.getRecentProducts();
  productHelper.getAllCategory().then((category) => {
    productHelper.getAllProducts().then((products) => {
      console.log(recent, "recent");
      res.render("user/product-detailed-view", {
        user: true,
        product,
        category,
        user1,
        cartCount,
        wishlistCount,
        productr,
        products,
        recent,
      });
    });
  });
});

//*******************************LOGIN***************************

router.get("/loggin", verifyLogin, function (req, res, next) {
  res.redirect("/");
});

//*******************************OTP LOGIN***************************

router.get("/otploggin", function (req, res, next) {
  res.render("user/otplogin", { user: false });
});

router.post("/otploggin", (req, res, next) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status == 222) {
      res.render("user/otplogin", {});
    } else if (response.status) {
      let mobileNumber = `+91${req.body.mobile}`;
      console.log(mobileNumber);
      req.session.Phoneno = mobileNumber;

      client.verify.v2
        .services(serviceId)
        .verifications.create({ to: mobileNumber, channel: "sms" })
        .then((verification) => {
          console.log(verification.status);
          req.session.otpSended = true;
          let otpsend = req.session.otpSended;
          req.session.userPre = response.user;
          console.log(mobileNumber);
          res.render("user/otplogin", { otpsend });
        });
    } else {
      res.render("user/otplogin", { user: true });
    }
  });
});

//*******************************VERIFY OTP***************************

router.post("/verifyotp", (req, res, next) => {
  let mobileNumber = req.session.Phoneno;
  let otp = req.body.otp;
  client.verify.v2
    .services(serviceId)
    .verificationChecks.create({ to: mobileNumber, code: otp })
    .then((verification_check) => {
      console.log(verification_check.status);
      if (verification_check.status == "approved") {
        req.session.user = req.session.userPre;
        console.log("verify otp", req.session.user);
        req.session.userLoggedIn = true;
        res.redirect("/");
      } else {
        req.session.otpSended = true;
        let otpsend = req.session.otpSended;
        req.session.userLoginErr = "Invalid otp";
        res.render("user/otplogin", {
          loginErr: "Entered otp is invalid",
          otpsend,
        });
      }
    });
});

//*******************************LOGIN POST***************************

router.post("/loggin", (req, res) => {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  userHelper.getLogin(req.body).then((response) => {
    console.log(req.session.redirectTo, "577777777777777777777777just before");
    if (response.status) {
      res.header(
        "Cache-Control",
        "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
      );
      req.session.user = response.user;
      req.session.userLoggedIn = true;
      console.log(req.session.redirectTo, "LL");
      res.redirect(req.session.redirectTo);
    } else {
      res.redirect("/loggin");
    }
  });
});

router.get("/logginShop", verifyLogin, (req, res) => {
  res.redirect("/shopProd");
});

router.get("/logginProdDetail", verifyLogin, async (req, res) => {
  let user1 = req.session.user;
  let cartCount = null;
  let wishlistCount, product;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
    wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
    product = await userHelper.getCartDetails(req.session.user._id);
  }

  let productr = await productHelper.getProductDetails(req.query.id);
  let recent = await userHelper.getRecentProducts();
  productHelper.getAllCategory().then((category) => {
    productHelper.getAllProducts().then((products) => {
      console.log(recent, "recent");
      res.render("user/product-detailed-view", {
        user: true,
        product,
        category,
        user1,
        cartCount,
        wishlistCount,
        productr,
        products,
        recent,
      });
    });
  });
});

router.get("/signup", function (req, res, next) {
  res.render("user/register", {});
});

//*******************************USER SIGN UP***************************

router.post("/regis", function (req, res, next) {
  console.log(req.body);

  userHelper.addUsers(req.body).then(async (response) => {
    let ref = await userHelper.checkReferal(req.body).then(() => {
      req.session.user = response;
      req.session.userLoggedIn = true;
      res.redirect("/");
    });
  });
});

//*******************************LOG OUT***************************

router.get("/logout", (req, res) => {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  req.session.user = null;
  req.session.userLoggedIn = false;
  res.redirect("/");
});

//*******************************ADD TO CART***************************

router.get("/addtocart/:id", verifyLogin, (req, res) => {
  console.log("successssss");
  userHelper.addToCart(req.params.id, req.session.user._id).then((response) => {
    console.log(response, "kellooooo");
    if (response.status) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
  });
});

//*******************************VIEW CART***************************

router.get("/viewCart", verifyLogin, async (req, res) => {
  let user1 = req.session.user;
  let cartCount = 0;
  let wishlistCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);

    wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
  }
  let product = await userHelper.getCartDetails(req.session.user._id);
  console.log(product, "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&");
  let totalValue = await userHelper.getTotalAmount(req.session.user._id);
  let totalMRP = await userHelper.getTotalMRP(req.session.user._id);

  userHelper.getAllCoupons().then((coupon) => {
    productHelper.getAllCategory().then((category) => {
      productHelper.getAllProducts().then((products) => {
        res.render("user/shopping-cart", {
          user: true,
          user1,
          product,
          cartCount,
          category,
          products,
          wishlistCount,
          totalValue,
          coupon,
          totalMRP,
        });
      });
    });
  });
});

//*******************************CHANGE PRODUCT QUANTITY***************************

router.post("/change-product-quantity", (req, res, next) => {
  console.log(req.body);
  userHelper.changeProductQuantity(req.body).then((response) => {
    res.json(response);
  });
});

router.post("/change-product-quantity1", (req, res, next) => {
  console.log(req.body, "allalalalala");
  userHelper.changeProductQuantity(req.body).then((response) => {
    res.json(response);
  });
});

//*******************************REMOVE PRODUCT FROM CART***************************

router.post("/remove-product-cart", (req, res, next) => {
  userHelper.removeProduct(req.body).then((response) => {
    res.json(response);
  });
});

//*******************************CHECK OUT **********************************

router.get("/check-out", verifyLogin, async (req, res) => {
  let user1 = req.session.user;
  let discount = req.session.discount;
  if (req.session.user) {
    if (req.session.user) {
      let total;
      if (req.session.final) {
        total = req.session.final;
      } else {
        total = await userHelper.getTotalAmount(req.session.user._id);
      }
      let address = await userHelper.getUserAddress(req.session.user._id);
      let totalMRP = await userHelper.getTotalMRP(req.session.user._id);
      req.session.mrp = totalMRP;
      let product = await userHelper.getCartDetails(req.session.user._id);
      console.log(product, "new test1111");
      let wishlistCount = await userHelper.getWishlistCount(
        req.session.user._id
      );
      let cartTotal = await userHelper.getTotalAmount(req.session.user._id);
      productHelper.getAllCategory().then((category) => {
        productHelper.getAllProducts().then((products) => {
          res.render("user/check-out", {
            total,
            category,
            products,
            product,
            user1,
            address,
            wishlistCount,
            discount,
            totalMRP,
            cartTotal,
          });
        });
      });
    }
  }
});

//*******************************CHECK OUT FOR SINGLE PRODUCT ***************************

router.get("/check-out-prod", verifyLogin, (req, res) => {
  res.redirect("/shopProd");
});

router.post("/check-out-prod", verifyLogin, async (req, res) => {
  console.log(req.body, "queryyyyyyyyyyyyyyy");
  let quantity = req.body.quant;
  req.session.quant = quantity;
  console.log(quantity, "quantttttt");
  req.session.indvidualPrice = null;
  let user1 = req.session.user;
  let discountt = req.session.discount;
  if (req.session.user) {
    let totall;

    let address = await userHelper.getUserAddress(req.session.user._id);
    let productr = await userHelper.getProductDetail(
      req.body.quant,
      req.body.pId
    );
    console.log(productr, "productrrrr");
    req.session.indvidualPrice = productr.prodSellPrice;
    req.session.mrsp = productr.prodMarketPrice;
    req.session.productr = productr;
    if (quantity != 0) {
      if (req.session.final) {
        totall = req.session.final * parseInt(quantity);
      } else {
        totall = req.session.indvidualPrice * parseInt(quantity);
      }
    } else {
      if (req.session.final) {
        totall = req.session.final;
      } else {
        totall = req.session.indvidualPrice;
      }
    }

    console.log(req.session.indvidualPrice, "productr");
    let wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
    productHelper.getAllCategory().then((category) => {
      productHelper.getAllProducts().then((products) => {
        userHelper.getAllCoupons().then((coupon) => {
          res.render("user/check-out", {
            user: true,
            totall,
            category,
            products,
            productr,
            user1,
            address,
            wishlistCount,
            discountt,
            coupon,
            quantity,
          });
        });
      });
    });
  }
});

//*******************************CATEGORY WISE PRODUCT LISTING***************************

router.get("/catWise", async (req, res, next) => {
  let user1 = req.session.user;
  let cartCount = 0;
  let wishlistCount = 0;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
    wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
  }

  userHelper.catwiseName(req.query.id).then((products) => {
    productHelper.getAllCategory().then((category) => {
      console.log(products);
      res.render("user/shopProducts", {
        user: true,
        products,
        category,
        cartCount,
        wishlistCount,
        user1,
      });
    });
  });
});

//*******************************PLACE ORDER***************************

router.get("/orderdetails/", async (req, res, next) => {
  let user1 = req.session.user;
  if (req.session.user) {
    let total = await userHelper.getTotalAmount(req.session.user._id);
    let orders = await userHelper.getOrderDetails(req.session.user._id);
    userHelper.deleteCart(req.session.user._id).then(() => {
      userHelper.deletePending().then(() => {
        userHelper.changePaymentStatus(req.query.id).then(() => {
          res.render("user/order-details", {
            user: true,
            user1,
            total,
            orders,
          });
        });
      });
    });
  }
});

//*******************************VIEW ORDERS IN DETAIL***************************

router.get("/view-order-products/", verifyLogin, async (req, res, next) => {
  let user1 = req.session.user;
  if (req.session.user) {
    let product = await userHelper.getOrderProducts(req.query.id);
    let product1 = await userHelper.getSingleProduct(req.query.id);
    console.log(product, "producttttttprooooooooooooo");
    let total = await userHelper.getTotalAmount(req.session.user._id);
    let order = await userHelper.getOrderProduct(req.query.id);
    let amt = order[0].totalAmount;
    let date = order[0].date;
    let name = order[0].deliveryDetails.name;
    let address =
      order[0].deliveryDetails.house +
      "," +
      order[0].deliveryDetails.street +
      "," +
      order[0].deliveryDetails.town;
    let state =
      order[0].deliveryDetails.state + "," + order[0].deliveryDetails.zip;
    let email = order[0].deliveryDetails.email;
    let mobile = order[0].deliveryDetails.mobile;
    let paymentMethod = order[0].paymentMathod;
    let mrp = parseInt(order[0].MRP);
    let grandTotal = order[0].GrandTotal;
    let offerPrice = parseInt(order[0].Subtotal);
    let discount = order[0].discountAmt;
    let status = order[0].products[0].status;
    if (offerPrice == null) {
      offerPrice = 0;
    } else {
      offerPrice = order[0].Subtotal;
    }
    console.log(order[0], status, "========", name);
    res.render("user/view-order-indetail", {
      user: true,
      user1,
      product,
      total,
      order,
      amt,
      date,
      name,
      address,
      state,
      email,
      mobile,
      paymentMethod,
      status,
      mrp,
      offerPrice,
      discount,
      grandTotal,
      product1,
    });
  }
});

//*******************************PAYMENT FAILED PAGE*****************************************

router.get("/payment-failed/", verifyLogin, (req, res, next) => {
  res.render("user/payment-failed", { user: true });
});

//*******************************VIEW ORDERS ****************************************

router.get("/orders", verifyLogin, async (req, res, next) => {
  let cartCount = 0;
  let wishlistCount = 0;
  let user1 = req.session.user;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
    wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
    if (!req.query.id) {
      req.query.id = 1;
    }

    let totalOrders = await userHelper.totalOdrCount1(req.session.user._id);
    console.log(totalOrders, "totalOrders");
    let pageCount = Math.ceil(totalOrders / 8);
    let count = [];
    for (i = 1; i <= pageCount; i++) {
      count.push(i);
    }
    let products = await productHelper.getAllProducts();
    console.log(count, "count");
    console.log(
      req.session.user._id,
      req.query.id,
      "req.session.user._id,req.query.id"
    );
    userHelper
      .getAllOrders1(req.session.user._id, req.query.id)
      .then((orders) => {
        console.log(orders, "ORDERS");

        orders.forEach((orders) => {
          orders.date = orders.date.toString().substr(4, 17);
        });

        productHelper.getAllCategory().then((category) => {
          res.render("user/view-orders", {
            orders,
            user: true,
            user1,
            products,
            category,
            count,
            cartCount,
            wishlistCount,
          });
        });
      });
  }
});

//*******************************ORDER CANCELLATION***************************

router.post("/cancel-order", verifyLogin, (req, res, next) => {
  console.log(req.body.oId, req.body.pId, "<<<<<<<%%%%%%%%%%%%%%%%%");
  userHelper.cancelOrder(req.body.oId, req.body.pId).then((response) => {
    res.redirect("/orders");
  });
});

//*******************************ORDER RETURN***************************

router.post("/return-order", verifyLogin, (req, res, next) => {
  console.log(req.body.oId, req.body.pId, "req.body.oId,req.body.pId");
  userHelper.returnOrder(req.body.oId, req.body.pId).then((response) => {
    res.redirect("/orders");
  });
});

//*******************************ORDER PLACEMENT***************************

router.post("/place-order", verifyLogin, async (req, res, next) => {
  let addr = await userHelper.getAddress(req.body.radio, req.body.userId);
  let address = addr.shift();
  let totalPrice;
  let discount;
  let products;
  let MRP;

  if (req.session.final) {
    totalPrice = req.session.final;
    discount = req.session.discount;
    products = req.session.productr;
    MRP = req.session.mrsp;
    products = await userHelper.getCartProductList(req.body.userId);
  } else {
    totalPrice = await userHelper.getTotalAmount(req.body.userId);
    products = await userHelper.getCartProductList(req.body.userId);
    MRP = req.session.mrp;
  }
  MRP = req.session.mrp;
  console.log(MRP, "MRPPPPPPPPPPPPPPP");
  address["payment-method"] = req.body["payment-method"];
  address.userId = req.session.user._id;

  userHelper
    .placeOrder(address, products, totalPrice, discount, MRP)
    .then(async (orderId) => {
      console.log(req.body);
      if (req.body["payment-method"] == "COD") {
        res.json({ codSuccess: true });
      } else if (req.body["payment-method"] == "Wallet") {
        userHelper
          .walletPayment(totalPrice, req.body.userId, orderId)
          .then(() => {
            res.json({ walletSuccess: true });
          });
      } else if (req.body["payment-method"] == "Razorpay") {
        userHelper.generateRazorpay(orderId, totalPrice).then((response) => {
          response.razor = true;
          res.json(response);
        });
      } else if (req.body["payment-method"] == "Paypal") {
        var payment = {
          intent: "authorize",
          payer: {
            payment_method: "paypal",
          },
          redirect_urls: {
            return_url:
              "http://localhost:3000/orderdetails?id=" + orderId.insertedId,
            cancel_url:
              "http://localhost:3000/payment-failed?id=" + orderId.insertedId,
          },
          transactions: [
            {
              amount: {
                total: totalPrice,
                currency: "USD",
              },
              description: "",
            },
          ],
        };
        // userHelper.createPay(payment).then((response)=>{
        //   console.log("############################",response);
        //   response.paypal=true
        //   res.json(response)
        // })

        userHelper
          .createPay(payment)
          .then((transaction) => {
            var id = transaction.id;
            var links = transaction.links;
            var counter = links.length;
            console.log(transaction, "transaction---");
            while (counter--) {
              if (links[counter].rel === "approval_url") {
                // redirect to paypal where user approves the transaction

                transaction.paypal = true;
                transaction.linkto = links[counter].href;
                console.log(orderId, "varoooooooooo orderId");
                transaction.orderId = orderId.insertedId;
                console.log(transaction.orderId, "transaction.orderId");

                console.log(transaction, "transactionn");
                res.json(transaction);
              }
            }
          })
          .catch((err) => {
            console.log(err);
            res.redirect("/err");
          });
      }
    });
});

// *******************************ADD NEW ADDRESS***************************

router.post("/add-address/:id", verifyLogin, (req, res, next) => {
  userHelper.userAddress(req.body, req.session.user._id).then(() => {
    res.redirect("/check-out");
  });
});

router.post("/add-addressfront/:id", verifyLogin, (req, res, next) => {
  userHelper.userAddress(req.body, req.session.user._id).then(() => {
    res.redirect("/profile");
  });
});

//*******************************EDIT ADDRESS***************************

router.post("/edit-addressfront", verifyLogin, (req, res, next) => {
  userHelper.editAddress(req.body, req.query.id).then(() => {
    res.redirect("/profile");
  });
});

router.post("/edit-address-chkout", verifyLogin, (req, res, next) => {
  userHelper.editAddress(req.body, req.query.id).then(() => {
    res.redirect("/check-out");
  });
});

//*******************************DELETE ADDRESS ********************************

router.get("/delete-address/", verifyLogin, (req, res, next) => {
  userHelper
    .deleteAddress(req.query.id, req.session.user._id)
    .then((result) => {
      res.redirect("/profile");
    });
});

// *******************************PRODILE MANAGEMENT***************************
router.get("/profile", verifyLogin, async (req, res, next) => {
  let user1 = req.session.user;
  let cartCount = 0;
  let wishlistCount = 0;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);

    wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
    let userProfile = await userHelper.userProfile(req.session.user._id);

    let address = await userHelper.getUserAddress(req.session.user._id);
    productHelper.getAllCategory().then((category) => {
      productHelper.getAllProducts().then((products) => {
        res.render("user/profile", {
          user: true,
          cartCount,
          user1,
          address,
          wishlistCount,
          userProfile,
          products,
          category,
        });
      });
    });
  }
});

//*******************************PAYMENT GATEWAY***************************

router.post("/verify-payment", verifyLogin, (req, res, next) => {
  console.log(req.body, "@@@@@@@@@@@@@@@@@@");
  userHelper
    .verifyPayment(req.body)
    .then(() => {
      userHelper.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        console.log("payment sucessful");
        res.json({ status: true });
      });
    })
    .catch((err) => {
      console.log(err);
      res.json({ status: false, errMsg: "" });
    });
});

//*******************************WISHLIST MANAGEMENT***************************

router.get("/add-to-wishlist/:id", verifyLogin, (req, res, next) => {
  userHelper.wishList(req.session.user._id, req.params.id).then(() => {
    if (response.status) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }
    //res.redirect('/shopProd')
  });
});

router.get("/add-to-wishlist-dp/:id", verifyLogin, (req, res, next) => {
  userHelper.wishList(req.session.user._id, req.params.id).then(() => {
    res.redirect("/view-wishlist");
  });
});

router.get("/view-wishlist", verifyLogin, async (req, res, next) => {
  let user1 = req.session.user;
  let cartCount = 0;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);
  }
  let wishlist = await userHelper.getWishlist(req.session.user._id);
  let wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
  productHelper.getAllCategory().then((category) => {
    productHelper.getAllProducts().then((products) => {
      res.render("user/wishlist", {
        user: true,
        user1,
        cartCount,
        wishlist,
        category,
        products,
        wishlistCount,
      });
    });
  });
});

router.get("/delete-from-list/:id", verifyLogin, (req, res, next) => {
  userHelper
    .removeFromCart(req.params.id, req.session.user._id)
    .then((response) => {
      res.redirect("/view-wishlist");
    });
});

//*******************************ADD 2 CART***************************

router.get("/add2cart/:id", verifyLogin, (req, res, next) => {
  userHelper.addToCart(req.params.id, req.session.user._id).then((response) => {
    userHelper
      .removeFromCart(req.params.id, req.session.user._id)
      .then((response) => {
        res.redirect("/viewCart");
      });
  });
});

//*******************************CHECK COUPON***************************

router.get("/coupon-check", (req, res) => {
  res.render("/");
});

router.post("/coupon-check", verifyLogin, async (req, res) => {
  let total = await userHelper.getTotalAmount(req.session.user._id);
  console.log(total, "total");
  let coupon = {};
  coupon.total = total;
  let coup = await userHelper.checkCoupon(
    req.body,
    req.session.user._id,
    total
  );
  console.log(coup, "coup");

  console.log(total, "total");
  let finalprice = total - (total / 100) * parseInt(coup.data.discount);
  console.log((finalprice, "fiinalprice"));
  let discount = total - finalprice;
  let maxlimit = parseInt(coup.data.max);
  console.log(finalprice, discount, maxlimit, "finalprice");
  req.session.discount = discount;

  if (total > coup.data.min) {
    if (discount > maxlimit) {
      finalprice = total - maxlimit;
      coupon.discount = maxlimit;
      coupon.finalprice = finalprice;
      coupon.status = true;
      req.session.final = finalprice;
      res.json(coupon);
    } else {
      finalprice = total - (total / 100) * coup.data.discount;
      coupon.discount = discount;
      coupon.finalprice = finalprice;
      coupon.status = true;
      req.session.final = finalprice;
      res.json(coupon);
    }
  } else {
    coupon.status = false;

    res.json(coupon);
  }
});

router.get("/coupon-check2", (req, res) => {
  res.render("/");
});

//*******************************COUPON CHECK 2***************************
//

router.post("/coupon-check2", verifyLogin, async (req, res) => {
  let total = req.session.indvidualPrice;
  let quantity = req.session.quant;
  console.log(quantity, "quantiry total999999999999999");
  let finaltotal = total * parseInt(quantity);
  console.log(total, "total999");

  let coupon = {};

  let totall;
  let coup = await userHelper.checkCoupon(
    req.body,
    req.session.user._id,
    total
  );
  console.log(coup, "coup");
  let final = coup.total * parseInt(quantity);
  let minlimit = parseInt(coup.data.min);
  console.log(final, "finallllllllll");
  let tt = (total / 100) * parseInt(coup.data.discount);
  let tt1 = total - parseInt(coup.data.max) / parseInt(quantity);
  if (final > minlimit) {
    coupon.total = final;
    let test = (final / 100) * parseInt(coup.data.discount);
    let discounted = final - parseInt(test);
    console.log(coup.data.max, discounted, "VVcoup.data.max");
    let maxlimit = parseInt(coup.data.max);
    if (discounted > maxlimit) {
      totall = final - maxlimit;
      console.log(totall, "totall");
      coupon.discount = maxlimit;
      console.log(coupon.discount, "coupon.discount");
      req.session.final = tt1;
      req.session.discount = maxlimit;
      coupon.status = true;

      res.json(coupon);
    } else {
      totall = final - discounted;
      coupon.discount = discounted;
      req.session.final = tt;
      req.session.discount = discounted;
      coupon.status = true;
      console.log(coupon, "coupon??????!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      res.json(coupon);
    }
  } else {
    coupon.discount = 0;
    coupon.status = false;
    req.session.final = total;

    res.json(coupon);
  }
});

//******************************* SEARCH ************************************

router.post("/search", async (req, res) => {
  let user1 = req.session.user;
  let cartCount = 0;
  req.session.final = null;
  req.session.discount = null;
  let wishlistCount = 0,
    product;

  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);

    wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
    product = await userHelper.getCartDetails(req.session.user._id);
  }

  let totalproducts = await userHelper.getTotalProd();
  let pageCount = Math.ceil(totalproducts / 9);
  let count = [];
  for (i = 1; i <= pageCount; i++) {
    count.push(i);
  }
  let products = await userHelper.searchProduct(req.body.search);

  productHelper.getAllCategory().then((category) => {
    productHelper.getAllProducts().then((prod) => {
      res.render("user/shopProducts", {
        user: true,
        category,
        products,
        user1,
        cartCount,
        product,
        wishlistCount,
        totalproducts,
        count,
        prod,
      });
    });
  });
});

//*******************************FILTER BY PRICE RANGE***************************
//

router.post("/filterSearch", async (req, res) => {
  let user1 = req.session.user;
  let cartCount = 0;
  req.session.final = null;
  req.session.discount = null;
  let wishlistCount = 0,
    product;

  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id);

    wishlistCount = await userHelper.getWishlistCount(req.session.user._id);
    product = await userHelper.getCartDetails(req.session.user._id);
  }

  let totalproducts = await userHelper.getTotalProd();
  let pageCount = Math.ceil(totalproducts / 9);
  let count = [];
  for (i = 1; i <= pageCount; i++) {
    count.push(i);
  }
  console.log(req.body.min, req.body.max, "req.body.min,req.body.max");
  let products = await userHelper.filterPrice(req.body.min, req.body.max);

  productHelper.getAllCategory().then((category) => {
    productHelper.getAllProducts().then((prod) => {
      res.render("user/shopProducts", {
        user: true,
        category,
        products,
        user1,
        cartCount,
        product,
        wishlistCount,
        totalproducts,
        prod,
      });
    });
  });
});

//*******************************WALLET HISTORY************************ */
router.get("/wallet-history", verifyLogin, async (req, res) => {
  let walletHistory = await userHelper.getWalletHistory(req.query.id);
  console.log(walletHistory, "wallethistor");
  res.render("user/Wallet-history", { user: true, walletHistory });
});

module.exports = router;
