const { response}= require('express')
var express = require('express');
var router = express.Router();
var userHelper=require('../helpers/userHelpers')
var productHelper=require('../helpers/productHelpers');
const { route } = require('./admin');
const userHelpers = require('../helpers/userHelpers');
const { verifyLogin, verifyNonLogin } = require('../helpers/userHelpers');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId = process.env.TWILIO_SERVICE_ID
const client = require('twilio')(accountSid, authToken);


console.log(); 


router.get('/',async function(req, res, next) {
  let user1=req.session.user
  let cartCount=0
  let product
  let totalValue
  let wishlistCount=0
  if(req.session.user){
  cartCount=await userHelper.getCartCount(req.session.user._id)
  product=await userHelper.getCartDetails(req.session.user._id)
  totalValue=await userHelper.getTotalAmount(req.session.user._id)
  wishlistCount=await userHelper.getWishlistCount(req.session.user._id)
 
  }
  banner= await productHelper.setBanner(req.body)
  productHelper.getAllCategory().then((category)=>{
    productHelper.getAllProducts().then((products)=>{
      res.render('pages/index', {user:true,category,products,user1,cartCount,product,totalValue,wishlistCount,banner,verifyLogin});
      
    })
 
})
});

router.get('/shopProd',verifyNonLogin, async function(req, res, next) {
  let user1=req.session.user
  let cartCount=null
  req.session.final=null
  req.session.discount=null
  let wishlistCount,product
  
  if(req.session.user){
  cartCount=await userHelper.getCartCount(req.session.user._id)
  wishlistCount=await userHelper.getWishlistCount(req.session.user._id)
   product=await userHelper.getCartDetails(req.session.user._id)
}

let totalproducts=await userHelper.getTotalProd()
let pageCount=Math.ceil(totalproducts/9)
 let count=[]
 for(i=1;i<=pageCount;i++){
  count.push(i)
 }
 let products= await productHelper.getAllProductt(req.query.id)
 
 
  productHelper.getAllCategory().then((category)=>{
    productHelper.getAllProducts().then((prod)=>{
    

  res.render('pages/shopProducts', {user:true,category,products,user1,cartCount,product,wishlistCount,totalproducts,count,prod});
})
})
})
;


router.get('/detailProd',verifyNonLogin, async (req,res,next)=>{
  let user1=req.session.user
  let cartCount=null
  let wishlistCount,product
  if(req.session.user){
  cartCount=await userHelper.getCartCount(req.session.user._id)
  wishlistCount=await userHelper.getWishlistCount(req.session.user._id)
  product=await userHelper.getCartDetails(req.session.user._id)
}

  let productr=await productHelper.getProductDetails(req.query.id)
  productHelper.getAllCategory().then((category)=>{
    productHelper.getAllProducts().then((products)=>{
    console.log(product);
  res.render('pages/product-detailed-view', {user:true,product,category,user1,cartCount,wishlistCount,productr,products});
  })
})
})


router.get('/loggin', function(req, res, next) { 
  res.render('pages/login', {user:false});
});



router.get('/otploggin', function(req, res, next) {
  res.render('pages/otplogin', {user:false});
});


router.post('/otploggin',(req,res,next)=>{
  
  userHelper.doLogin(req.body).then((response)=>{
    
    if(response.status==222){
    res.render('pages/otplogin',{})
    }else if(response.status){
      let mobileNumber=(`+91${req.body.mobile}`)
      console.log(mobileNumber)
      req.session.Phoneno=mobileNumber
      
      client.verify.v2.services(serviceId).verifications.create({ to: mobileNumber, channel: 'sms' })
        .then((verification) => {
          console.log(verification.status);
          req.session.otpSended = true
          let otpsend = req.session.otpSended
          req.session.userPre = response.user
          console.log(mobileNumber);
          res.render('pages/otplogin',{otpsend})
    })}else{
      
      res.render('pages/otplogin',{user:true})

    }

  })
 
})

