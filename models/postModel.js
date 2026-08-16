import mongoose from "mongoose";

const postSchema=({
    caption:{type:String,default:''},
    image:{type:String,required:true},
    author:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    like:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}],
    Comment:[{type:mongoose.Schema.Types.ObjectId,ref:'comment'}]
})
export const Post=mongoose.model('Post',postSchema);