import { Request } from 'express'
import * as jwt from 'jsonwebtoken'
import * as nodeMailer from 'nodemailer'
import { JokeType } from '../Types/JokeType.js'

export class JokeService {
	private static async getJoke(): Promise<JokeType | null>   {
		try {
			const jokeResponse = await fetch('https://api.chucknorris.io/jokes/random')

			if (!jokeResponse) {
				return null
			}

			const jokeJson = (await jokeResponse.json()) as JokeType

			if(!jokeJson.value){
				return null
			}

			return jokeJson
		} catch (error) {
			return null
		}
	}

	private static async extractEmailFromToken(req: Request): Promise<string | jwt.JwtPayload | null>  {
		try {
			const authHeader = req.headers['authorization']
			const token = authHeader && authHeader.split(' ')[1]
			const email = jwt.decode(<string>token)
	
			return email
		} catch (error) {
			return new Error( <string>error )
		}
	}

	public static async SendJokeToEmail(req: Request): Promise<JokeType | Error>  {
		try {
			const jokeToSend = await this.getJoke()
			if(!jokeToSend) return new Error('Problem while fetching joke')

			const email = await this.extractEmailFromToken(req)

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
					to: typeof email === 'string' ? email : email?.email,
					subject: 'Chuck Norris Joke!',
					text: 'Please confirm your email!!!',
					html: jokeHtml
				})

			return jokeToSend
		} catch (error) {
			return new Error( <string>error )
		}
	}
}
