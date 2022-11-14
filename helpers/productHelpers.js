const { order } = require('paypal-rest-sdk');
const { router } = require('../app');
var db=require('../config/connection')
var ObjectId =require('mongodb').ObjectId

module.exports={
   
    // addProduct:async (product,callback)=>{
    //     console.log(product);
    //     let pName=product.ProdName
    //     let mPrice=product.prodMarketPrice
    //     let sPrice=product.prodSellPrice

    //     let sameProd=await db.get().collection('product').findOne({prodName:pName})
    //     console.log(sameProd,"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    //     if(sameProd){
            
    //       console.log("same product exists");
        
    //     if(sPrice>=mPrice){
    //       log("market price should me more")
    //     }
        
    //     else{
    //       db.get().collection('product').insertOne(product).then((data)=>{
    //         callback(data.insertedId)
    //         console.log(data)
    //       })
         
    //     }
    //   }
    //     else{
    //       db.get().collection('product').insertOne(product).then((data)=>{
    //         callback(data.insertedId)
    //         console.log(data)
    //       })
          
    //     }
        
    // },


    addNewProduct:(data)=>{
      let pName=data.prodName
      console.log(pName,"pnameee");
      let mPrice=data.prodMarketPrice
      console.log(mPrice);
      let sPrice=data.prodSellPrice
      console.log(sPrice);
         return new Promise(async(resolve,reject)=>{
          let sameProd= await db.get().collection('product').findOne({prodName:pName})
          if(sameProd){
            console.log("product existttttttt");
            resolve({value:"exist"})
          }
          else if(sPrice>mPrice){
            console.log("selling price should be lower");
            resolve({value:"amount"})
          }
          else{
            db.get().collection('product').insertOne(data).then((res)=>{
              console.log("prodct enteresed successfully");
              console.log(res,"sameproddd");
              resolve(res.insertedId)
            })
          }
         })
    },


addCategory:(category,callback)=>{
console.log(category.catName,"EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
let cat=category.catName
let dupCat= db.get().collection('category').findOne({catName:cat})
if(dupCat){

callback({status:true})
}
else{
  db.get().collection('category').insertOne(category).then((data)=>{
    callback(data.insertedId)
    console.log(data)
        })
}

},

getAllProducts:()=>{
  return new Promise(async(resolve,reject)=>{
    let products= await db.get().collection('product').find().toArray()
    resolve(products)
  })
},

getAllProductt:(page)=>{
  return new Promise(async(resolve,reject)=>{
    let skip=(parseInt(page)-1)*9
    console.log(skip,"Skipp",page);
    let prod= await db.get().collection('product').find().skip(skip).limit(9).toArray()
    console.log(prod,"{[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[]]]]]]]]]]]]]]]]]]]]]]]]]]]");
    resolve(prod)
  })
},
getAllUsers:()=>{
return new Promise(async(resolve,reject)=>{  
    let user= await db.get().collection('users').find().toArray()
    resolve(user)
  })
},


getAllCategory:()=>{
  return new Promise(async(resolve,reject)=>{
    let category= await db.get().collection('category').find().toArray()
    resolve(category)
  })
},
// getAllOrders:()=>{
//   return new Promise(async(resolve,reject)=>{
//     let orders= await db.get().collection('order').find().toArray()
//     resolve(orders)
//   })
// },
getAllOrders:(page)=>{
  console.log(page,"pageajuuuuuuuuuuuuuuuu");
  let skip=(parseInt(page)-1)*8
  return new Promise(async(resolve,reject)=>{
    let orders= await db.get().collection('order').aggregate([
      {
        $unwind:'$products'
      },
      {
        $unwind:'$deliveryDetails'
      },
      {
        $project:{invoice:'$products.invoice',date:1,name:'$deliveryDetails.name',mobile:'$deliveryDetails.mobile',item:'$products.item',quantity:'$products.quantity',frelloPrice:'$products.frelloPrice',paymentMathod:1,userId:1,status:'$products.status'}
      },
      {
         $sort:{date:-1}
      },
      {
        $skip:skip
      },
      {
        $limit:8
      }
      
    ]).toArray()
    console.log(orders,"ordersss");
    resolve(orders)
  })
},


deleteProduct:(productId)=>{
  return new Promise((resolve,request)=>{
      db.get().collection('product').deleteOne({_id:ObjectId(productId)}).then((response)=>{
          resolve(response)
      })

  })
},

deleteUser:(userId)=>{
  return new Promise((resolve,request)=>{
      db.get().collection('users').deleteOne({_id:ObjectId(userId)}).then((response)=>{
          resolve(response)
      })

  })
},

getProductDetails: (pId)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection('product').findOne({_id:ObjectId(pId)}).then((product)=>{
      resolve(product)
    })
  })
},
updateProduct:(pId,pDetails)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection('product').updateOne({_id:ObjectId(pId)},{
      $set:{
        prodName:pDetails.prodName,
        prodDescrp:pDetails.prodDescrp,
        prodCat:pDetails.prodCat,
        prodQuantity:pDetails.prodQuantity,
        prodSellPrice:pDetails.prodSellPrice,
        prodMarketPrice:pDetails.prodMarketPrice

      }
    }).then((response)=>{
      resolve()
    })
  })
},

