import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import * as nodeMailer from 'nodemailer'
import { JokeType } from '../Types/JokeType'

export class JokeService {
	private static async getJoke(res: Response): Promise<JokeType>   {
		try {
			const jokeResponse = await fetch('https://api.chucknorris.io/jokes/random')

			if (!jokeResponse) {
				throw new Error('Failed to fetch data!')
			}

			const jokeJson = (await jokeResponse.json()) as JokeType

			if(!jokeJson.value){
				throw new Error('Joke not found!')
			}

			return jokeJson
		} catch (error) {
			if (error == 'Error: Failed to fetch data!') {
				res.status(400).json({ message: 'Error while fetching joke' })
			} else if (error == 'Error: Joke not found!') {
				res.status(404).json({ message: 'Joke not found!' })
			} else {
				res.status(500).json({ message: 'Error while fetching joke' })
			}
			
		}
	}

	private static async extractEmailFromToken(req: Request, res: Response): Promise<string | jwt.JwtPayload>  {
		try {
			const authHeader = req.headers['authorization']
			const token = authHeader && authHeader.split(' ')[1]
			const email = jwt.decode(token)
	
			return email
		} catch (error) {
			res.status(500).json({ message: 'Email extraction error' })
		}
	}

	public static async SendJokeToEmail(res: Response, req: Request): Promise<boolean>  {
		try {
			const jokeToSend = await this.getJoke(res)

			const email = await this.extractEmailFromToken(req, res)

			const transporter = nodeMailer.createTransport({
				secure: false,
				host: 'smtp.office365.com',
				debug: true,
				auth: {
					user: process.env.CHUCKSEMAIL,
					pass: process.env.CHUCKSPASS,
				},
			})

			const jokeHtml = `<p>Hello there!</p>
					<p>My name is Chakija Norris. I come from Chakovec and my chakija is ostra.
					I'm sensing with my Chuck-E senses that you are having a bad day, so here is a funny joke for you!</p>
					<b>${jokeToSend.value}</b>
					<p> Best Regards!</p>
					<p>Chuck</p>`

			await transporter
				.sendMail({
					from: process.env.CHUCKSEMAIL,
					to: typeof email === 'string' ? email : email.email,
					subject: 'Chuck Norris Joke!',
					text: 'Please confirm your email!!!',
					html: jokeHtml
				})

			res.send(jokeToSend)

			return true
		} catch (error) {
			res.status(500).json({ message: 'Error sending joke!' })
		}
	}
}
