function changeStatus(oId,pId,frelloPrice,userId,PM){
   console.log(pId,frelloPrice,userId,PM)
    let stat=document.getElementById(pId)
    let statt=stat.options[stat.selectedIndex].text
    
    $.ajax({
        url: "/admin/update-order-status",
        data:{
            orderId:oId,
            cartId:pId,
            status:statt,
            orderAmt:frelloPrice,
            user:userId,
            payMethod:PM

        },
        method:'post',
        success:(response)=>{
            alert(response)
            location.reload()
        }
    })
}


function removeProduct(pId,cartId){

    Swal.fire({
title: 'Do you want to Remove this product from the Cart?',
text: "",
icon: 'warning',
showCancelButton: true,
confirmButtonColor: '#3085d6',
cancelButtonColor: '#d33',
confirmButtonText: 'Yes, Remove it!'
}).then((result) => {
if (result.isConfirmed) {
   
    $.ajax({
        url:'/remove-product-cart',
        data:{
            pId:pId,
            cartId:cartId
        },
        method:'post',
        success:(response)=>{
            if(response){

               location.reload()
               }
             }
})       
}
})
}
