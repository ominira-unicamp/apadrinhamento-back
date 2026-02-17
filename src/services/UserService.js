import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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

function getResetConfig() {
    const secret = process.env.RESET_PASSWORD_JWT_SECRET || process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("Missing reset password JWT secret");
    }

    const ttl = Number.parseInt(
        process.env.RESET_PASSWORD_TOKEN_TTL ?? "900",
        10,
    );

    return {
        secret,
        ttl,
        issuer: process.env.RESET_PASSWORD_ISSUER ?? "apadrinhamento-back",
        audience: process.env.RESET_PASSWORD_AUDIENCE ?? "password-reset",
    };
}

function hashResetTokenId(jti) {
    return crypto.createHash("sha256").update(jti).digest("hex");
}

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
            selectedGodparents: {
                select: {
                    id: true,
                    name: true,
                    course: true,
                    email: true,
                    picture: true,
                    whiteboard: true,
                    hobby: true,
                    music: true,
                    games: true,
                    sports: true,
                    parties: true,
                    city: true,
                    telephone: true,
                    yearOfEntry: true,
                    pronouns: true,
                    ethnicity: true,
                    lgbt: true,
                }
            },
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
    // Accounts that finished signup as vets (did step-two but might not be approved yet)
    const vets = await prisma.user.count({
        where: {
            role: 'veterane',
            status: true,
        },
    });

    // Accounts that finished signup as bixes (did step-two)
    const bixes = await prisma.user.count({
        where: {
            role: 'bixe',
            status: true,
        },
    });

    // Accounts that still didn't finish signup (didn't do step-two)
    const pending = await prisma.user.count({
        where: {
            status: false,
        },
    });

    // Approved vets whose accounts are finished
    const approved = await prisma.user.count({
        where: {
            approvalStatus: 'APPROVED',
            role: 'veterane',
            status: true
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

async function getGodparents() {
    const godparents = await prisma.user.findMany({
        where: {
            OR: [
                { role: 'veterane' },
                { role: 'ADMIN' },
            ],
            status: true,
            approvalStatus: 'APPROVED',
        },
        select: {
            id: true,
            name: true,
            course: true,
            hobby: true,
            music: true,
            games: true,
            sports: true,
            parties: true,
            city: true,
            whiteboard: true,
            yearOfEntry: true,
            _count: {
                select: {
                    godchildRelation: true,
                },
            }
        }
    });

    return godparents.filter(godparent => godparent._count.godchildRelation < 2).map(godparent => {
        delete godparent._count;
        return godparent;
    });
}

async function findByEmail(email) {
    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    return user;
}

async function createPasswordResetToken(user) {
    const { secret, ttl, issuer, audience } = getResetConfig();
    const jti = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + ttl * 1000);
    const tokenHash = hashResetTokenId(jti);

    await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
    });

    await prisma.passwordResetToken.create({
        data: {
            userId: user.id,
            tokenHash,
            expiresAt,
        },
    });

    const token = jwt.sign(
        {
            id: user.id,
            name: user.name,
            jti,
            typ: "password-reset",
        },
        secret,
        {
            expiresIn: `${ttl}s`,
            issuer,
            audience,
        },
    );

    return token;
}

async function consumePasswordResetToken(token, newPasswordHash) {
    const { secret, issuer, audience } = getResetConfig();
    let payload;

    try {
        payload = jwt.verify(token, secret, { issuer, audience });
    } catch {
        return null;
    }

    if (!payload || payload.typ !== "password-reset" || !payload.jti) {
        return null;
    }

    const userId = payload.id || payload.sub;
    if (!userId) {
        return null;
    }

    const tokenHash = hashResetTokenId(payload.jti);

    return prisma.$transaction(async (tx) => {
        const tokenRecord = await tx.passwordResetToken.findFirst({
            where: {
                userId,
                tokenHash,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
        });

        if (!tokenRecord) {
            return null;
        }

        await tx.passwordResetToken.update({
            where: { id: tokenRecord.id },
            data: { usedAt: new Date() },
        });

        await tx.user.update({
            where: { id: userId },
            data: { password: newPasswordHash },
        });

        return { userId, name: payload.name };
    });
}

async function updatePassword(userId, currentPasswordHash, newPasswordHash) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
    });

    if (!user) {
        return null;
    }

    const passwordMatch = await bcrypt.compare(currentPasswordHash, user.password);
    if (!passwordMatch) {
        return null;
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { password: newPasswordHash },
        select: SELECTION_SET,
    });

    return updatedUser;
}

export default { add, read, update, del, getAuthData, getToMatch, getPendingApproval, approve, unapprove, getAllUsers, getStats, addGodparentRelations, getGodparents, findByEmail, createPasswordResetToken, consumePasswordResetToken, updatePassword };