router.post('/verifyotp',(req,res,next)=>{
  let mobileNumber = req.session.Phoneno
  let otp = req.body.otp
  client.verify.v2.services(serviceId)
    .verificationChecks
    .create({ to: mobileNumber, code: otp })
    .then((verification_check) => {
      console.log(verification_check.status)
      if (verification_check.status == 'approved') {
        req.session.user = req.session.userPre
        console.log("verify otp", req.session.user);
        req.session.userLoggedIn = true;
        res.redirect('/')
      } else {
        req.session.otpSended = true
        let otpsend = req.session.otpSended
        req.session.userLoginErr = "Invalid otp"
        res.render('pages/otplogin', { "loginErr": "Entered otp is invalid", otpsend })
      }
    })
})




router.post('/loggin',(req,res)=>{
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  userHelper.getLogin(req.body).then((response)=>{
    if(response.status){
      res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
      req.session.user=response.user
      req.session.userLoggedIn=true
      res.redirect(req.session.redirectTo)
    }else{
      
      res.redirect('/loggin')
    }
    
  })
})



router.get('/signup', function(req, res, next) {
  res.render('pages/register', {  });
});



router.get('/adminLogin', function(req, res, next) {
  res.render('pages/adminLogin', { admin:false});
});

router.post('/regis',  function(req, res, next) {
  console.log(req.body)
  
    userHelper.addUsers(req.body).then(async(response)=>{
      let ref= await userHelper.checkReferal(req.body).then(()=>{
      req.session.user=response 
      req.session.userLoggedIn=true
       res.redirect('/')
  })
  
  })
 });

router.get('/logout',(req,res)=>{
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect('/')
})



  // <--------------add to cart-------------->
  router.get('/addtocart/:id',verifyLogin,(req,res)=>{
    console.log("successssss");
    userHelper.addToCart(req.params.id,req.session.user._id).then((response)=>{
      console.log(response,"kellooooo");
      if(response.status){
        res.json({status:true})
      }
      else{
        res.json({status:false})
      }
    
  })
})


router.get('/viewCart',verifyLogin, async (req,res)=>{
  let user1=req.session.user
  let cartCount=null
  let wishlistCount=null
  if(req.session.user){
  cartCount=await userHelper.getCartCount(req.session.user._id)
  wishlistCount=await userHelper.getWishlistCount(req.session.user._id)
}
let product=await userHelper.getCartDetails(req.session.user._id)
let totalValue=await userHelper.getTotalAmount(req.session.user._id)
let totalMRP= await userHelper.getTotalMRP(req.session.user._id)


console.log(req.session.mrp,"LLLLLLLLLLLLLLLLLLLLLL");
// let totalValue
// if(req.session.final){
//   totalValue=req.session.final;
// }
// else{
//   totalValue=await userHelper.getTotalAmount(req.session.user._id)
// }
userHelper.getAllCoupons().then((coupon)=>{
productHelper.getAllCategory().then((category)=>{
  productHelper.getAllProducts().then((products)=>{
res.render('pages/shopping-cart',{user:true,user1,product,cartCount,category,products,wishlistCount,totalValue,coupon,totalMRP})
})
})
})
})

// <--------------ajax----------->
router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body);
  userHelper.changeProductQuantity(req.body).then((response)=>{
   res.json(response)
  })
})

router.post('/remove-product-cart',(req,res,next)=>{
  userHelper.removeProduct(req.body).then((response)=>{
    res.json(response)
  })
})

router.get('/check-out',verifyLogin, async(req,res)=>{
  let user1=req.session.user
  let discount=req.session.discount
  if(req.session.user){
    if(req.session.user){
      let total
      if(req.session.final){
        total=req.session.final
      }
      else{
        total=await userHelper.getTotalAmount(req.session.user._id)
      }
  let address= await userHelper.getUserAddress(req.session.user._id)
  let totalMRP= await userHelper.getTotalMRP(req.session.user._id)
  req.session.mrp=totalMRP
  let product=await userHelper.getCartDetails(req.session.user._id)
  let wishlistCount=await userHelper.getWishlistCount(req.session.user._id)
  let cartTotal= await userHelper.getTotalAmount(req.session.user._id)
  productHelper.getAllCategory().then((category)=>{
    productHelper.getAllProducts().then((products)=>{
      
  res.render('pages/check-out',{total,category,products,product,user1,address,wishlistCount,discount,totalMRP,cartTotal})
})
})
}}})

