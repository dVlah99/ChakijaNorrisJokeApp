import 'reflect-metadata'
/* eslint-disable no-mixed-spaces-and-tabs */
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	BaseEntity,
	OneToOne,
	JoinColumn,
} from 'typeorm'
import { User } from './User.js'

@Entity()
export class UserRefreshToken extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
  	id!: string

    @Column()
  	refreshToken!: string

    @Column({ unique: true })
  	userId!: string

    @OneToOne(() => User)
    @JoinColumn()
  	user!: User
}
