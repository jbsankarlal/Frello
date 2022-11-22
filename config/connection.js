const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect = (done) => {
    const url='mongodb+srv://sankarlal:atlas123@cluster0.aco97oy.mongodb.net/?retryWrites=true&w=majority'
    const dbname='frello'

    mongoClient.connect(url,((err,data) => {
        if(err){
            return done(err)
        } 
            state.db=data.db(dbname)
            done()
      
       
    }))
    
}

module.exports.get= ()=>{
    return state.db
}