deleteCategory:(catId)=>{
  return new Promise((resolve,request)=>{
      db.get().collection('category').deleteOne({_id:ObjectId(catId)}).then((response)=>{
          resolve(response)
      })

  })
},
getCatDetails: (catId)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection('category').findOne({_id:ObjectId(catId)}).then((product)=>{
      resolve(product)
    })
  })
},
updateCategory:(catId,cDetails)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection('category').updateOne({_id:ObjectId(catId)},{
      $set:{
        catName:cDetails.catName,
        catDescrp:cDetails.catDescrp,
        
      
      }
    }).then((response)=>{
      resolve()
    })
  })
},

blockUser:(Id)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection('users').updateOne({_id:ObjectId(Id)},{
      $set:{
        status:false
      }
    }).then((reponse)=>{
      resolve()
    })
  })
},
unblockUser:(Id)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection('users').updateOne({_id:ObjectId(Id)},{
      $set:{
        status:true
      }
    }).then((reponse)=>{
      resolve()
    })
  })
},

 updateOrderStatus:(data)=>{
  let totalAmt
  console.log(data,"kalooo guys");
  let Placed
  let Despatched
  let Shipped
  let Delivered
  let Return

  if(data.status=="Placed"){
    Placed=true
  }else{
    Placed=false
  }

  if(data.status=="Shipped"){
    Shipped=true
  }else{
    Shipped=false
  }

  if(data.status=="Despatched"){
    Despatched=true
  }else{
    Despatched=false
  }

  if(data.status=="Out for Delivery"){
    OutforDelivery=true
  }else{
    OutforDelivery=false
  }

  if(data.status=="Delivered"){
    Delivered=true
  }else{
    Delivered=false
  }

  if(data.status=="Cancelled"){
    Cancelled=true
  }else{
    Cancelled=false
  }

  if(data.status=="Return Requested"){
    Return=true
  }else{
    Return=false
  }
  
  if(data.status=="Return Completed"){
    ReturnCompleted=true
  }else{
    ReturnCompleted=false
  }

  totalAmt=parseInt(data.orderAmt)
  console.log(totalAmt,"geloooo guys");
  
  console.log(data.status,"statusssssss");
  if(data.status=='Return Completed' && data.payMethod!=='COD' || data.status=='Cancelled' && data.payMethod!=='COD' ){
    statbar=true
    return new Promise((resolve,reject)=>{
      db.get().collection('order').updateOne({_id:ObjectId(data.cartId)},
      {
        $set:{status: data.status,statbar:statbar,Shipped:Shipped,Despatched:Despatched,OutforDelivery:OutforDelivery,Cancelled:Cancelled,Return:Return,ReturnCompleted:ReturnCompleted,Delivered:Delivered,Placed:Placed}
      })
      
      db.get().collection('users').updateOne({_id:ObjectId(data.user)},{
        $inc:{wallet:parseFloat(totalAmt)}
     })
     resolve()
    })
    
  }
  else{

  let statusbar
  let statbar
 
  if(data.status=='Delivered' ){
    statusbar=false
  }else{
    statusbar=true
  }
  if(data.status=='Return Requested' || data.status=='Cancelled' || data.status=='Return Completed'){
   statbar=true
  }
  else{
    statbar=false
  }
  return new Promise((resolve,reject)=>{
    db.get().collection('order').updateOne({_id:ObjectId(data.cartId)},{
      $set:
        {status: data.status,statusbar:statusbar,statbar:statbar,Shipped:Shipped,Despatched:Despatched,OutforDelivery:OutforDelivery,Cancelled:Cancelled,Return:Return,ReturnCompleted:ReturnCompleted,Delivered:Delivered,Placed:Placed}
      
    }).then(()=>{
      resolve()
    })
  })
  }

},




