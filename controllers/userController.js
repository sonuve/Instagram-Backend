import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utile/datauri.js";
import cloudinary from "../utile/cloudinary.js";
import { Post } from "../models/postModel.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required.",
        success: false,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "This email is already in use.",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Account created successfully.",
      success: true,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("Error in register function:", err.message);
    return res.status(500).json({
      message: "Server error. Please try again later.",
      success: false,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Incorrect email or password.",
        success: false,
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Incorrect password.",
        success: false,
      });
    }

    const token = jwt.sign({ usersId: user._id }, process.env.KEY_PROTECT, {
      expiresIn: "1d",
    });

    const populatePost = await Promise.all(
      (user.posts || []).map(async (postsId) => {
        const post = await Post.findById(postsId);
        if (post && post.author.equals(user._id)) {
          return post;
        }
        return null;
      }),
    );

    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      posts: populatePost.filter(Boolean),
    };

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: `Welcome back ${user.username}`,
      success: true,
      user: userData,
    });
  } catch (err) {
    console.error("Error in login method:", err);
    return res.status(500).json({
      message: "Internal server error during login.",
      success: false,
    });
  }
};

export const logout = (req, res) => {
  try {
    return res.cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ message: "Logout failed", success: false });
  }
};

export const getprofile = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId)
      .populate({ path: "posts", options: { sort: { createdAt: -1 } } })
      .populate("bookmarks");

    return res.status(200).json({
      user,
      success: true,
    });
  } catch (error) {
    console.error("Error in getprofile:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const editprofile = async (req, res) => {
  try {
    const userId = req.userId;
    const { bio, gender } = req.body;
    const profilePicture = req.file;
    let cloudResponse;

    if (profilePicture) {
      const fileUri = getDataUri(profilePicture);
      cloudResponse = await cloudinary.uploader.upload(fileUri);
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User Not Found",
        success: false,
      });
    }

    if (bio) user.bio = bio;
    if (gender) user.gender = gender;
    if (profilePicture) user.profilePicture = cloudResponse.secure_url;
    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      user,
    });
  } catch (err) {
    console.error("Error in editprofile:", err);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const getSuggestionUsers = async (req, res) => {
  try {
    const SuggestionUsers = await User.find({
      _id: { $ne: req.userId },
    }).select("-password");

    if (!SuggestionUsers || SuggestionUsers.length === 0) {
      return res.status(400).json({
        message: "Currently do not have any users",
        success: false,
      });
    }
    return res.status(200).json({
      users: SuggestionUsers,
      success: true,
    });
  } catch (err) {
    console.error("Error in getSuggestionUsers:", err);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const followOrunfollow = async (req, res) => {
  try {
    const youId = req.userId;
    const toId = req.params.id;

    if (youId === toId) {
      return res.status(400).json({
        message: "You cannot follow/unfollow yourself",
        success: false,
      });
    }

    const user = await User.findById(youId);
    const targetuser = await User.findById(toId);

    if (!user || !targetuser) {
      return res.status(400).json({
        message: "User not Found",
        success: false,
      });
    }

    const isfollowing = user.following.includes(toId);

    if (isfollowing) {
      await Promise.all([
        User.updateOne({ _id: youId }, { $pull: { following: toId } }),
        User.updateOne({ _id: toId }, { $pull: { followers: youId } }),
      ]);
      return res.status(200).json({
        message: "Unfollowed successfully",
        success: true,
      });
    } else {
      await Promise.all([
        User.updateOne({ _id: youId }, { $push: { following: toId } }),
        User.updateOne({ _id: toId }, { $push: { followers: youId } }),
      ]);
      return res.status(200).json({
        message: "Followed successfully",
        success: true,
      });
    }
  } catch (error) {
    console.error("Error in followOrUnfollow:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
