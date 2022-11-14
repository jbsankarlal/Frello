function changeStatus(orderId,amount,userId,PM){
    console.log(amount,"kaloooo")
    let stat=document.getElementById(orderId)
    let statt=stat.options[stat.selectedIndex].text
    
    $.ajax({
        url: "/admin/update-order-status",
        data:{
            cartId:orderId,
            status:statt,
            orderAmt:amount,
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