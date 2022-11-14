var express = require('express');
const { response } = require('../app');
var router = express.Router();
var productHelper=require('../helpers/productHelpers')
var userHelper=require('../helpers/userHelpers')

/* GET users listing. */

router.get('/dash', async function (req, res, next) {
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
  let totalGross= COD+Razor+Paypal
  let order=orders.order
  let total=orders.totalcount
    res.render('pages/admin-Dashboard',{layout:'adminLayout',order,total,COD,razor,paypal,totalGross})
  })
  
  


router.get('/userMan', async function(req, res, next) {

  let totalUsers=await productHelper.totalUserCount()
  let pageCount=Math.ceil(totalUsers/8)
  let count=[]
  for(i=1;i<=pageCount;i++){
   count.push(i)
  }
  console.log(count,"coiunt");
  let users=await productHelper.getUserManDetails(req.query.id)
console.log(req.query.id,"reqqueryid");
productHelper.getAllUsers().then((use)=>{

  res.render('pages/admin-user',{layout:'adminLayout',users,totalUsers,use,count})
 })
 
  
});

router.get('/productMan', async function(req, res, next) {
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
    res.render('pages/admin-product',{layout:'adminLayout',products,count})
  })
  
});

router.get('/deleteUser/:pId', function(req, res, next) {
  console.log(req.params.pId)
  productHelper.deleteUser(req.params.pId).then((result)=>{
  res.redirect("/admin/UserMan")
    })
  });
  



router.get('/addProd', function(req, res, next) {
  let add= req.session.alert
  req.session.alert=null
  productHelper.getAllCategory().then((category)=>{
  res.render('pages/admin-add-product',{layout:'adminLayout',category,add})
})
});

router.get('/catMan', function(req, res, next) {
  productHelper.getAllCategory().then((products)=>{
  res.render('pages/admin-category',{layout:'adminLayout',products})
})
});


router.get('/addCat', function(req, res, next) {
  let add1=req.session.alert
  req.session.alert=null
  res.render('pages/admin-add-category',{layout:'adminLayout',add1,'alert':req.session.catalert})
  req.session.catalert=null
});



router.post('/addProd',(req,res)=>{
  productHelper.addNewProduct(req.body).then((id)=>{
    if(id.value=="exist"){
     res.redirect('/admin/addProd')
    }
    else if(id.value=="amount"){
      res.redirect('/admin/addProd')
    }
    else{
    let image=req.files.prodImage
    image.mv('./public/product-imgs/'+id+'.jpg',(err,done)=>{
  if(!err){
    res.redirect('/admin/addProd')
  }
  else{
    console.log(err);
    res.redirect('/admin/addProd')
  }
  })
}
  })
  
})

router.post('/addCat', function(req, res, next) {
console.log(req.body)
productHelper.addCategory(req.body,(id)=>{
  if(id.status){
    console.log("category exist");
    req.session.catalert="CATEGORY ALREADY EXISTS"
    res.redirect('/admin/addCat')
    
  }
  else{
    
  let image=req.files.catImg
  image.mv('./public/category-imgs/'+id+'.jpg',(err,done)=>{
if(!err){
  req.session.alert=true
  res.redirect('/admin/addCat')

}
else{
  res.redirect('/admin/CatMan')
  console.log(err);
}
  })
  }
  })
});
// <-----------------products---------------->


router.get('/deleteProd/:pId', function(req, res, next) {
console.log(req.params.pId)
productHelper.deleteProduct(req.params.pId).then((result)=>{
res.redirect("/admin/productMan")
  })
});


router.get('/editProdt/', async (req,res,next)=>{
  let add= req.session.alert
  req.session.alert=null
let product=await productHelper.getProductDetails(req.query.id)
productHelper.getAllCategory().then((category)=>{
  res.render('pages/admin-edit-product',{category,product,layout:'adminLayout',add}) 
})
})

router.post('/editProd/:id',(req,res)=>{
  
  let image=req.files.prodImage
  productHelper.updateProduct(req.params.id,req.body).then(()=>{
    let id=req.params.id
     req.session.alert=true
    
   
     image.mv('./public/product-imgs/'+id+'.jpg',(err,done)=>{
      if(!err){
        req.session.alert=true
        res.redirect('/admin/productMan')
      
      }
      else{
        console.log(err);
      }
      
        
        
    })
  })
})



// <----------------category------------>

