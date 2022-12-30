import { User, Prisma } from "@prisma/client"
import validator from "validator"
import bcrypt from "bcryptjs"
import JWT from "jsonwebtoken"

import { Context } from "../../index"
import { JWT_SIGNATURE } from "../../keys"

interface SignupArgs {
	credentials: {
		email: string
		password: string
	}
	name?: string
	bio?: string
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
		{ credentials, name, bio }: SignupArgs,
		{ prisma }: Context
	): Promise<UserPayloadType> => {
		const { email, password } = credentials
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

		await prisma.profile.create({
			data: {
				bio,
				userId: user.id,
			},
		})

		return {
			userErrors: [
				{
					message: "",
				},
			],
			token: JWT.sign({ userId: user.id, email: user.email }, JWT_SIGNATURE, {
				expiresIn: 360000,
			}),
		}
	},

	signin: async (
		_: any,
		{ credentials }: SignupArgs,
		{ prisma }: Context
	): Promise<UserPayloadType> => {
		const { email, password } = credentials
		const user = await prisma.user.findUnique({ where: { email } })
		if (!user)
			return {
				userErrors: [
					{
						message: "Invalid credentials",
					},
				],
				token: null,
			}

		const isMatch = await bcrypt.compare(password, user.password)
		if (!isMatch)
			return {
				userErrors: [
					{
						message: "Invalid credentials",
					},
				],
				token: null,
			}

		return {
			userErrors: [
				{
					message: "",
				},
			],
			token: JWT.sign({ userId: user.id, email: user.email }, JWT_SIGNATURE, {
				expiresIn: 360000,
			}),
		}
	},
}
