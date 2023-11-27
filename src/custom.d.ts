// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Request } from 'express'

declare module 'express' {
  interface Request {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: any; // Replace 'any' with the actual type of your 'user' property
  }
}