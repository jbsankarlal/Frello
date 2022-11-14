function changeStatus(pId,frelloPrice,userId,PM){
   console.log(pId,frelloPrice,userId,PM)
    let stat=document.getElementById(pId)
    let statt=stat.options[stat.selectedIndex].text
    
    $.ajax({
        url: "/admin/update-order-status",
        data:{
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