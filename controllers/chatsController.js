// import { Promise } from 'mongoose';
import { conversation } from '../models/conversationModel.js';
import { messages } from '../models/messageModel.js';
import { getreciversocketid, io } from '../Socket/Socket.js';

export const sendMessage = async (req, res) => {
    try {
        const senderId = req.userId;
        const reciverId = req.params.id;
        const { inputText: message } = req.body;
        console.log("Sending message:", message);

        // Check if a conversation already exists
        let conversationMessage = await conversation.findOne({
            participants: { $all: [senderId, reciverId] }
        });

        // Create a new conversation if not found
        if (!conversationMessage) {
            conversationMessage = await conversation.create({
                participants: [senderId, reciverId],
                messages: []
            });
        }

        // Create and save the message
        const sendMessage = await messages.create({
            senderId,
            reciverId,
            message
        });

        // Add message to the conversation
        conversationMessage.messages.push(sendMessage._id);

        await Promise.all([
            conversationMessage.save(),
            sendMessage.save()
        ]);

        // Emit message to receiver using Socket.IO
        const receiverSocketId = getreciversocketid(reciverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('sendMessage', sendMessage);
        }

        return res.status(200).json({
            success: true,
            sendMessage
        });

    } catch (error) {
        console.error("Error in sendMessage controller:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


export const getMessages= async (req,res)=>{
    try {
        const senderId=req.userId;
        const receiverId=req.params.id;
        const conver= await conversation.findOne({
            participants:{$all:[senderId,receiverId]}
        });
        //both are not chats
        if(!conver){
            return res.status(200).json({success:true, messages:[]});
        }
        //both are chats
        return res.status(200).json({
            success:true,
            messages:conver?.messages
        });


    } catch (error) {
        console.log("Error in getMessage");
    }
}