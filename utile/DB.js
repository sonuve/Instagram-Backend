import mongoose from "mongoose";
const connectDB=async ()=>{
    try{
        await mongoose.connect(process.env.Mongo_Url,{
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
       
        console.log("connection is success fully")
    }catch(err){
        console.log("Error in connection MongoDB")
    }
}

export default connectDB;