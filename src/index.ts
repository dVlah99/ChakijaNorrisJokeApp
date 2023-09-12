
import express, { Request, Response , Application } from 'express'
import {createConnection, DataSourceOptions} from 'typeorm'
import dotenv from 'dotenv'
import {User} from "./Entities/User"
import {JokeType} from "./Types/JokeType"
import * as bodyParser from 'body-parser'
import {UserService} from "./Services/UserService"
import * as jwt from 'jsonwebtoken'
import * as nodeMailer from 'nodemailer'

dotenv.config()
const test: DataSourceOptions = {
    type: 'postgres',
    password: process.env.DBPASSWORD,
    host: process.env.HOST,
    database: process.env.DATABASE,
    port: parseInt(process.env.DBPORT || '5432', 10),
    username: process.env.USERNAME,
    synchronize: true,
    entities: [User]
}
const port = process.env.PORT || 8000

createConnection(test) .then((connection) => {
    console.log('Connected to the database')
}).catch((error) => {
    console.error('Error connecting to the database:', error)
})

const app: Application = express()
app.use(bodyParser.json())


app.get('/SendAJoke', authToken, async (req: Request, res: Response) => {
    const jokeResponse = await fetch('https://api.chucknorris.io/jokes/random')
    if(!jokeResponse){
        throw new Error('Failed to fetch data')
    }
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    const email = jwt.decode(token) as string
    console.log('email: ', email)

    const jokeJson = await jokeResponse.json() as JokeType

  const transporter = nodeMailer.createTransport({
        secure: false,
        host:'smtp.office365.com',
        debug: true,
        auth: {
            user: process.env.CHUNKSEMAIL,
            pass: process.env.CHUCKSPASS
        }
    })

    await transporter.sendMail({
        from: process.env.CHUNKSEMAIL,
        to: email,
        subject: 'Chuck Norris Joke!',
        text: 'Please confirm your email!!!',
        html: `<p>${jokeJson.value}</p>`
    }).then((nesto) => {
        console.log('NESTO!', nesto)
    }).catch((error) => {
        console.log('ERROR!', error)
    })

    res.send(jokeJson)
})

    app.post('/signup', async (req, res) => {
        const { firstName, lastName, email, password } = req.body
        await UserService.SignUp({firstName, lastName, email, password}, res)
    })

    app.post('/login', async (req, res) => {
        const {email, password} = req.body
        await UserService.Login({email, password}, res)
    })

function authToken(req,res,next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if(!token) return res.sendStatus(401)


    jwt.verify(token, process.env.JWT_SECRET_KEY_ACCESS, (error,user) => {
        if(error) return res.sendStatus(403)

        req.user = user
        next()
    })
}

app.listen(port, () => {
    console.log(`Server is Fire at http://localhost:${port}`)
})