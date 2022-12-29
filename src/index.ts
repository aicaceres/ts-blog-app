import { ApolloServer } from "apollo-server"
import { PrismaClient, Prisma } from "@prisma/client"

import { typeDefs } from "./schema"
import { Mutation } from "./resolvers"

const prisma = new PrismaClient()
export interface Context {
  prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>
}

const server = new ApolloServer({
	typeDefs,
	resolvers: { Mutation },
	context: { prisma },
})

server.listen().then(({ url }) => console.log(`Server is ready on ${url}`))