router.get('/deleteCat/:cId', function(req, res, next) {
  console.log(req.params.cId)
  productHelper.deleteCategory(req.params.cId).then((result)=>{
  res.redirect("/admin/catMan")
    })
  });
  
  
  router.get('/editCatt/', async (req,res,next)=>{
  console.log(req.query.id);
  let product=await productHelper.getCatDetails(req.query.id)
    console.log(product); 
    res.render('pages/admin-edit-category',{product,layout:'adminLayout'}) 
  })
  
  router.post('/editCat/:id',(req,res)=>{
    console.log(req.files.catImg,"000000000000000000000000000000000000000000000000000000000");
    let image=req.files.catImg
    productHelper.updateCategory(req.params.id,req.body).then(()=>{
      let id=req.params.id
      res.redirect('/admin/catMan')
     image.mv('./public/category-imgs/'+id+'.jpg',(err,done)=>{
      


    })
     
    })
  })
      
// <-----------------blocking--------------->

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

    // <-------------------admin login-------------->

const CentralAdmin="sankar"
const CentralPassword="sachin"

/* GET home page. */
router.get('/adminlogin', function(req, res,next) {

  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  let User=req.session.admin;
  if(User){
    res.redirect('/admin/dash')
  }
  else
 res.render('admin-Login',{layout:'adminLayout'});
 req.session.loginerr=null
});


router.post('/adminlogin',(req,res)=>{

  const userdata={mobileNo,password}=req.body;
  if(CentralAdmin==mobileNo && CentralPassword==password){
    req.session.loggedIn=true;
    req.session.admin=userdata;
    res.redirect('/admin/dash')
  }
  else{
    req.session.loginerr="invalid credintials"
    res.redirect('/adminlogin')
  }
  
})


router.get('/adminLogout',function(req, res) {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
 
  res.clearCookie('CentralAdmin');
  res.clearCookie('CentralPassword');
  req.session.admin=null;
  req.session.loggedIn=false
  res.redirect('/admin')
  });


// <-------------------orders------------------>
router.get('/orderMan', async (req,res,next)=>{

  let totalproducts=await productHelper.totalOdrCount()
  let pageCount=Math.ceil(totalproducts/8)
  let count=[]
  for(i=1;i<=pageCount;i++){
   count.push(i)
  }
  console.log(count,"coiunt");
  let orders=await productHelper.getOdrManDetails(req.query.id)
  
console.log(req.query.id,"reqqueryid");

productHelper.getAllOrders().then((order)=>{

orders.forEach(orders => {
orders.date = orders.date.toString().substr(0, 10)
console.log(orders,"orderssssssssssssssssssssssssssss");

  });

res.render('pages/admin-order',{layout:'adminLayout',orders,order,count})
})
  })

 

router.get('/edit-orders/', async (req,res,next)=>{
  let order=await productHelper.getAllOrders(req.query.id)
    res.render('pages/adminEditOrder',{layout:'adminLayout',order}) 
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

  router.post('/update-order-status', (req,res,next)=>{
    
  productHelper.updateOrderStatus(req.body).then(()=>{
    console.log(req.body,"mmmmmmmmmmmmmmmm");
    res.json()
  
   
  })
  })

router.get('/reports',(req,res,next)=>{
  res.render('pages/admin-Reports',{layout:'adminLayout'})
})

// <------------coupon------------>

router.get('/coupons',(req,res,next)=>{
  productHelper.getAllCoupons().then((coupons)=>{
    res.render('pages/admin-coupons',{layout:'adminLayout',coupons})
  })
})

router.get('/addcoupon',(req,res,next)=>{
res.render('pages/admin-add-coupon',{layout:'adminLayout'})
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

  // <============SALES REPORT=============>

  router.get('/salesreport',async(req,res)=>{
  
   let report= await productHelper.generateReportt()
   
      res.render('pages/admin-Reports',{layout:'adminLayout',report})
    })
   
  // <=============BANNERS==============>
  router.get('/banner',async(req,res)=>{
    productHelper.setBanner().then((banner)=>{
      res.render('pages/admin-banner',{layout:'adminLayout',banner})
    })
  })

  router.get('/add-new-banner',(req,res,next)=>{
    res.render('pages/admin-add-banner',{layout:'adminLayout'})
    })

  router.post('/add-new-banner',(req,res,next)=>{
    productHelper.addBanner(req.body).then(()=>{
    res.redirect('/admin/banner')
    })
    })
module.exports = router;
