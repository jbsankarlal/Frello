var express = require('express');
const { response } = require('../app');
var router = express.Router();
var productHelper=require('../helpers/productHelpers');
const { verifyLogin } = require('../helpers/productHelpers');
var userHelper=require('../helpers/userHelpers')
const multer = require('multer');


//*******************************multer for category********************************* */
const multerStorageCategory= multer.diskStorage({
  destination: function(req,file,cb){
    cb(null, "./public/category-imgs")
  },
  filename: function(req,file,cb){
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const uploadOne = multer({storage: multerStorageCategory});
const uploadSingleFile =uploadOne.fields([{name:'image', maxCount:1}])
uploadOne



//*******************************multer for multiple products*************************** */
const multerStorageProduct = multer.diskStorage({
  destination: function(req,file,cb){
    cb(null, "./public/product-imgs");
  },
  filename: function(req,file,cb){
    cb(null, Date.now() + '-' + file.originalname)
  }
})

const uploadMany = multer({storage: multerStorageProduct});
/*const uploadMultiFile= uploadMany.fields([{name:'imagemany', maxCount:5}])
uploadMany8*/


//*******************************ADMIN DASHBOARD***************************


router.get('/dash', verifyLogin,async function (req, res, next) {
  let cod= await userHelper.CODtotal()
  console.log(cod,"cod----");
  let COD
  if(cod[0]){
    COD= cod[0].sum
  }
  else{
    COD=0
  }

  let razor= await userHelper.Razortotal()
  let Razor
  if(razor[0]){
    Razor= razor[0].sum
  }
  else{
    Razor=0
  }
  
 let paypal= await userHelper.Paypaltotal()
  let Paypal
  if(paypal[0]){
    Paypal= paypal[0].sum
  }
  else{
    Paypal=0
  }
  
  
  let orders= await productHelper.getAllTheOrders()
  console.log(orders,"{{{{{{{}}}}}}}");
  
  let totalGross= COD+Razor+Paypal
  let order=orders.order
  order.forEach(order => {
    order.date = order.date.toString().substr(4, 17)
  });
  let total=orders.totalcount  
  let monthChart= await productHelper.getMonthReport()
  let yearChart= await productHelper.getYearlyReport()
  console.log(yearChart,"yearChart");
    res.render('admin/Dashboard',{layout:'adminLayout',order,total,COD,razor,paypal,totalGross,monthChart,orders,yearChart})
  })
  
  
//*******************************USER MANAGEMENT***************************

router.get('/userMan',verifyLogin,async function(req, res, next) {

  let totalUsers=await productHelper.totalUserCount()
  let pageCount=Math.ceil(totalUsers/8)
  let count=[]
  for(i=1;i<=pageCount;i++){
   count.push(i)
  }
  console.log(count,"count");
  let users=await productHelper.getUserManDetails(req.query.id)
console.log(req.query.id,"reqqueryid");
productHelper.getAllUsers().then((use)=>{

res.render('admin/users',{layout:'adminLayout',users,totalUsers,use,count})
 })
});


//*******************************PRODUCT MANAGEMENT***************************

router.get('/productMan',verifyLogin, async function(req, res, next) {
  let totalproducts=await productHelper.totalProdCount()
  let pageCount=Math.ceil(totalproducts/8)
  let count=[]
  for(i=1;i<=pageCount;i++){
   count.push(i)
  }
  console.log(count,"coiunt");
  let products=await productHelper.getProdManDetails(req.query.id)
console.log(req.query.id,"reqqueryid");

  productHelper.getAllProducts().then((prod)=>{
    res.render('admin/product',{layout:'adminLayout',products,count})
  })
  
});


router.get('/deleteUser/:pId', function(req, res, next) {
  console.log(req.params.pId)
   productHelper.deleteUser(req.params.pId).then((result)=>{
    res.redirect("/admin/UserMan")
    })
  });
  

//*******************************ADD PRODUCTS***************************

router.get('/addProd',verifyLogin, function(req, res, next) {
  let add= req.session.alert
  req.session.alert=null
  productHelper.getAllCategory().then((category)=>{
  res.render('admin/add-product',{layout:'adminLayout',category,add})
})
});

//*******************************CATEGORY MANAGEMENT***************************

router.get('/catMan',verifyLogin, function(req, res, next) {
  productHelper.getAllCategory().then((category)=>{
  res.render('admin/category',{layout:'adminLayout',category})
})
});

//*******************************ADD CATEGORY***************************

router.get('/addCat',verifyLogin, function(req, res, next) {
  let add1=req.session.alert
  req.session.alert=null
  res.render('admin/add-category',{layout:'adminLayout',add1,'alert':req.session.catalert})
  req.session.catalert=null
});


//*******************************ADD PRODUCTS***************************

router.post('/addProd',uploadMany.array('imageMany'),(req,res)=>{
      let imageMany=[]
      req.files.forEach((value,index)=>{
        console.log(value,"vali=ue");
        imageMany.push(value.filename)
      })
      console.log(imageMany,"imageMany");
      req.body.imageMany=imageMany
      productHelper.addNewProduct(req.body).then((id)=>{
    res.redirect('/admin/addProd')
   })  
})


//*******************************ADD CATEGORY***************************

router.post('/addCat',uploadSingleFile, (req, res, next)=> {
console.log(req.body,"REQ.BODY")
req.body.image= req.files.image[0].filename 

productHelper.addCategory(req.body)
res.redirect('/admin/addCat')
  })
  

//*******************************DELETE PRODUCTS***************************


router.get('/deleteProd/:pId', function(req, res, next) {
console.log(req.params.pId)
productHelper.deleteProduct(req.params.pId).then((result)=>{
res.redirect("/admin/productMan")
  })
});


//*******************************EDIT PRODUCTS***************************

router.get('/editProdt/',verifyLogin, async (req,res,next)=>{
  let add= req.session.alert
  req.session.alert=null
let product=await productHelper.getProductDetails(req.query.id)
productHelper.getAllCategory().then((category)=>{
  res.render('admin/edit-product',{category,product,layout:'adminLayout',add}) 
})
})

router.post('/editProd/:id',uploadMany.array('imageMany'),async(req,res)=>{
  console.log(req.files,"reqq.filessss");
  let imageMany=[]
  if(req.files.length==0){
  imageMany= await productHelper.fetchImages(req.params.id)
  console.log(imageMany,"imageMany");
  }
  else{
    req.files.forEach((value,index)=>{
      imageMany.push(value.filename)
    })
  }
  req.body.imageMany =imageMany
  productHelper.updateProduct(req.params.id,req.body).then(()=>{
   res.redirect('/admin/productMan')
  }   
   )})

// *******************************DELETE CATEGORY***************************

router.get('/deleteCat/:cId', function(req, res, next) {
  console.log(req.params.cId)
  productHelper.deleteCategory(req.params.cId).then((result)=>{
  res.redirect("/admin/catMan")
    })
  });

//*******************************EDIT CATEGORY***************************
   
  router.get('/editCatt/',uploadSingleFile, async (req,res,next)=>{
  console.log(req.query.id);
  let product=await productHelper.getCatDetails(req.query.id)
    console.log(product); 
    res.render('admin/edit-category',{product,layout:'adminLayout'}) 
  })
  
  router.post('/editCat/:id',uploadSingleFile,async(req,res)=>{
    if(req.files.image == null){
      image1 = await productHelper.fetchImg(req.params.id)
    }else{
      image1= await req.files.image[0].filename
    }
    req.body.image=image1
    productHelper.updateCategory(req.params.id,req.body).then(()=>{
   res.redirect('/admin/catMan')
    })
  })
      
// *******************************BLOCKING & UNBLOCKING***************************

router.get('/blockUser/:id',(req,res)=>{
  console.log(req.params.id)
  productHelper.blockUser(req.params.id).then((result)=>{
  res.redirect("/admin/userMan")
    })
  });

  router.get('/unblockUser/:id',(req,res)=>{
    console.log(req.params.id)
    productHelper.unblockUser(req.params.id).then((result)=>{
    res.redirect("/admin/userMan")
      })
    });

//*******************************ADMIN LOGIN***************************

const CentralAdmin="sankar@admin.com"
const CentralPassword="sachin"

/* GET home page. */
router.get('/admin', function(req, res,next) {

  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  let User=req.session.admin;
  if(User){
    res.redirect('/admin/dash')
  }
  else
 res.render('admin/log');
 req.session.loginerr=null
});


router.post('/admin',(req,res)=>{

  const userdata={email,password}=req.body;
  if(CentralAdmin==email && CentralPassword==password){
    req.session.loggedIn=true;
    req.session.admin=userdata;
    res.redirect('/admin/dash')
  }
  else{
    req.session.loginerr="invalid credintials"
    res.redirect('/admin/admin')
  }
  
})


//*******************************ADMIN LOGOUT***************************

router.get('/adminLogout',function(req, res) {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
 
  res.clearCookie('CentralAdmin');
  res.clearCookie('CentralPassword');
  req.session.admin=null;
  req.session.loggedIn=false
  res.redirect('/admin/admin')
  });


// *******************************ORDER MANAGEMENT ***************************
router.get('/orderMan',verifyLogin, async (req,res,next)=>{
 if(!req.query.id){
  req.query.id=1
 }
  let totalproducts=await productHelper.totalOdrCount()
  console.log(totalproducts,"ajuwaa");
  let pageCount=Math.ceil(totalproducts/8)
  console.log(pageCount,"pagecount");
  let count=[]
  for(i=1;i<=pageCount;i++){
   count.push(i)
  }
  console.log(count,"coiunt");
  console.log(req.query.id,"ajuwalaaaaaaa");

productHelper.getAllOrders(req.query.id).then((order)=>{
 
order.forEach(order => {
order.date = order.date.toString().substr(0, 10)


  });
  console.log(order,"ordersssret");

res.render('admin/order',{layout:'adminLayout',order,count})
})
  })

 
//*******************************EDIT ORDERS ***************************
router.get('/edit-orders/', async (req,res,next)=>{
  let order=await productHelper.getAllOrders(req.query.id)
    res.render('admin/adminEditOrder',{layout:'adminLayout',order}) 
  })
  
  
  router.post('/edit-orders/:id',(req,res)=>{
    let image=req.files.prodImage
    productHelper.updateProduct(req.params.id,req.body).then(()=>{
      let id=req.params.id
      res.redirect('/admin/productMan')
       image.mv('./public/product-imgs/'+id+'.jpg',(err,done)=>{
      })
    })
  })


//*******************************UPDATE ORDER STATUS ***************************

  router.post('/update-order-status', (req,res,next)=>{
    
  productHelper.updateOrderStatus(req.body).then(()=>{
    console.log(req.body,"mmmmmmmmmmmmmmmm");
    res.json()
  })
  })


//*******************************REPORTS***************************

router.get('/reports',verifyLogin,(req,res,next)=>{
  res.render('admin/Reports',{layout:'adminLayout'})
})

router.get('/salesreport',async(req,res)=>{
  res.render('admin/Reports',{layout:'adminLayout'})
})

router.post('/salesreport',async(req,res)=>{
console.log(req.body,"bodyyyy");
let report= await productHelper.generateReportt(req.body.from,req.body.to)
res.render('admin/Reports',{layout:'adminLayout',report})
  })


// *******************************COUPON MANAGEMENT***************************

router.get('/coupons',verifyLogin,(req,res,next)=>{
  productHelper.getAllCoupons().then((coupons)=>{
    res.render('admin/coupons',{layout:'adminLayout',coupons})
  })
})

router.get('/addcoupon',verifyLogin,(req,res,next)=>{
res.render('admin/add-coupon',{layout:'adminLayout'})
})


router.post('/add-new-coupon',(req,res,next)=>{
productHelper.addCoupon(req.body).then(()=>{
res.redirect('/admin/coupons')
})
})

router.get('/delete-coupon/:cId', function(req, res, next) {
  console.log(req.params.cId)
  productHelper.deleteCoupon(req.params.cId).then((result)=>{
  res.redirect("/admin/coupons")
    })
  });

  //*******************************BANNER MANAGEMENT***************************

  router.get('/banner',verifyLogin,async(req,res)=>{
    productHelper.setBanner().then((banner)=>{
      res.render('admin/banner',{layout:'adminLayout',banner})
    })
  })

  router.get('/add-new-banner',(req,res,next)=>{
    res.render('admin/add-banner',{layout:'adminLayout'})
    })

  router.post('/add-new-banner',(req,res,next)=>{
    productHelper.addBanner(req.body).then(()=>{
    res.redirect('/admin/banner')
    })
    })

module.exports = router;
