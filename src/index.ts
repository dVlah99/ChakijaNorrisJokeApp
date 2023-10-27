import express, { Request, Response, Application } from 'express'
import { createConnection, DataSourceOptions } from 'typeorm'
import dotenv from 'dotenv'
import { User } from './Entities/User'
import { UserRefreshToken } from './Entities/UserRefreshToken'
import * as bodyParser from 'body-parser'
import { UserService } from './Services/UserService'
import * as jwt from 'jsonwebtoken'
import { JokeService } from './Services/JokeService'
import cors from 'cors'

dotenv.config()
const test: DataSourceOptions = {
	type: 'postgres',
	password: process.env.DBPASSWORD,
	host: process.env.HOST,
	database: process.env.DATABASE,
	port: parseInt(process.env.DBPORT || '5432', 10),
	username: process.env.USERNAME,
	synchronize: true,
	entities: [User, UserRefreshToken],
}
const port = process.env.PORT || 8000

createConnection(test)
	.then(() => {
		console.log('Connected to the database: ')
	})
	.catch((error) => {
		console.error('Error connecting to the database:', error)
	})

const app: Application = express()
app.use(bodyParser.json())
app.use(cors())

//GET
app.get('/sendAJoke', authToken, async (req: Request, res: Response) => {
	const results = await JokeService.SendJokeToEmail(req)
	CheckResults(results, res)
})

//POST
app.post('/signup', async (req, res) => {
	const { firstName, lastName, email, password } = req.body
	const results = await UserService.SignUp({ firstName, lastName, email, password })
	CheckResults(results, res)
})

app.post('/login', async (req, res) => {
	const { email, password } = req.body
	const results = await UserService.Login({ email, password })
	CheckResults(results, res)
})

app.post('/token', async (req, res) => {
	const refreshToken = req.body.token
	if (!refreshToken) return res.sendStatus(401)

	const refreshTokenFromDb = UserRefreshToken.find({
		where: { refreshToken: refreshToken },
	})
	if (!refreshTokenFromDb) return res.sendStatus(401)

	const results = await UserService.Token(refreshToken)
	CheckResults(results, res)
})

//MIDDLEWARE
function authToken(req, res, next) {
	const authHeader = req.headers['authorization']
	const token = authHeader && authHeader.split(' ')[1]

	if (!token) return res.sendStatus(401)

	jwt.verify(token, process.env.JWT_SECRET_KEY_ACCESS, (error, user) => {
		if (error) return res.sendStatus(403)

		req.user = user
		next()
	})
}

app.listen(port, () => {
	console.log(`Server is Fire at http://localhost:${port}`)
})

function CheckResults(results: unknown, res: Response){
	if(results instanceof Error){
		res.status(500).json({ results })
	} else {
		res.status(201).json({ results })
	}
}
