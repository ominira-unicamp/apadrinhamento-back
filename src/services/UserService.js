import { EntryExistsError } from "#errors/EntryExists.js";
import { prisma } from "../PrismaClient.js";

const PRISMA_ERRORS = {
    alreadyExists: "P2002",
};

const SELECTION_SET = {
    id: true,
    name: true,
    email: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
};

async function add(data) {
    let user;
    try {
        user = await prisma.user.create({
            data,
            select: SELECTION_SET,
        });
    } catch (error) {
        if (error.code == PRISMA_ERRORS.alreadyExists) {
            throw new EntryExistsError();
        } else {
            throw error;
        }
    }

    return user;
}

async function read(id) {
    const user = await prisma.user.findUnique({
        include: {
            godchildRelation: {
                include: {
                    godparent: {
                        select: {
                            name: true,
                            course: true,
                            email: true,
                            picture: true,
                            hobby: true,
                            music: true,
                            games: true,
                            sports: true,
                            parties: true,
                            city: true,
                            telephone: true,
                            yearOfEntry: true,
                        }
                    },
                }
            },
            godparentRelation: {
                include: {
                    godchild: {
                        select: {
                            name: true,
                            course: true,
                            email: true,
                            picture: true,
                            hobby: true,
                            music: true,
                            games: true,
                            sports: true,
                            parties: true,
                            city: true,
                            telephone: true,
                            yearOfEntry: true,
                        }
                    },
                }
            }
        },
        where: {
            id,
        },
    });

    return user;
}

async function update(id, data) {
    const user = await prisma.user.update({
        where: {
            id,
        },
        data,
        select: SELECTION_SET,
    });

    return user;
}

async function del(id) {
    const user = await prisma.user.delete({
        where: {
            id,
        },
        select: SELECTION_SET,
    });

    return user;
}

async function getStats() {
    const vets = await prisma.user.count({
        where: {
            role: 'veterane',
            status: true,
        },
    });

    const bixes = await prisma.user.count({
        where: {
            role: 'bixe',
            status: true,
        },
    });

    const pending = await prisma.user.count({
        where: {
            status: false,
        },
    });

    const approved = await prisma.user.count({
        where: {
            approved: true,
            role: 'veterane',
        },
    });

    return { vets, bixes, approved, pending };
}

async function getAuthData(email) {
    const user = await prisma.user.findUnique({
        where: {
            email,
        },
        select: {
            id: true,
            password: true,
            status: true,
            role: true,
            name: true,
        },
    });

    return user;
}

async function getToMatch() {
    const users = await prisma.$queryRaw`SELECT id, course, pronouns, ethnicity, lgbt, city, hobby, role, parties, music, games, sports FROM USERS WHERE ("role" = 'veterane' AND "approvalStatus" = 'APPROVED' AND (SELECT COUNT(*) FROM "godparent_relations" WHERE "godparentId" = "users"."id") < 2) OR ("role" = 'bixe' AND "status" = true AND (SELECT COUNT(*) FROM "godparent_relations" WHERE "godchildId" = "users"."id") = 0)`;

    const admins = await prisma.$queryRaw`SELECT id, course, pronouns, ethnicity, lgbt, city, hobby, role, parties, music, games, sports FROM USERS WHERE ("role" = 'ADMIN' AND "status" = true AND (SELECT COUNT(*) FROM "godparent_relations" WHERE "godparentId" = "users"."id") < 2)`;

    for (const user of admins) {
        user.role = 'veterane';
        users.push(user);
    }

    return users;
}

async function getPendingApproval() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            course: true,
            picture: true,
            telephone: true,
            yearOfEntry: true,
            role: true,
        },
        where: {
            approvalStatus: 'PENDING',
            role: 'veterane',
        }
    });

    return users;
}

async function approve(id) {
    const user = await prisma.user.update({
        where: {
            id,
        },
        data: {
            approvalStatus: 'APPROVED',
        },
    });

    return user;
}

async function unapprove(id) {
    const user = await prisma.user.update({
        where: {
            id,
        },
        data: {
            approvalStatus: 'REJECTED',
        },
    });

    return user;
}

async function getAllUsers() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            course: true,
            role: true,
            approvalStatus: true,
            status: true,
            telephone: true,
            yearOfEntry: true,
            createdAt: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return users;
}

async function addGodparentRelations(data) {
    const toAdd = [];
    
    for (const godchild of Object.keys(data)) {
        for (const godparent of data[godchild]) {
            toAdd.push({
                godchildId: godchild,
                godparentId: godparent,
            });
        }
    }

    const relations = await prisma.godparentRelation.createMany({
        data: toAdd,
    });

    return relations;
}

export default { add, read, update, del, getAuthData, getToMatch, getPendingApproval, approve, unapprove, getAllUsers, getStats, addGodparentRelations };
