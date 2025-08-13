const express = require('express')
const colors = require('colors')
const dotenv = require('dotenv').config()
const cors = require('cors')
const connectDB = require('./config/db')
const { errorHandler } = require('./middleware/errorMiddleware')

const spaceRoutes = require('./routes/spaceRoutes')
const PORT = process.env.PORT || 5000

// Connect to database
connectDB()

const app = express()

// Enable CORS
app.use(cors({
  origin: 'http://localhost:5173', // Your Vite dev server
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Body parsers
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Routes
app.use('/api/users', require('./routes/userRoutes'))
app.use('/api/content', require('./routes/contentRoutes'))
app.use('/api/spaces', spaceRoutes)

// Error handler
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
});