getAllTheOrders:()=>{
  return new Promise(async(resolve,reject)=>{
    let order= await db.get().collection('order').find().sort({date:-1}).limit(5).toArray()
    let totalcount= await db.get().collection('order').find().count()
    
    let ord={}
    ord.order=order
    ord.totalcount=totalcount
    resolve(ord)  
    console.log(order,totalcount,"//////////////////////////////////");
  })
 },


 addCoupon:(couponData)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection('coupons').insertOne(couponData).then(()=>{
      resolve()
    })
  })
 },

 getAllCoupons:()=>{
  return new Promise(async(resolve,reject)=>{
   let coupon= await db.get().collection('coupons').find().toArray()
      resolve(coupon)
    
  })
 },

 deleteCoupon:(cId)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection('coupons').deleteOne({_id:ObjectId(cId)}).then((res)=>{
      resolve(res)
    })
  })
 },

 generateReportt:(data)=>{
  console.log("lllllllll98888888888888888");
  return new Promise(async(resolve,reject)=>{
    let ress = await db.get().collection('order').aggregate([
      {
        $match:{status:"Delivered"}
      },
      {
        $unwind:"$products"
      },
      {
       $group:{_id:"$products.item",sum:{$sum:"$products.quantity"}}
      },
      {
        $lookup:{
          from:'product',
          localField:'_id',
          foreignField:'_id',
          as:"newProduct"
        }
      },
      {
        $project: {item:1,sum:1,name:{$arrayElemAt:['$newProduct.prodName',0]},cost:{$arrayElemAt:['$newProduct.prodSellPrice',0]}
      }
    
      },
      {
        $project:{item:1,sum:1,name:1,cost:1,total:{$multiply:['$sum',{$convert:{input: '$cost',to:'int',onError:0}}]}
      }
    }


    ]).toArray()
    console.log(ress,"WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWww");
    resolve(ress)
  })
  
 },

 addBanner:(bannerData)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection('banner').insertOne(bannerData).then(()=>{
      resolve()
    })
  })
 },

 setBanner:()=>{
  return new Promise(async(resolve,reject)=>{
   let banner= await db.get().collection('banner').find().toArray()
      resolve(banner)
    
  })
 },

 totalUserCount:()=>{
  return new Promise((resolve,reject)=>{
    db.get().collection('users').find().count().then((userCount)=>{
        resolve(userCount)
    })
  })
 
},
getUserManDetails:(page)=>{
  return new Promise(async(resolve,reject)=>{
    
      let skip=(parseInt(page)-1)*8
      console.log(skip,"jellele",page);
      let users= await db.get().collection('users').find().sort({username:1}).skip(skip).limit(8).toArray()
      resolve(users)

  })
},

totalProdCount:()=>{
  return new Promise((resolve,reject)=>{
    db.get().collection('product').find().count().then((userCount)=>{
        resolve(userCount)
    })
  })
 
},
getProdManDetails:(page)=>{
  return new Promise(async(resolve,reject)=>{
    
      let skip=(parseInt(page)-1)*8
      console.log(skip,"jellele",page);
      let users= await db.get().collection('product').find().sort({prodName:1}).skip(skip).limit(8).toArray()
      resolve(users)

  })
},

totalOdrCount:()=>{
  return new Promise(async(resolve,reject)=>{
   let userCount= await db.get().collection('order').aggregate([
    {
      $unwind:'$products'
    },
    {
      $count:"tytytytyty"
    }
  
  ]).toArray()
      resolve(userCount[0].tytytytyty)
   })
  
 
},
// getOdrManDetails:(page)=>{
//   return new Promise(async(resolve,reject)=>{
    
//       let skip=(parseInt(page)-1)*8
//       console.log(skip,"jellele",page);
//       let users= await db.get().collection('order').find().sort({date:-1}).skip(skip).limit(8).toArray()
//       resolve(users)

//   })
// } 


}