// <----------------checkout for single product------------------>

router.get('/check-out-prod',verifyLogin,async(req,res)=>{

console.log("iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii");
console.log(req.query.id,"MMMMMMMMMMMMMMMMMMMMMM");
req.session.indvidualPrice=null
  let user1=req.session.user
  let discountt=req.session.discount
  if(req.session.user){
    let totall
    
  let address= await userHelper.getUserAddress(req.session.user._id) 
  let productr=await userHelper.getProductDetail(req.query.id)
  req.session.indvidualPrice=productr.prodSellPrice
  req.session.mrsp=productr.prodMarketPrice
  req.session.productr=productr
  if(req.session.final){
    totall=req.session.final
    
  }
  else{
    totall=req.session.indvidualPrice
  }
  console.log(req.session.indvidualPrice,"productr");
  let wishlistCount=await userHelper.getWishlistCount(req.session.user._id)
  productHelper.getAllCategory().then((category)=>{
    productHelper.getAllProducts().then((products)=>{
      userHelper.getAllCoupons().then((coupon)=>{
  res.render('pages/check-out',{user:true,totall,category,products,productr,user1,address,wishlistCount,discountt,coupon})
})
  })
})
}})

// <-----------------category wise--------------->
router.get('/catWise', async(req,res,next)=>{
  
  let user1=req.session.user
  let cartCount=0
  let wishlistCount=0
  if(req.session.user){
  cartCount=await userHelper.getCartCount(req.session.user._id)
  wishlistCount=await userHelper.getWishlistCount(req.session.user._id)
}



userHelper.catwiseName(req.query.id).then((products)=>{
  productHelper.getAllCategory().then((category)=>{
  console.log(products)
  res.render('pages/shopProducts',{user:true,products,category,cartCount,wishlistCount,user1})
 })
})
 })
// <-------------------place-order--------------->
router.get('/orderdetails',verifyLogin,async(req,res,next)=>{
  let user1=req.session.user
  if(req.session.user){
  let total=await userHelper.getTotalAmount(req.session.user._id)
  let orders=await userHelper.getOrderDetails(req.session.user._id)
  res.render('pages/order-details',{user1,total,orders})
}
})

router.get('/view-order-products/',verifyLogin,async(req,res,next)=>{
  let user1=req.session.user
  if(req.session.user){
  let product=await userHelper.getOrderProducts(req.query.id)
  console.log(product,"producttttttprooooooooooooo");
  let total=await userHelper.getTotalAmount(req.session.user._id)
  let order=await userHelper.getOrderProduct(req.query.id)
  let amt=order[0].totalAmount
  let date=order[0].date
  let name=order[0].deliveryDetails.name
  let address=order[0].deliveryDetails.house + ','+order[0].deliveryDetails.street +','+order[0].deliveryDetails.town
  let state=order[0].deliveryDetails.state + ','+order[0].deliveryDetails.zip
  let email=order[0].deliveryDetails.email
  let mobile=order[0].deliveryDetails.mobile
  let paymentMethod=order[0].paymentMathod
  let mrp=parseInt(order[0].MRP)
  let grandTotal=order[0].GrandTotal
  let offerPrice=order[0].Subtotal
  let discount=order[0].discountAmt
  let status=order[0].status
  
  console.log(order[0],"====================================",name);
  res.render('pages/view-order-indetail',{user:true,user1,product,total,order,amt,date,name,address,state,email,mobile,paymentMethod,status,mrp,offerPrice,discount,grandTotal})
  }
})

router.get('/payment-failed',verifyLogin,(req,res,next)=>{
  res.render('pages/payment-failed',{user:true})
})

router.get('/orders',verifyLogin ,async(req,res,next)=>{
  let user1=req.session.user
  if(req.session.user){
  
  let totalOrders=await userHelper.totalOrderCount(req.session.user._id)
 let pageCount=Math.ceil(totalOrders/10)
 let count=[]
 for(i=1;i<=pageCount;i++){
  count.push(i)
 }
 let orders=await userHelper.getOrderDetails(req.session.user._id,req.query.id)
 orders.forEach(orders => {
  orders.date = orders.date.toString().substr(4, 17)
  
    });
 
  productHelper.getAllCategory().then((category)=>{
    productHelper.getAllProducts().then((products)=>{
  res.render('pages/view-orders',{orders,user:req.session.user,user1,products,category,count})
    })
  })
  }
})

