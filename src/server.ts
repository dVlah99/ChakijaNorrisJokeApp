import 'reflect-metadata'
import express, { Request, Response, Application, NextFunction } from 'express'
import dotenv from 'dotenv'
import { UserRefreshToken } from './Entities/UserRefreshToken.js'
import { UserService } from './Services/UserService.js'
import jwt from 'jsonwebtoken'
import { JokeService } from './Services/JokeService.js'
import cors from 'cors'
import bodyParser from 'body-parser'
import { DataSourceOptions, createConnection } from 'typeorm'
import { User } from './Entities/User.js'

/* const pool = new Pool.Pool({
	user: 'postgres',
	host: '35.239.7.0',
	database: 'norris',
	password: 'postgres',
	port: 5432, // default PostgreSQL port

})

pool.query('SELECT * FROM public."user"', (err, res) => {
	console.log('DATABASE!!!')
	if (err) {
		console.error(err)
	}
	console.log('DATABASE SUCCESS I GUESS!!!')
	console.log(res.rows)
}) */

dotenv.config()
const test: DataSourceOptions = {
	type: 'postgres',
	password: 'postgres',
	host: '34.34.14.93',
	database: 'norris',
	port: parseInt(process.env.DBPORT || '5432', 10),
	username: 'postgres',
	synchronize: true,
	entities: [User, UserRefreshToken],
}
const port = process.env.PORT || 8077

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

app.get('/', async (req: Request, res: Response) => {
	res.send('POZDRAV BRATE')
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
function authToken(req: Request, res: Response, next: NextFunction) {
	const authHeader = req.headers['authorization']
	const token = authHeader && authHeader.split(' ')[1]

	if (!token) return res.sendStatus(401)

	jwt.verify(token, <jwt.Secret>'SIKRETKAMUFLADZICBOSANSKITAJNIAGENT', (error, user) => {
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
