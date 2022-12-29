import { Post, Prisma } from "@prisma/client"
import { Context } from "./../index"

interface PostArgs {
	post: {
		title?: string
		content?: string
	}
}

interface PostPayloadType {
	userErrors: {
		message: string
	}[]
	post: Post | Prisma.Prisma__PostClient<Post> | null
}

export const Mutation = {
	postCreate: async (
		_: any,
		{ post }: PostArgs,
		{ prisma }: Context
	): Promise<PostPayloadType> => {
		const { title, content } = post
		// validate data
		if (!title || !content)
			return {
				userErrors: [{ message: "You must provide all data" }],
				post: null,
			}

		return {
			userErrors: [],
			post: prisma.post.create({
				data: {
					title,
					content,
					authorId: 1,
				},
			}),
		}
	},

	postUpdate: async (
		_: any,
		{ postId, post }: { postId: string; post: PostArgs["post"] },
		{ prisma }: Context
	): Promise<PostPayloadType> => {
		const { title, content } = post
		if (!title && !content)
			return {
				userErrors: [{ message: "You must provide some data to update" }],
				post: null,
			}
		const existingPost = await prisma.post.findUnique({
			where: { id: Number(postId) },
		})
		if (!existingPost)
			return {
				userErrors: [{ message: "Post does not exists" }],
				post: null,
			}

		let payloadToUpdate = { title, content }
		// check other way to do this!
		if (!title) delete payloadToUpdate.title
		if (!content) delete payloadToUpdate.content

		return {
			userErrors: [],
			post: prisma.post.update({
				data: {
					...payloadToUpdate,
				},
				where: { id: Number(postId) },
			}),
		}
	},
}