router.post('/cancel-order',verifyLogin,(req,res,next)=>{
  console.log(req.body.oId,req.body.pId,"<<<<<<<%%%%%%%%%%%%%%%%%");
  userHelper.cancelOrder(req.body.oId,req.body.pId).then((response)=>{
    
    res.redirect('/orders')
  })
})

router.get('/return-order',verifyLogin,(req,res,next)=>{
  userHelper.returnOrder(req.query.id).then((response)=>{
    res.redirect('/orders')
  })
})



  router.post('/place-order',verifyLogin, async(req,res,next)=>{
    let addr=await userHelper.getAddress(req.body.radio,req.body.userId)
    let address= addr.shift();
    let totalPrice
    let discount
    let products
    let MRP
   
    if(req.session.final){
      totalPrice=req.session.final
      discount=req.session.discount
      products=req.session.productr
      MRP=req.session.mrsp
      products=await userHelper.getCartProductList(req.body.userId)
    }
    else{
      totalPrice=await userHelper.getTotalAmount(req.body.userId)
      products=await userHelper.getCartProductList(req.body.userId)
      MRP=req.session.mrp
      
    }
    MRP=req.session.mrp
    console.log(MRP,"MRPPPPPPPPPPPPPPP");
    address['payment-method']=req.body['payment-method'];
    address.userId=req.session.user._id
    
    
    userHelper.placeOrder(address,products,totalPrice,discount,MRP).then(async(orderId)=>{
      console.log(req.body,"uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu");
    if(req.body['payment-method']=='COD'){
      res.json({codSuccess:true})
      
    }
    else if(req.body['payment-method']=='Wallet'){
     console.log(req.body,"::::::::::::::::::::::::::::::::::::::::");
        userHelper.walletPayment(totalPrice,req.body.userId,orderId).then(()=>{
          res.json({walletSuccess:true})
        })
      
      
    }

    else if(req.body['payment-method']=='Razorpay'){
      userHelper.generateRazorpay(orderId,totalPrice).then((response)=>{
        response.razor=true
        res.json(response)
        

      })
    }
    else if(req.body['payment-method']=='Paypal'){
      var payment = {
        "intent": "authorize",
"payer": {
"payment_method": "paypal"
},
"redirect_urls": {
"return_url": "http://localhost:3000/orderdetails",
"cancel_url": "http://localhost:3000/payment-failed"
},
"transactions": [{
"amount": {
  "total": totalPrice,
  "currency": "USD"
},
"description": ""
}]
}
      // userHelper.createPay(payment).then((response)=>{
      //   console.log("############################",response);
      //   response.paypal=true
      //   res.json(response)
      // })


      userHelper.createPay( payment ) .then( ( transaction ) => {
          var id = transaction.id; 
          var links = transaction.links;
          var counter = links.length; 
          console.log(transaction,"transaction---");
          while( counter -- ) {

              
              if ( links[counter].rel === 'approval_url') {
        // redirect to paypal where user approves the transaction 

        transaction.paypal=true
        transaction.linkto=links[counter].href
        transaction.orderId=orderId.insertedId
        console.log(transaction.orderId.insertedId,"transaction.orderId");
        userHelper.changePaymentStatus(orderId.insertedId).then(()=>{
          
          res.json(transaction)
        })
        
                  
              }
          }
      })
      .catch( ( err ) => { 
          console.log( err ); 
          res.redirect('/err');
      });


    }
   
    })
   
  })


// <---------------add-new-address---------->
 

  router.post('/add-address/:id',verifyLogin,(req,res,next)=>{
    userHelper.userAddress(req.body,req.session.user._id).then(()=>{
      res.redirect('/check-out')
    })
  })

  router.post('/add-addressfront/:id',verifyLogin,(req,res,next)=>{
    userHelper.userAddress(req.body,req.session.user._id).then(()=>{
      res.redirect('/profile')
    })
  })

  router.post('/edit-addressfront',verifyLogin,(req,res,next)=>{
    console.log(req.query.id,"9999999999999999999999999999999999999999");
    userHelper.editAddress(req.body,req.query.id).then(()=>{
      res.redirect('/profile')
    })
  })


