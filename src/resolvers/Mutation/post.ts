import { canUserMutatePost } from "./../../utils/canUserMutatePost"
import { Post, Prisma } from "@prisma/client"
import { Context } from "../../index"

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

export const postResolvers = {
	postCreate: async (
		_: any,
		{ post }: PostArgs,
		{ prisma, userInfo }: Context
	): Promise<PostPayloadType> => {
		// do this with middleware instead
		if (!userInfo)
			return { userErrors: [{ message: "Forbidden access" }], post: null }

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
					authorId: userInfo.userId,
				},
			}),
		}
	},

	postUpdate: async (
		_: any,
		{ postId, post }: { postId: string; post: PostArgs["post"] },
		{ prisma, userInfo }: Context
	): Promise<PostPayloadType> => {
		// do this with middleware instead
		if (!userInfo)
			return { userErrors: [{ message: "Forbidden access" }], post: null }

		const error = await canUserMutatePost({
			userId: userInfo.userId,
			postId: Number(postId),
			prisma,
		})
		if (error) return error

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
				userErrors: [{ message: "Post does not exist" }],
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

	postDelete: async (
		_: any,
		{ postId }: { postId: string },
		{ prisma, userInfo }: Context
	): Promise<PostPayloadType> => {
		const post = await prisma.post.findUnique({
			where: { id: Number(postId) },
		})
		// do this with middleware instead
		if (!userInfo)
			return { userErrors: [{ message: "Forbidden access" }], post: null }

		const error = await canUserMutatePost({
			userId: userInfo.userId,
			postId: Number(postId),
			prisma,
		})
		if (error) return error

		if (!post)
			return {
				userErrors: [{ message: "Post does not exists" }],
				post: null,
			}

		await prisma.post.delete({ where: { id: Number(postId) } })
		return {
			userErrors: [],
			post,
		}
	},

	postPublish: async (
		_: any,
		{ postId }: { postId: string },
		{ prisma, userInfo }: Context
	) => {
		// do this with middleware instead
		if (!userInfo)
			return { userErrors: [{ message: "Forbidden access" }], post: null }

		const error = await canUserMutatePost({
			userId: userInfo.userId,
			postId: Number(postId),
			prisma,
		})
		if (error) return error

		return {
			userErrors: [],
			post: prisma.post.update({
				where: { id: Number(postId) },
				data: { published: true },
			}),
		}
	},
	postUnpublish: async (
		_: any,
		{ postId }: { postId: string },
		{ prisma, userInfo }: Context
	) => {
		// do this with middleware instead
		if (!userInfo)
			return { userErrors: [{ message: "Forbidden access" }], post: null }

		const error = await canUserMutatePost({
			userId: userInfo.userId,
			postId: Number(postId),
			prisma,
		})
		if (error) return error

		return {
			userErrors: [],
			post: prisma.post.update({
				where: { id: Number(postId) },
				data: { published: false },
			}),
		}
	},
}
