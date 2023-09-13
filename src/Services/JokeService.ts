import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import * as nodeMailer from 'nodemailer'
import { JokeType } from '../Types/JokeType'

export class JokeService {
  public static SendJokeToEmail = async (res: Response, req: Request) => {
    let receiverEmail
    const jokeResponse = await fetch('https://api.chucknorris.io/jokes/random')
    if (!jokeResponse) {
      throw new Error('Failed to fetch data')
    }
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    const email = jwt.decode(token)

    const jokeJson = (await jokeResponse.json()) as JokeType

    const transporter = nodeMailer.createTransport({
      secure: false,
      host: 'smtp.office365.com',
      debug: true,
      auth: {
        user: process.env.CHUCKSEMAIL,
        pass: process.env.CHUCKSPASS,
      },
    })

    await transporter
      .sendMail({
        from: process.env.CHUCKSEMAIL,
        to: typeof email === 'string' ? email : email.email,
        subject: 'Chuck Norris Joke!',
        text: 'Please confirm your email!!!',
        html: `<p>Hello there!</p>
        <p>My name is Chakija Norris. I come from Chakovec and my chakija is ostra.
          I'm sensing with my Chuck-E senses that you are having a bad day, so here is a funny joke for you!</p>
          <b>${jokeJson.value}</b>
          <p> Best Regards!</p>
          <p>Chuck</p>`,
      })
      .then((success) => {
        console.log('SUCCESS!', success)
      })
      .catch((error) => {
        console.log('ERROR!', error)
      })

    res.send(jokeJson)
  }
}