router.get('/delete-address/',verifyLogin,(req,res,next)=>{
 
  userHelper.deleteAddress(req.query.id,req.session.user._id).then((result)=>{
   res.redirect('/profile')
  })
})

// <-------------------profile---------------->
router.get('/profile',verifyLogin,async(req,res,next)=>{
  let user1=req.session.user
  let cartCount=null
  let wishlistCount
  if(req.session.user){
  cartCount=await userHelper.getCartCount(req.session.user._id)
  wishlistCount=await userHelper.getWishlistCount(req.session.user._id)
  let userProfile=await userHelper.userProfile(req.session.user._id)

let address= await userHelper.getUserAddress(req.session.user._id)
productHelper.getAllCategory().then((category)=>{
  productHelper.getAllProducts().then((products)=>{
res.render('pages/profile',{user:true,cartCount,user1,address,wishlistCount,userProfile,products,category})
  })
})
  }
})


// <-----------payment gateway--------------->
router.post('/verify-payment',verifyLogin,(req,res,next)=>{
  console.log(req.body,"@@@@@@@@@@@@@@@@@@");
  userHelper.verifyPayment(req.body).then(()=>{
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log('payment sucessful');
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err);
    res.json({status:false,errMsg:''})
  })
})

// <-------------------wishlist---------------------->
router.get('/add-to-wishlist/:id',verifyLogin,(req,res,next)=>{
userHelper.wishList(req.session.user._id,req.params.id).then(()=>{
  res.redirect('/shopProd')
})

})

router.get('/add-to-wishlist-dp/:id',verifyLogin,(req,res,next)=>{
  userHelper.wishList(req.session.user._id,req.params.id).then(()=>{
    res.redirect('/view-wishlist')
  })
  
  })

router.get('/view-wishlist',verifyLogin, async (req,res,next)=>{
  let user1=req.session.user
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
  }
let wishlist= await userHelper.getWishlist(req.session.user._id)
let wishlistCount=await userHelper.getWishlistCount(req.session.user._id)
productHelper.getAllCategory().then((category)=>{
  productHelper.getAllProducts().then((products)=>{
res.render('pages/wishlist',{user:true,user1,cartCount,wishlist,category,products,wishlistCount})
     })
   })
})

router.get('/add2cart/:id',verifyLogin,(req,res,next)=>{
  userHelper.addToCart(req.params.id,req.session.user._id).then((response)=>{
    userHelper.removeFromCart(req.params.id,req.session.user._id).then((response)=>{
      res.redirect('/viewCart')
    })
})
})

router.get('/delete-from-list/:id',verifyLogin,(req,res,next)=>{
  userHelper.removeFromCart(req.params.id,req.session.user._id).then((response)=>{
    res.redirect('/view-wishlist')
})
})

router.get('/coupon-check',(req,res)=>{
  res.render('/')
})


router.post('/coupon-check',verifyLogin, async(req,res)=>{
let total=await userHelper.getTotalAmount(req.session.user._id)
let coupon={}
coupon.total=total
let coup= await userHelper.checkCoupon(req.body,req.session.user._id,total)
coupon.coupon=coup
let discount=parseInt(coup.discount) 
let finalprice= total-total/100*discount
let discounted=total-coup
coupon.discount=discounted
req.session.final=coup
req.session.discount=discounted
res.json(coupon)


})


router.post('/coupon-check2',verifyLogin, async(req,res)=>{
  req.session.indvidualPrice
  let total=req.session.indvidualPrice
  console.log(total,"total");
  let coupon={}
  coupon.total=total
  let coup= await userHelper.checkCoupon(req.body,req.session.user._id,total)
  console.log(coup,"coup");
  let discounted=total-coup
  console.log(discounted,"discount");
  coupon.discount=discounted
  req.session.final=coup
  req.session.discount=discounted
  res.json(coupon)
  
  
  })

module.exports = router;