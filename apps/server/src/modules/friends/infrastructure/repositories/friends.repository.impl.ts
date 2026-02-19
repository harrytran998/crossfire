import { Context, Effect, Layer } from 'effect'
import { DatabaseService } from '../../../../services/database.service'
import type { FriendsRepository as FriendsRepositoryType } from '../../domain/repositories/friends.repository'
import type { FriendPlayer, FriendshipRow } from '../../domain/entities/friends.entity'
import { mapFriendshipRowToEntity } from '../../domain/entities/friends.entity'

export const FriendsRepository = Context.GenericTag<FriendsRepositoryType>('FriendsRepository')

const friendshipColumns = [
  'id',
  'requester_id',
  'addressee_id',
  'status',
  'created_at',
  'updated_at',
] as const

export const FriendsRepositoryLive = Layer.effect(
  FriendsRepository,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService

    const findRelation: FriendsRepositoryType['findRelation'] = (requesterId, addresseeId) =>
      Effect.promise(async () => {
        const row = await db
          .selectFrom('friendships')
          .where('requester_id', '=', requesterId)
          .where('addressee_id', '=', addresseeId)
          .select(friendshipColumns)
          .executeTakeFirst()
        return row ? mapFriendshipRowToEntity(row as unknown as FriendshipRow) : null
      }).pipe(Effect.orDie)

    const createOrReopenRequest: FriendsRepositoryType['createOrReopenRequest'] = (
      requesterId,
      addresseeId
    ) =>
      Effect.promise(async () => {
        const created = await db
          .insertInto('friendships')
          .values({
            requester_id: requesterId,
            addressee_id: addresseeId,
            status: 'pending',
          })
          .onConflict((oc) =>
            oc.columns(['requester_id', 'addressee_id']).doUpdateSet({
              status: 'pending',
              updated_at: new Date(),
            })
          )
          .returning(friendshipColumns)
          .executeTakeFirstOrThrow()

        return mapFriendshipRowToEntity(created as unknown as FriendshipRow)
      }).pipe(Effect.orDie)

    const listIncomingRequests: FriendsRepositoryType['listIncomingRequests'] = (playerId) =>
      Effect.promise(async () => {
        const rows = await db
          .selectFrom('friendships')
          .where('addressee_id', '=', playerId)
          .where('status', '=', 'pending')
          .select(friendshipColumns)
          .orderBy('created_at', 'desc')
          .execute()
        return rows.map((row) => mapFriendshipRowToEntity(row as unknown as FriendshipRow))
      }).pipe(Effect.orDie)

    const listOutgoingRequests: FriendsRepositoryType['listOutgoingRequests'] = (playerId) =>
      Effect.promise(async () => {
        const rows = await db
          .selectFrom('friendships')
          .where('requester_id', '=', playerId)
          .where('status', '=', 'pending')
          .select(friendshipColumns)
          .orderBy('created_at', 'desc')
          .execute()
        return rows.map((row) => mapFriendshipRowToEntity(row as unknown as FriendshipRow))
      }).pipe(Effect.orDie)

    const updateRequestStatusForAddressee: FriendsRepositoryType['updateRequestStatusForAddressee'] =
      (friendshipId, addresseeId, status) =>
        Effect.promise(async () => {
          const row = await db
            .updateTable('friendships')
            .set({ status, updated_at: new Date() })
            .where('id', '=', friendshipId)
            .where('addressee_id', '=', addresseeId)
            .where('status', '=', 'pending')
            .returning(friendshipColumns)
            .executeTakeFirst()

          return row ? mapFriendshipRowToEntity(row as unknown as FriendshipRow) : null
        }).pipe(Effect.orDie)

    const listFriends: FriendsRepositoryType['listFriends'] = (playerId) =>
      Effect.promise(async () => {
        const rows = await db
          .selectFrom('friendships as f')
          .innerJoin('players as requester', 'requester.id', 'f.requester_id')
          .innerJoin('players as addressee', 'addressee.id', 'f.addressee_id')
          .where('f.status', '=', 'accepted')
          .where((eb) =>
            eb.or([eb('f.requester_id', '=', playerId), eb('f.addressee_id', '=', playerId)])
          )
          .select([
            'f.id as friendship_id',
            'f.requester_id',
            'f.addressee_id',
            'f.updated_at',
            'requester.display_name as requester_name',
            'addressee.display_name as addressee_name',
          ])
          .orderBy('f.updated_at', 'desc')
          .execute()

        const friends: FriendPlayer[] = rows.map((row) => {
          const friendPlayerId =
            row.requester_id === playerId ? row.addressee_id : (row.requester_id as string)
          const displayName =
            row.requester_id === playerId
              ? (row.addressee_name as unknown as string)
              : (row.requester_name as unknown as string)

          return {
            playerId: friendPlayerId,
            displayName,
            friendshipId: row.friendship_id as unknown as string,
            since: row.updated_at as unknown as Date,
          }
        })

        return friends
      }).pipe(Effect.orDie)

    const removeFriendRelation: FriendsRepositoryType['removeFriendRelation'] = (
      playerId,
      friendPlayerId
    ) =>
      Effect.promise(async () => {
        const deleted = await db
          .deleteFrom('friendships')
          .where('status', '=', 'accepted')
          .where((eb) =>
            eb.or([
              eb.and([eb('requester_id', '=', playerId), eb('addressee_id', '=', friendPlayerId)]),
              eb.and([eb('requester_id', '=', friendPlayerId), eb('addressee_id', '=', playerId)]),
            ])
          )
          .returning(['id'])
          .executeTakeFirst()

        return Boolean(deleted)
      }).pipe(Effect.orDie)

    return FriendsRepository.of({
      findRelation,
      createOrReopenRequest,
      listIncomingRequests,
      listOutgoingRequests,
      updateRequestStatusForAddressee,
      listFriends,
      removeFriendRelation,
    })
  })
)
