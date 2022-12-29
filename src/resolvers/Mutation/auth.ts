import { User, Prisma } from "@prisma/client"
import validator from "validator"
import bcrypt from "bcryptjs"
import JWT from "jsonwebtoken"

import { Context } from "../../index"
import { JWT_SIGNATURE } from "../../keys"

interface SignupArgs {
	email: string
	name: string
	bio: string
	password: string
}

interface UserPayloadType {
	userErrors: {
		message: string
	}[]
	token: string | null
}

export const authResolvers = {
	signup: async (
		_: any,
		{ email, name, bio, password }: SignupArgs,
		{ prisma }: Context
	): Promise<UserPayloadType> => {
		const isEmail = validator.isEmail(email)

		if (!isEmail)
			return {
				userErrors: [
					{
						message: "Invalid email",
					},
				],
				token: null,
			}

		if (!name || !bio) {
			return {
				userErrors: [
					{
						message: "Invalid name or bio",
					},
				],
				token: null,
			}
		}

		const isValidPassword = validator.isLength(password, { min: 5 })
		if (!isValidPassword) {
			return {
				userErrors: [
					{
						message: "Invalid password",
					},
				],
				token: null,
			}
		}

		const hashedPassword = await bcrypt.hash(password, 10)

		const user = await prisma.user.create({
			data: {
				email,
				name,
				password: hashedPassword,
			},
		})

		const token = await JWT.sign(
			{ userId: user.id, email: user.email },
			JWT_SIGNATURE,
			{ expiresIn: 360000 }
		)

		return {
			userErrors: [
				{
					message: "",
				},
			],
			token,
		}
	},
}
