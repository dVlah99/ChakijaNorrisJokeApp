import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import * as nodeMailer from 'nodemailer'
import { JokeType } from '../Types/JokeType'

export class JokeService {
  public static SendJokeToEmail = async (res: Response, req: Request) => {
    const jokeResponse = await fetch('https://api.chucknorris.io/jokes/random')
    if (!jokeResponse) {
      throw new Error('Failed to fetch data')
    }
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    const email = jwt.decode(token) as string
    console.log('email: ', email)

    const jokeJson = (await jokeResponse.json()) as JokeType

    const transporter = nodeMailer.createTransport({
      secure: false,
      host: 'smtp.office365.com',
      debug: true,
      auth: {
        user: process.env.CHUNKSEMAIL,
        pass: process.env.CHUCKSPASS,
      },
    })

    await transporter
      .sendMail({
        from: process.env.CHUNKSEMAIL,
        to: email,
        subject: 'Chuck Norris Joke!',
        text: 'Please confirm your email!!!',
        html: `<p>${jokeJson.value}</p>`,
      })
      .then((nesto) => {
        console.log('NESTO!', nesto)
      })
      .catch((error) => {
        console.log('ERROR!', error)
      })

    res.send(jokeJson)
  }
}
