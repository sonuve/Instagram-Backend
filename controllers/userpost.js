import sharp from "sharp";
import cloudinary from "../utile/cloudinary.js";
import { Post } from "../models/postModel.js";
import { User } from "../models/userModel.js";
import { comment } from "../models/commentModel.js";
import { messages } from "../models/messageModel.js";
import { getreciversocketid, io } from "../Socket/Socket.js";
export const userpost = async (req, res) => {
    try {
        const image = req.file;
        const { caption } = req.body;
        const userLogin = req.userId;
        console.log(userLogin);

        if (!image) {
            return res.status(400).json({
                message: "Image required",
                success: false
            })
        }
        //image upload
        const optimizedImageBuffer = await sharp(image.buffer)
            .resize({ width: 800, height: 800, fit: "inside" })
            .toFormat('jpeg', { quality: 85 })
            .toBuffer();

        //buffer to url
        const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString("base64")}`;
        const cloudResponse = await cloudinary.uploader.upload(fileUri);
        const post = await Post.create({
            caption,
            image: cloudResponse.secure_url,
            author: userLogin
        })
        const user = await User.findById(userLogin);
        if (user) {
            user.posts.push(post._id);
            await user.save();
        }
        await post.populate({ path: 'author', select: '-password' });

        return res.status(200).json({
            message: "Add New Post",
            post,
            success: "true"
        })


    } catch (error) {
        console.log("Error in userpost:", error);  // currently missing in your backend
        return res.status(500).json({ message: "Internal server error", success: false });
    }

};

export const getAllPost = async (req, res) => {
    try {
        const post = await Post.find().sort({ createdAt: -1 })
            .populate({ path: "author", select: "username  profilePicture" })
            .populate({
                path: "Comment",
                sort: { createdAt: -1 },
                populate: { path: "author", select: "username  profilePicture" }
            });

        return res.status(200).json({
            post,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
};

export const getUserPost = async (req, res) => {
    try {
        const authorId = req.userId;
        const post = await Post.find({ author: authorId }.sort({ createdAt: -1 }))
            .populate({ path: "author", select: "username profilePicture" })
            .populate({
                path: "Comment",
                sort: { createdAt: -1 },
                populate: { path: "author", select: "username profilePicture" }

            });
        return res.status(200).json({
            post,
            success: true
        })
    } catch (error) {
        console.log("getPost Error")
    }
};
export const LikePost = async (req, res) => {
    try {
        const LikeKrneWalaUserKId = req.userId;
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: "Post Not Found",
                success: false
            })
        }
        //Like logice started
        await post.updateOne({ $addToSet: { LikeKrneWalaUserKId } });
        await post.save();

        //implement socket io for real time notifaction
        const user=await User.findById(LikeKrneWalaUserKId).select('username profilePicture');
        const postownerId=post.author.toString();
        if(postownerId !== LikeKrneWalaUserKId){  //another person like the post when come notifaction 
            //emit a notifaction
            const notifaction={
                type:'like',
                userId:LikeKrneWalaUserKId,
                userDetail:user,
                postId,
                messages:"Your post is like"

            }
            const postownersocketId=getreciversocketid(postownerId);
            io.to(postownersocketId).emit('notifaction', notifaction)
        }

        return res.status(200).json({
            message: "Post Like",
            success: true
        })
    } catch (error) {
        console.log("Error in LikePost Function")
    }
}


export const disLikePost = async (req, res) => {
    try {
        const LikeKrneWalaUserKId = req.userId;
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: "Post Not Found",
                success: false
            })
        }
        //Like logice started
        await post.updateOne({ $pull: { LikeKrneWalaUserKId } });
        await post.save();
         //implement socket io for real time notifaction
         const user=await User.findById(LikeKrneWalaUserKId).select('username profilePicture');
         const postownerId=post.author.toString();
         if(postownerId !== LikeKrneWalaUserKId){  //another person like the post when come notifaction 
             //emit a notifaction
             const notifaction={
                 type:'dislike',
                 userId:LikeKrneWalaUserKId,
                 userDetail:user,
                 postId,
                 messages:"Your post is dislike"
 
             }
             const postownersocketId=getreciversocketid(postownerId);
             io.to(postownersocketId).emit('notifaction', notifaction)
         }

        return res.status(200).json({
            message: "Post DisLike",
            success: true
        })
    } catch (error) {
        console.log("Error in LikePost Function")
    }
};

export const addComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const commentKarwalaUserId = req.userId;
        const { text } = req.body;
        const post = await Post.findById(postId);
        if (!text) {
            return res.status(404).json({
                message: "text is required",
                success: false
            })
        }
        //Comments Section
        const comments = await comment.create({
            text,
            author: commentKarwalaUserId,
            post: postId
        })

        await comments.populate({ path: "author", select: "username profilePicture" });

        post.Comment.push(comments._id);
        await post.save();

        return res.status(200).json({
            message:"Add Comments",
            comments,
            success:true
        })

    } catch (error) {
        console.log("Error in comment function");
    }
}

export const getAllCommentOfPost=async(req,res)=>{
    try {
        const postId=req.params.id;
        const comments= await comment.find({post:postId}).populate({path:"author",select:"username profilepicture"});
        if(!comments){
            return res.status(404).json({
                message:"No Comments",
                success:false
            })
        }
        return res.status(200).json({success:true,comments});
    } catch (error) {
        console.log("Error in getAllCommentOfPost");
    }
};

export const deletePost=async (req,res)=>{
    try {
        const postId=req.params.id;
        const authorId=req.userId;

        const post =await Post.findById(postId);
        if(!post){
            return res.status(404).json({
                message:"Post Not Found",
                success:false
            })
        }
        //owner of the Account only delete the your post
        if(post.author.toString() !== authorId){
            return req.status(403).json({
                message:"Unauthorized",
                success:false
            })
        }
        //Delete the post
        await Post.findByIdAndDelete(postId);

        //remove the post from the user id
        const user= await User.findById(authorId);
        user.posts=user.posts.filter(id=>id.toString() !== postId);
        await user.save();

        //delete associated comment
        await comment.deleteMany({post:postId});
        return res.status(200).json({
            message:"Post Delete",
            success:true
        })

    } catch (error) {
        console.log("Error in deletePost");
    }
};

export const bookMark=async (req,res)=>{
    try {
        const postid=req.params.id;
        const authorId=req.userId;

        const post =await Post.findById(postid);
        if(!post){
            return res.status(404).json({
                message:"Post Not Found",
                success:false
            })
        }

        const user=await User.findById(authorId);
        if(user.bookmarks.includes(post._id)){
            //already save the image -> remove the images
            await user.updateOne({$pull:{bookmarks:post._id}});
             await user.save();
             return res.status(200).json({message:"Not Save Images",success:true})
        }else{
            //not save the images -> save the images
            await user.updateOne({$addToSet:{bookmarks:post._id}});
            await user.save();
            return res.status(200).json({message:"Save Images",success:true})

        }
    } catch (error) {
        console.log("Error in BookMark");
    }
}