import { User } from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'
import getDataUri from '../utile/datauri.js';
import cloudinary from '../utile/cloudinary.js';
import { Post } from '../models/postModel.js';

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields are required.",
                success: false
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: "This email is already in use.",
                success: false
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        return res.status(201).json({
            message: "Account created successfully.",
            success: true,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email
            }
        });

    } catch (err) {
        console.error("Error in register function:", err.message);
        return res.status(500).json({
            message: "Server error. Please try again later.",
            success: false
        });
    }
};


export const login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password are required.",
          success: false
        });
      }
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({
          message: "Incorrect email or password.",
          success: false
        });
      }
  
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({
          message: "Incorrect password.",
          success: false
        });
      }
  
      const token = jwt.sign({ usersId: user._id },process.env.KEY_PROTECT,{ expiresIn: '1d' });

      //populate each post if in the posts array
      const populatePost= await Promise.all(
        user.posts.map( async(postsId)=>{
            const post= await Post.findById(postsId);
            if(post.author.equals(user._id)){
                return post;
            }else{
                return null;
            }
        })
      )
  
      const userData = {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
        posts: populatePost
      };
  
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });
  
      return res.status(200).json({
        message: `Welcome back ${user.username}`,
        success: true,
        user: userData
      });
  
    } catch (err) {
      console.error("Error in login method:", err);
      return res.status(500).json({
        message: "Internal server error during login.",
        success: false
      });
    }
  };
  
export const logout = (req, res) => {
    try {
        return res.cookie('token', " ", { maxAge: 0 }).json({
            message: "Logged out Succesfully",
            success: true
        })
    } catch (error) {
        console.log(error)
    }
};
export const getprofile = async (req, res) => {
    try {
        const userId = req.userId ;

        const user = await User.findById(userId).populate({path:'posts',createAt:-1}).populate('bookmarks');

        return res.status(200).json({ // 🔴 MISTAKE: 201 is for resource creation, use 200 here
            user,
            success: true
        });
    } catch (error) { // 🔴 MISTAKE: 'Error' → should be 'error' (lowercase for standard)
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

export const editprofile = async (req, res) => {
    try {
        const userId = req.userId 
        const { bio, gender } = req.body;
        const profilePicture = req.file;
        let cloudResponse

        if (profilePicture) {
            const fileUri = getDataUri(profilePicture)
            cloudResponse = await cloudinary.uploader.upload(fileUri);
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User Not Found",
                success: false
            })
        }
        //update the Details
        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (profilePicture) user.profilePicture = cloudResponse.secure_url;
        await user.save();

        return res.status(200).json({
            message: "profile is update",
            success: true,
            user
        })


    } catch (err) {
        console.log(err)
    }
};
export const getSuggestionUsers = async (req, res) => {
    try {
        const SuggestionUsers = await User.find({ _id: { $ne: req.userId } }).select("-password");
        if (!SuggestionUsers) {
            return res.status(400).json({
                message: "Currentlt do not have any users",
                success: false
            })
        }
        return res.status(200).json({
            users: SuggestionUsers,
            success: true,
           
        })
    } catch (err) {
        console.log(err)
    }
};

export const followOrunfollow = async (req, res) => {
    try {
        const youId = req.userId  //sonu ki id hai
        const toId = req.params.id //vishal ki id hai
        if (youId === toId) {
            return res.status(400).json({
                message: "You cannot follow/unfollow yourself"
            })
        }
        const user = await User.findById({ youId }); //sonu id hai
        const targetuser = await User.findById({ toId }); //vishal ki id hai

        if (!user || !targetuser) {
            return res.status(400).json({
                message: "User not Found",
                success: false
            })
        }
        //checked follow and unfollow id
        const isfollowing = await user.following.includes(toId);
        if (isfollowing) {
            //unfollow
            await Promise.all([
                User.updateOne({ _id: youId }, { $pull: { following: toId } }),
                User.updateOne({ _id: toId }, { $pull: { followers: youId } }),
            ])
            return res.status(200).json({
                message: "UnFollowed successfully",
                success: true
            })
        } else {
            //follow
            await Promise.all([
                User.updateOne({ _id: youId }, { $push: { following: toId } }),
                User.updateOne({ _id: toId }, { $push: { followers: youId } }),
            ])
            return res.status(200).json({
                message: "Followed successfully",
                success: true
            })
        }
    } catch (error) {
        console.log("Error in followOrUnfollow")
    }
};



