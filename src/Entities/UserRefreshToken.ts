import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToOne,
  JoinColumn,
} from 'typeorm'
import { User } from './User'
import { type } from 'os'

@Entity()
export class UserRefreshToken extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  refreshToken: string

  @Column({ unique: true })
  userFk: string

  @OneToOne(() => User)
  @JoinColumn()
  user: User
}
