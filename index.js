import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './utile/DB.js'
import userRouter from './routes/userRouter.js'
import PostRouter from './routes/PostRouter.js';
import messageRouter from './routes/messageRoute.js';
import { app,server } from './Socket/Socket.js'

dotenv.config({})


const port = process.env.ports|| 8080

// Middleware
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))

const corsOption = {
  origin: 'http://localhost:5173', // Fixed CORS origin
  credentials: true,
}
app.use(cors(corsOption))

// Routes
app.use('/api/v1/user', userRouter);
app.use('/api/v1/post', PostRouter);
app.use('/api/v1/message', messageRouter);

app.get('/show', (req, res) => {
  return res.status(200).json({
    message: 'I am coding from backend',
    success: true,
  })
})

// Start only after DB is connected
const startServer = async () => {
  try {
    await connectDB()
    console.log('MongoDB connected successfully')

    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`)
    })
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error)
    process.exit(1) // exit if DB fails
  }
}

startServer()
